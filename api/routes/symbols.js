const express = require("express");
const router = express.Router();
const { Symbol } = require("../models");
const { Op, Sequelize } = require("sequelize");
const multer = require("multer");
const XLSX = require("xlsx");

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// GET /api/symbols - Search symbols with pagination
router.get("/", async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const queryLimit = parseInt(limit);

    let whereClause = {};

    // Add search functionality
    if (search) {
      whereClause = {
        [Op.or]: [
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("bse")),
            "LIKE",
            `%${search.toLowerCase()}%`
          ),
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("nse")),
            "LIKE",
            `%${search.toLowerCase()}%`
          ),
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("name")),
            "LIKE",
            `%${search.toLowerCase()}%`
          ),
        ],
      };
    }

    const { rows: symbols, count: totalItems } = await Symbol.findAndCountAll({
      where: whereClause,
      order: [["name", "ASC"]],
      offset,
      limit: queryLimit,
    });

    const totalPages = Math.ceil(totalItems / queryLimit);

    res.json({
      symbols,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems,
        hasMore: parseInt(page) < totalPages,
        itemsPerPage: queryLimit,
      },
    });
  } catch (error) {
    console.error("Error fetching symbols:", error);
    res.status(500).json({ error: "Failed to fetch symbols" });
  }
});

// POST /api/symbols - Create a new symbol
router.post("/", async (req, res) => {
  try {
    const { bse, nse, name } = req.body;

    // Validation
    if (!name || (!bse && !nse)) {
      return res.status(400).json({
        error:
          "Name is required and at least one of BSE or NSE code must be provided",
      });
    }

    // Check for duplicates
    const existingSymbol = await Symbol.findOne({
      where: {
        [Op.or]: [bse ? { bse } : null, nse ? { nse } : null].filter(Boolean),
      },
    });

    if (existingSymbol) {
      return res.status(400).json({
        error: "Symbol with this BSE or NSE code already exists",
      });
    }

    const symbol = await Symbol.create({
      bse: bse || null,
      nse: nse || null,
      name,
    });

    res.status(201).json(symbol);
  } catch (error) {
    console.error("Error creating symbol:", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      res.status(400).json({ error: "Symbol with this code already exists" });
    } else {
      res.status(500).json({ error: "Failed to create symbol" });
    }
  }
});

// PUT /api/symbols/:id - Update a symbol
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { bse, nse, name } = req.body;

    // Validation
    if (!name || (!bse && !nse)) {
      return res.status(400).json({
        error:
          "Name is required and at least one of BSE or NSE code must be provided",
      });
    }

    // Check if symbol exists
    const symbol = await Symbol.findByPk(id);
    if (!symbol) {
      return res.status(404).json({ error: "Symbol not found" });
    }

    // Check for duplicates (excluding current symbol)
    const existingSymbol = await Symbol.findOne({
      where: {
        id: { [Op.ne]: id },
        [Op.or]: [bse ? { bse } : null, nse ? { nse } : null].filter(Boolean),
      },
    });

    if (existingSymbol) {
      return res.status(400).json({
        error: "Another symbol with this BSE or NSE code already exists",
      });
    }

    await symbol.update({
      bse: bse || null,
      nse: nse || null,
      name,
    });

    res.json(symbol);
  } catch (error) {
    console.error("Error updating symbol:", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      res.status(400).json({ error: "Symbol with this code already exists" });
    } else {
      res.status(500).json({ error: "Failed to update symbol" });
    }
  }
});

// DELETE /api/symbols/:id - Delete a symbol
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const symbol = await Symbol.findByPk(id);
    if (!symbol) {
      return res.status(404).json({ error: "Symbol not found" });
    }

    await symbol.destroy();
    res.json({ message: "Symbol deleted successfully" });
  } catch (error) {
    console.error("Error deleting symbol:", error);
    res.status(500).json({ error: "Failed to delete symbol" });
  }
});

// POST /api/symbols/upload - Upload symbols from Excel
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Parse Excel file
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({ error: "Excel file is empty" });
    }

    // Validate required columns
    const requiredColumns = ["BSE", "NSE", "Name"];
    const firstRow = data[0];
    const hasRequiredColumns = requiredColumns.some((col) =>
      Object.keys(firstRow).some((key) =>
        key.toLowerCase().includes(col.toLowerCase())
      )
    );

    if (!hasRequiredColumns) {
      return res.status(400).json({
        error: "Excel file must contain BSE, NSE, and Name columns",
      });
    }

    // Process and validate data
    const symbolsToInsert = [];
    const errors = [];
    const seenBSE = new Set();
    const seenNSE = new Set();
    let duplicatesSkipped = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // Excel row number (accounting for header)

      // Find column values (case-insensitive)
      const bseKey = Object.keys(row).find((key) =>
        key.toLowerCase().includes("bse")
      );
      const nseKey = Object.keys(row).find((key) =>
        key.toLowerCase().includes("nse")
      );
      const nameKey = Object.keys(row).find((key) =>
        key.toLowerCase().includes("name")
      );

      const bse =
        bseKey &&
        row[bseKey] !== null &&
        row[bseKey] !== undefined &&
        String(row[bseKey]).trim() !== ""
          ? String(row[bseKey]).trim()
          : null;

      const nse =
        nseKey &&
        row[nseKey] !== null &&
        row[nseKey] !== undefined &&
        String(row[nseKey]).trim() !== ""
          ? String(row[nseKey]).trim()
          : null;

      const name =
        nameKey &&
        row[nameKey] !== null &&
        row[nameKey] !== undefined &&
        String(row[nameKey]).trim() !== ""
          ? String(row[nameKey]).trim()
          : null;

      // Validate row
      if (!name) {
        errors.push(`Row ${rowNum}: Name is required`);
        continue;
      }

      if (!bse && !nse) {
        errors.push(
          `Row ${rowNum}: At least one of BSE or NSE code must be provided`
        );
        continue;
      }

      // Skip duplicates within Excel file
      if ((bse && seenBSE.has(bse)) || (nse && seenNSE.has(nse))) {
        duplicatesSkipped++;
        console.log(
          `Skipping duplicate in Excel: ${name} - BSE: ${bse}, NSE: ${nse}`
        );
        continue;
      }

      // Add to seen sets
      if (bse) seenBSE.add(bse);
      if (nse) seenNSE.add(nse);

      symbolsToInsert.push({
        bse: bse,
        nse: nse,
        name: name,
      });
    }

    if (errors.length > 0) {
      return res
        .status(400)
        .json({ error: "Validation errors", details: errors });
    }

    // Check for existing symbols in database
    // Get all BSE and NSE codes from symbols to insert (excluding null/empty values)
    const bseCodesToCheck = symbolsToInsert
      .filter((s) => s.bse && String(s.bse).trim() !== "")
      .map((s) => String(s.bse).trim());
    const nseCodesToCheck = symbolsToInsert
      .filter((s) => s.nse && String(s.nse).trim() !== "")
      .map((s) => String(s.nse).trim());

    let existingSymbols = [];

    if (bseCodesToCheck.length > 0 || nseCodesToCheck.length > 0) {
      const whereConditions = [];

      if (bseCodesToCheck.length > 0) {
        whereConditions.push({
          bse: {
            [Op.in]: bseCodesToCheck,
          },
        });
      }

      if (nseCodesToCheck.length > 0) {
        whereConditions.push({
          nse: {
            [Op.in]: nseCodesToCheck,
          },
        });
      }

      existingSymbols = await Symbol.findAll({
        where: {
          [Op.or]: whereConditions,
        },
      });

      console.log(
        `Found ${existingSymbols.length} existing symbols in database`
      );
      existingSymbols.forEach((symbol) => {
        console.log(
          `Existing: ${symbol.name} - BSE: ${symbol.bse}, NSE: ${symbol.nse}`
        );
      });
    }

    // Filter out symbols that have matching BSE or NSE codes in database
    const filteredSymbols = symbolsToInsert.filter((newSymbol) => {
      const isExisting = existingSymbols.some((existing) => {
        // Normalize values for comparison
        const newBse = newSymbol.bse ? String(newSymbol.bse).trim() : null;
        const newNse = newSymbol.nse ? String(newSymbol.nse).trim() : null;
        const existingBse = existing.bse ? String(existing.bse).trim() : null;
        const existingNse = existing.nse ? String(existing.nse).trim() : null;

        // Check if either BSE or NSE code matches
        const bseMatches = newBse && existingBse && newBse === existingBse;
        const nseMatches = newNse && existingNse && newNse === existingNse;

        if (bseMatches || nseMatches) {
          console.log(`Match found for ${newSymbol.name}:`);
          console.log(`  New: BSE=${newBse}, NSE=${newNse}`);
          console.log(`  Existing: BSE=${existingBse}, NSE=${existingNse}`);
        }

        return bseMatches || nseMatches;
      });

      // Log for debugging
      if (isExisting) {
        console.log(
          `Skipping symbol ${newSymbol.name} - matches existing BSE/NSE code`
        );
      }

      return !isExisting;
    });

    const databaseDuplicatesSkipped =
      symbolsToInsert.length - filteredSymbols.length;

    console.log(
      `Upload summary: Total processed: ${symbolsToInsert.length}, Database duplicates skipped: ${databaseDuplicatesSkipped}, Will insert: ${filteredSymbols.length}`
    );

    if (filteredSymbols.length === 0) {
      return res.json({
        message: "No new symbols to insert - all were duplicates",
        created: 0,
        skipped: duplicatesSkipped + databaseDuplicatesSkipped,
        total: data.length,
        excelDuplicatesSkipped: duplicatesSkipped,
        databaseDuplicatesSkipped: databaseDuplicatesSkipped,
      });
    }

    // Bulk insert
    const createdSymbols = await Symbol.bulkCreate(filteredSymbols, {
      validate: true,
    });

    res.json({
      message: "Symbols uploaded successfully",
      created: createdSymbols.length,
      skipped: duplicatesSkipped + databaseDuplicatesSkipped,
      total: data.length,
      excelDuplicatesSkipped: duplicatesSkipped,
      databaseDuplicatesSkipped: databaseDuplicatesSkipped,
    });
  } catch (error) {
    console.error("Error uploading symbols:", error);
    res.status(500).json({ error: "Failed to upload symbols" });
  }
});

module.exports = router;
