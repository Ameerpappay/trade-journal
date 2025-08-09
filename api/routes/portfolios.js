const express = require("express");
const router = express.Router();
const { Portfolio, Trade, Holding } = require("../models");
const { Op } = require("sequelize");

// Get all portfolios
router.get("/", async (req, res) => {
  try {
    const portfolios = await Portfolio.findAll({
      order: [["name", "ASC"]],
    });
    res.json(portfolios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active portfolios only
router.get("/active", async (req, res) => {
  try {
    const portfolios = await Portfolio.findAll({
      where: { isActive: true },
      order: [["name", "ASC"]],
    });
    res.json(portfolios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single portfolio with stats
router.get("/:id", async (req, res) => {
  try {
    const portfolio = await Portfolio.findByPk(req.params.id);
    if (!portfolio)
      return res.status(404).json({ error: "Portfolio not found" });

    // Get portfolio statistics
    const totalTrades = await Trade.count({
      where: { portfolioId: portfolio.id },
    });
    const totalHoldings = await Holding.count({
      where: { portfolioId: portfolio.id },
    });

    // Calculate total invested amount from holdings
    const holdings = await Holding.findAll({
      where: { portfolioId: portfolio.id },
    });
    const totalInvested = holdings.reduce(
      (sum, holding) => sum + holding.quantity * holding.averagePrice,
      0
    );

    res.json({
      ...portfolio.toJSON(),
      stats: {
        totalTrades,
        totalHoldings,
        totalInvested: parseFloat(totalInvested.toFixed(2)),
        availableCapital: parseFloat(
          (portfolio.capital - totalInvested).toFixed(2)
        ),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a portfolio
router.post("/", async (req, res) => {
  try {
    const { isActive, ...portfolioData } = req.body;

    // If creating an active portfolio, deactivate all others first
    if (isActive) {
      await Portfolio.update(
        { isActive: false },
        { where: { isActive: true } }
      );
    }

    const portfolio = await Portfolio.create({ ...portfolioData, isActive });
    res.status(201).json(portfolio);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      res.status(400).json({ error: "Portfolio name already exists" });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// Update a portfolio
router.put("/:id", async (req, res) => {
  try {
    const portfolio = await Portfolio.findByPk(req.params.id);
    if (!portfolio)
      return res.status(404).json({ error: "Portfolio not found" });

    const { isActive, ...updateData } = req.body;

    // If activating this portfolio, deactivate all others first
    if (isActive && !portfolio.isActive) {
      await Portfolio.update(
        { isActive: false },
        { where: { isActive: true } }
      );
    }

    await portfolio.update({ ...updateData, isActive });
    res.json(portfolio);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      res.status(400).json({ error: "Portfolio name already exists" });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// Delete a portfolio
router.delete("/:id", async (req, res) => {
  try {
    const portfolio = await Portfolio.findByPk(req.params.id);
    if (!portfolio)
      return res.status(404).json({ error: "Portfolio not found" });

    // Check if portfolio has any trades or holdings
    const tradeCount = await Trade.count({
      where: { portfolioId: portfolio.id },
    });
    const holdingCount = await Holding.count({
      where: { portfolioId: portfolio.id },
    });

    if (tradeCount > 0 || holdingCount > 0) {
      return res.status(400).json({
        error:
          "Cannot delete portfolio with existing trades or holdings. Please move or delete them first.",
      });
    }

    await portfolio.destroy();
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get the current active portfolio
router.get("/current/active", async (req, res) => {
  try {
    const activePortfolio = await Portfolio.findOne({
      where: { isActive: true },
    });

    if (!activePortfolio) {
      return res.status(404).json({ error: "No active portfolio found" });
    }

    res.json(activePortfolio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
