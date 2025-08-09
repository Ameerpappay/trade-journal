const express = require("express");
const router = express.Router();
const {
  Stock,
  Screener,
  StockChart,
  StockScreenerResult,
} = require("../models");
const { authenticateToken } = require("../middleware/auth");
const { Op } = require("sequelize");

// Get database statistics
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const stats = {};

    // Stock counts
    const totalStocks = await Stock.count({ where: { isActive: true } });
    stats.totalStocks = totalStocks;

    // Screener counts
    const totalScreeners = await Screener.count({ where: { isActive: true } });
    stats.totalScreeners = totalScreeners;

    // Chart counts
    const totalCharts = await StockChart.count();
    stats.totalCharts = totalCharts;

    // Industry distribution
    const industriesData = await Stock.findAll({
      attributes: [
        "industry",
        [Stock.sequelize.fn("COUNT", Stock.sequelize.col("id")), "count"],
      ],
      where: {
        isActive: true,
        industry: { [Op.not]: null },
      },
      group: ["industry"],
      order: [[Stock.sequelize.fn("COUNT", Stock.sequelize.col("id")), "DESC"]],
      raw: true,
    });
    stats.industrieDistribution = industriesData;

    // Recent screener results statistics
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentResults = await StockScreenerResult.count({
      where: {
        createdAt: {
          [Op.gte]: sevenDaysAgo,
        },
      },
    });
    stats.recentScreenerResults = recentResults;

    // Latest screener results by date
    const latestResults = await StockScreenerResult.findAll({
      attributes: [
        "scanDate",
        [
          StockScreenerResult.sequelize.fn(
            "COUNT",
            StockScreenerResult.sequelize.col("id")
          ),
          "count",
        ],
      ],
      group: ["scanDate"],
      order: [["scanDate", "DESC"]],
      limit: 7,
      raw: true,
    });
    stats.recentResultsByDate = latestResults;

    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search stocks
router.get("/stocks/search", authenticateToken, async (req, res) => {
  try {
    const { q: searchTerm } = req.query;
    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        error: "Search term is required",
      });
    }

    const stocks = await Stock.findAll({
      include: [
        {
          model: StockScreenerResult,
          include: [Screener],
          required: false,
        },
      ],
      where: {
        isActive: true,
        [Op.or]: [
          { stockName: { [Op.like]: `%${searchTerm}%` } },
          { bseCode: { [Op.like]: `%${searchTerm}%` } },
          { nseCode: { [Op.like]: `%${searchTerm}%` } },
          { industry: { [Op.like]: `%${searchTerm}%` } },
        ],
      },
      limit: 50,
      order: [["stockName", "ASC"]],
    });

    res.json({ success: true, stocks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get stocks by industry
router.get(
  "/stocks/industry/:industry",
  authenticateToken,
  async (req, res) => {
    try {
      const { industry } = req.params;
      const today = new Date().toISOString().split("T")[0];

      const stocks = await Stock.findAll({
        include: [
          {
            model: StockScreenerResult,
            include: [Screener],
            where: {
              scanDate: today,
              isMatch: true,
            },
            required: true,
          },
        ],
        where: {
          isActive: true,
          industry: industry,
        },
        order: [["stockName", "ASC"]],
      });

      res.json({ success: true, stocks });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Get stocks by screener
router.get(
  "/stocks/screener/:screenerName",
  authenticateToken,
  async (req, res) => {
    try {
      const { screenerName } = req.params;
      const today = new Date().toISOString().split("T")[0];

      const stocks = await Stock.findAll({
        include: [
          {
            model: StockScreenerResult,
            include: [
              {
                model: Screener,
                where: { scanName: screenerName },
              },
            ],
            where: {
              scanDate: today,
              isMatch: true,
            },
            required: true,
          },
        ],
        where: {
          isActive: true,
        },
        order: [["stockName", "ASC"]],
      });

      res.json({ success: true, stocks });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Cleanup old data
router.post("/cleanup", authenticateToken, async (req, res) => {
  try {
    const daysOld = parseInt(req.body.daysOld) || 30;
    const cleanupDate = new Date();
    cleanupDate.setDate(cleanupDate.getDate() - daysOld);

    // Cleanup old screener results (keeping only last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const cleanedResults = await StockScreenerResult.destroy({
      where: {
        scanDate: {
          [Op.lt]: sevenDaysAgo.toISOString().split("T")[0],
        },
      },
    });

    res.json({
      success: true,
      message: `Cleaned up ${cleanedResults} old screener results`,
      result: { cleanedResults },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
