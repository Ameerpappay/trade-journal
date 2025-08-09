const express = require("express");
const router = express.Router();
const { Screener, Stock, StockScreenerResult, User } = require("../models");
const { authenticateToken } = require("../middleware/auth");
const { Op } = require("sequelize");

// Get all screeners for the user
router.get("/", async (req, res) => {
  try {
    const screeners = await Screener.findAll({
      // Remove the isActive filter to show all screeners
      order: [["scanName", "ASC"]],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    // Transform to match expected format - use the model field names directly
    const transformedScreeners = screeners.map((screener) => ({
      id: screener.id,
      scanName: screener.scanName,
      description: screener.description || "",
      sourceName: screener.sourceName,
      sourceUrl: screener.sourceUrl || "",
      isActive: Boolean(screener.isActive),
      createdAt: screener.createdAt,
      updatedAt: screener.updatedAt,
      user: screener.user || null,
    }));

    res.json({
      success: true,
      screeners: transformedScreeners,
    });
  } catch (error) {
    console.error("Error fetching screeners:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Get screener by ID with latest results
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query; // Optional date filter

    const screener = await Screener.findOne({
      where: {
        id,
        [Op.or]: [{ userId: req.user.id }, { userId: null }],
        isActive: true,
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    if (!screener) {
      return res.status(404).json({ error: "Screener not found" });
    }

    // Get latest results
    const whereClause = { screenerId: id, isMatch: true };
    if (date) {
      whereClause.scanDate = date;
    }

    const results = await StockScreenerResult.findAll({
      where: whereClause,
      include: [
        {
          model: Stock,
          as: "stock",
          attributes: [
            "id",
            "stockName",
            "nseCode",
            "bseCode",
            "currentPrice",
            "dayChange",
            "dayChangePercent",
            "industry",
          ],
        },
      ],
      order: [
        ["scanDate", "DESC"],
        ["createdAt", "DESC"],
      ],
      limit: 100,
    });

    res.json({
      screener,
      results,
      totalMatches: results.length,
    });
  } catch (error) {
    console.error("Error fetching screener:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create new screener
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { scanName, description, sourceName, sourceUrl } = req.body;

    // Check if scan name already exists
    const existingScreener = await Screener.findOne({
      where: { scanName },
    });

    if (existingScreener) {
      return res
        .status(400)
        .json({ error: "Screener with this name already exists" });
    }

    const screener = await Screener.create({
      scanName,
      description,
      sourceName,
      sourceUrl,
      userId: req.user.id,
    });

    res.status(201).json(screener);
  } catch (error) {
    console.error("Error creating screener:", error);
    if (error.name === "SequelizeValidationError") {
      return res
        .status(400)
        .json({ error: error.errors.map((e) => e.message) });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update screener
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { scanName, description, sourceName, sourceUrl, isActive } = req.body;

    // Check ownership
    const screener = await Screener.findOne({
      where: { id, userId: req.user.id },
    });

    if (!screener) {
      return res
        .status(404)
        .json({ error: "Screener not found or not owned by user" });
    }

    // Check if new scan name conflicts with existing ones
    if (scanName && scanName !== screener.scanName) {
      const existingScreener = await Screener.findOne({
        where: { scanName, id: { [Op.ne]: id } },
      });

      if (existingScreener) {
        return res
          .status(400)
          .json({ error: "Screener with this name already exists" });
      }
    }

    await screener.update({
      scanName: scanName || screener.scanName,
      description:
        description !== undefined ? description : screener.description,
      sourceName: sourceName || screener.sourceName,
      sourceUrl: sourceUrl !== undefined ? sourceUrl : screener.sourceUrl,
      isActive: isActive !== undefined ? isActive : screener.isActive,
    });

    res.json(screener);
  } catch (error) {
    console.error("Error updating screener:", error);
    if (error.name === "SequelizeValidationError") {
      return res
        .status(400)
        .json({ error: error.errors.map((e) => e.message) });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete screener
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const screener = await Screener.findOne({
      where: { id },
    });

    if (!screener) {
      return res
        .status(404)
        .json({ error: "Screener not found or not owned by user" });
    }

    // Soft delete
    await screener.update({ isActive: false });

    res.json({ message: "Screener deleted successfully" });
  } catch (error) {
    console.error("Error deleting screener:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get screener results by date range
router.get("/:id/results", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { fromDate, toDate, limit = 50 } = req.query;

    // Check access to screener
    const screener = await Screener.findOne({
      where: {
        id,
        [Op.or]: [{ userId: req.user.id }, { userId: null }],
        isActive: true,
      },
    });

    if (!screener) {
      return res.status(404).json({ error: "Screener not found" });
    }

    const whereClause = { screenerId: id, isMatch: true };

    if (fromDate) {
      whereClause.scanDate = { [Op.gte]: fromDate };
    }

    if (toDate) {
      if (whereClause.scanDate) {
        whereClause.scanDate[Op.lte] = toDate;
      } else {
        whereClause.scanDate = { [Op.lte]: toDate };
      }
    }

    const results = await StockScreenerResult.findAll({
      where: whereClause,
      include: [
        {
          model: Stock,
          as: "stock",
          attributes: [
            "id",
            "stockName",
            "nseCode",
            "bseCode",
            "currentPrice",
            "dayChange",
            "dayChangePercent",
            "industry",
          ],
        },
      ],
      order: [
        ["scanDate", "DESC"],
        ["createdAt", "DESC"],
      ],
      limit: parseInt(limit),
    });

    // Group by date for better visualization
    const groupedResults = results.reduce((acc, result) => {
      const date = result.scanDate;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(result);
      return acc;
    }, {});

    res.json({
      screener,
      results: groupedResults,
      totalMatches: results.length,
    });
  } catch (error) {
    console.error("Error fetching screener results:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get unique scan dates for a screener
router.get("/:id/dates", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check access to screener
    const screener = await Screener.findOne({
      where: {
        id,
        [Op.or]: [{ userId: req.user.id }, { userId: null }],
        isActive: true,
      },
    });

    if (!screener) {
      return res.status(404).json({ error: "Screener not found" });
    }

    const dates = await StockScreenerResult.findAll({
      where: { screenerId: id },
      attributes: ["scanDate"],
      group: ["scanDate"],
      order: [["scanDate", "DESC"]],
      raw: true,
    });

    res.json(dates.map((d) => d.scanDate));
  } catch (error) {
    console.error("Error fetching screener dates:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
