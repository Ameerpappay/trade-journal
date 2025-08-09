const express = require("express");
const router = express.Router();
const {
  Stock,
  StockPrice,
  StockChart,
  StockScreenerResult,
  Screener,
  Sequelize,
} = require("../models");
const { authenticateToken } = require("../middleware/auth");
const { Op } = require("sequelize");

// Get all stocks with pagination and search
router.get("/", authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = "",
      industry = "",
      sortBy = "stockName",
      sortOrder = "ASC",
    } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      isActive: true,
    };

    if (search) {
      whereClause[Op.or] = [
        { stockName: { [Op.like]: `%${search}%` } },
        { nseCode: { [Op.like]: `%${search}%` } },
        { bseCode: { [Op.like]: `%${search}%` } },
      ];
    }

    if (industry) {
      whereClause.industry = industry;
    }

    const { count, rows: stocks } = await Stock.findAndCountAll({
      where: whereClause,
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: StockPrice,
          as: "prices",
          limit: 1,
          order: [["date", "DESC"]],
          required: false,
        },
      ],
    });

    res.json({
      stocks,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching stocks:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get stocks with charts and screener associations
router.get("/with-charts", authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 100,
      search = "",
      industry = "",
      screener = "",
    } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      isActive: true,
    };

    if (search) {
      whereClause[Op.or] = [
        { stockName: { [Op.like]: `%${search}%` } },
        { nseCode: { [Op.like]: `%${search}%` } },
        { bseCode: { [Op.like]: `%${search}%` } },
      ];
    }

    if (industry) {
      whereClause.industry = industry;
    }

    const stocks = await Stock.findAll({
      where: whereClause,
      order: [["stockName", "ASC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: StockChart,
          as: "charts",
          required: false,
          order: [["createdAt", "DESC"]],
        },
        {
          model: StockScreenerResult,
          as: "screenerResults",
          required: false,
          include: [
            {
              model: Screener,
              as: "screener",
              attributes: ["scanName", "sourceName"],
            },
          ],
        },
      ],
    });

    // Transform the data to match the frontend interface
    const transformedStocks = stocks.map((stock) => {
      const screeners = stock.screenerResults
        ? stock.screenerResults
            .filter((result) => result.screener)
            .map((result) => result.screener.scanName)
        : [];

      return {
        id: stock.id,
        stockName: stock.stockName,
        nseCode: stock.nseCode,
        bseCode: stock.bseCode,
        industry: stock.industry,
        screeners: [...new Set(screeners)], // Remove duplicates
        charts: stock.charts || [],
      };
    });

    // Filter by screener if specified
    let filteredStocks = transformedStocks;
    if (screener && screener !== "all") {
      filteredStocks = transformedStocks.filter((stock) =>
        stock.screeners.includes(screener)
      );
    }

    res.json(filteredStocks);
  } catch (error) {
    console.error("Error fetching stocks with charts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get stock by ID with detailed information
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const stock = await Stock.findByPk(id, {
      include: [
        {
          model: StockPrice,
          as: "prices",
          order: [["date", "DESC"]],
          limit: 252, // Last year's data
        },
        {
          model: StockChart,
          as: "charts",
        },
      ],
    });

    if (!stock) {
      return res.status(404).json({ error: "Stock not found" });
    }

    res.json(stock);
  } catch (error) {
    console.error("Error fetching stock:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get stock by NSE/BSE code
router.get("/code/:code", authenticateToken, async (req, res) => {
  try {
    const { code } = req.params;

    const stock = await Stock.findOne({
      where: {
        [Op.or]: [
          { nseCode: code.toUpperCase() },
          { bseCode: code.toUpperCase() },
        ],
        isActive: true,
      },
      include: [
        {
          model: StockPrice,
          as: "prices",
          order: [["date", "DESC"]],
          limit: 1,
        },
      ],
    });

    if (!stock) {
      return res.status(404).json({ error: "Stock not found" });
    }

    res.json(stock);
  } catch (error) {
    console.error("Error fetching stock by code:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get stock price history
router.get("/:id/prices", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { from, to, period = "daily" } = req.query;

    const whereClause = { stockId: id };

    if (from) {
      whereClause.date = { [Op.gte]: from };
    }

    if (to) {
      if (whereClause.date) {
        whereClause.date[Op.lte] = to;
      } else {
        whereClause.date = { [Op.lte]: to };
      }
    }

    const prices = await StockPrice.findAll({
      where: whereClause,
      order: [["date", "ASC"]],
      limit: 1000, // Prevent too much data
    });

    res.json(prices);
  } catch (error) {
    console.error("Error fetching stock prices:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get stock charts
router.get("/:id/charts", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, range } = req.query;

    const whereClause = { stockId: id };

    if (type) {
      whereClause.chartType = type;
    }

    if (range) {
      whereClause.chartRange = range;
    }

    const charts = await StockChart.findAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
    });

    res.json(charts);
  } catch (error) {
    console.error("Error fetching stock charts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Search stocks by name or code (autocomplete)
router.get("/search/:query", authenticateToken, async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 10 } = req.query;

    const stocks = await Stock.findAll({
      where: {
        [Op.and]: [
          { isActive: true },
          {
            [Op.or]: [
              { stockName: { [Op.like]: `%${query}%` } },
              { nseCode: { [Op.like]: `%${query}%` } },
              { bseCode: { [Op.like]: `%${query}%` } },
            ],
          },
        ],
      },
      attributes: [
        "id",
        "stockName",
        "nseCode",
        "bseCode",
        "currentPrice",
        "dayChange",
        "dayChangePercent",
      ],
      limit: parseInt(limit),
      order: [
        // Prioritize exact matches
        [
          Sequelize.literal(`CASE 
          WHEN nse_code = '${query.toUpperCase()}' THEN 1
          WHEN bse_code = '${query.toUpperCase()}' THEN 2
          WHEN stock_name LIKE '${query}%' THEN 3
          ELSE 4
        END`),
          "ASC",
        ],
        ["stockName", "ASC"],
      ],
    });

    res.json(stocks);
  } catch (error) {
    console.error("Error searching stocks:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get industries list
router.get("/meta/industries", authenticateToken, async (req, res) => {
  try {
    const industries = await Stock.findAll({
      attributes: [
        [Sequelize.fn("DISTINCT", Sequelize.col("industry")), "industry"],
      ],
      where: {
        industry: { [Op.ne]: null },
        isActive: true,
      },
      order: [["industry", "ASC"]],
    });

    res.json(industries.map((item) => item.industry));
  } catch (error) {
    console.error("Error fetching industries:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add new stock (admin only or for future features)
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      bseCode,
      nseCode,
      stockName,
      industry,
      currentPrice,
      dayChange,
      dayChangePercent,
      volume,
      marketCap,
      pe,
      pb,
    } = req.body;

    const stock = await Stock.create({
      bseCode,
      nseCode,
      stockName,
      industry,
      currentPrice,
      dayChange,
      dayChangePercent,
      volume,
      marketCap,
      pe,
      pb,
      userId: req.user.id,
      lastUpdated: new Date(),
    });

    res.status(201).json(stock);
  } catch (error) {
    console.error("Error creating stock:", error);
    if (error.name === "SequelizeValidationError") {
      return res
        .status(400)
        .json({ error: error.errors.map((e) => e.message) });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update stock information
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, lastUpdated: new Date() };

    const [updatedRowsCount] = await Stock.update(updateData, {
      where: { id },
    });

    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: "Stock not found" });
    }

    const updatedStock = await Stock.findByPk(id);
    res.json(updatedStock);
  } catch (error) {
    console.error("Error updating stock:", error);
    if (error.name === "SequelizeValidationError") {
      return res
        .status(400)
        .json({ error: error.errors.map((e) => e.message) });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get market movers (top gainers/losers)
router.get("/market/movers", authenticateToken, async (req, res) => {
  try {
    const { type = "gainers", limit = 10 } = req.query;

    const order =
      type === "gainers"
        ? [["dayChangePercent", "DESC"]]
        : [["dayChangePercent", "ASC"]];

    const stocks = await Stock.findAll({
      where: {
        isActive: true,
        dayChangePercent: { [Op.ne]: null },
        currentPrice: { [Op.ne]: null },
      },
      attributes: [
        "id",
        "stockName",
        "nseCode",
        "currentPrice",
        "dayChange",
        "dayChangePercent",
        "volume",
      ],
      order,
      limit: parseInt(limit),
    });

    res.json(stocks);
  } catch (error) {
    console.error("Error fetching market movers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
