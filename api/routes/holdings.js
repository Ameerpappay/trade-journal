const express = require("express");
const router = express.Router();
const { Holding, Trade } = require("../models");

// Get all holdings
router.get("/", async (req, res) => {
  try {
    const holdings = await Holding.findAll({
      where: {
        quantity: {
          [require("sequelize").Op.gt]: 0,
        },
      },
      order: [["symbol", "ASC"]],
    });
    res.json(holdings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get holding by symbol with related trades
router.get("/:symbol/trades", async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();

    // Get the holding
    const holding = await Holding.findOne({
      where: { symbol: symbol },
    });

    if (!holding) {
      return res.status(404).json({ error: "Holding not found" });
    }

    // Get all trades for this symbol ordered by date
    const trades = await Trade.findAll({
      where: {
        symbol: symbol,
      },
      order: [
        ["date", "ASC"],
        ["createdAt", "ASC"],
      ],
      include: [
        { model: require("../models").Strategy },
        {
          model: require("../models").Image,
          include: [{ model: require("../models").Tag }],
        },
      ],
    });

    // Calculate running totals to show how the holding was built
    let runningQuantity = 0;
    let runningValue = 0;

    const tradesWithRunningTotals = trades.map((trade) => {
      if (trade.type === "buy") {
        runningValue = runningValue + trade.quantity * trade.entryPrice;
        runningQuantity = runningQuantity + trade.quantity;
      } else if (trade.type === "sell") {
        // For sells, we reduce quantity but don't change the average cost basis
        runningQuantity = Math.max(0, runningQuantity - trade.quantity);
      }

      const averagePrice =
        runningQuantity > 0 ? runningValue / runningQuantity : 0;

      return {
        ...trade.toJSON(),
        runningQuantity: runningQuantity,
        runningAveragePrice: averagePrice,
        positionValue: runningQuantity * averagePrice,
      };
    });

    res.json({
      holding,
      trades: tradesWithRunningTotals,
      summary: {
        totalBuyTrades: trades.filter((t) => t.type === "buy").length,
        totalSellTrades: trades.filter((t) => t.type === "sell").length,
        totalBoughtShares: trades
          .filter((t) => t.type === "buy")
          .reduce((sum, t) => sum + t.quantity, 0),
        totalSoldShares: trades
          .filter((t) => t.type === "sell")
          .reduce((sum, t) => sum + t.quantity, 0),
        currentHolding: runningQuantity,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get holding by symbol
router.get("/:symbol", async (req, res) => {
  try {
    const holding = await Holding.findOne({
      where: { symbol: req.params.symbol.toUpperCase() },
    });
    if (!holding) return res.status(404).json({ error: "Holding not found" });
    res.json(holding);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update holdings based on trade (this will be called internally)
async function updateHoldings(tradeData) {
  const {
    symbol,
    type,
    quantity,
    entryPrice,
    id: tradeId,
    portfolioId,
  } = tradeData;
  const upperSymbol = symbol.toUpperCase();

  // Find existing holding for this symbol and portfolio
  let holding = await Holding.findOne({
    where: {
      symbol: upperSymbol,
      portfolioId: portfolioId || null,
    },
  });

  if (!holding && type === "buy") {
    // Create new holding for buy orders
    holding = await Holding.create({
      symbol: upperSymbol,
      quantity: quantity,
      averagePrice: entryPrice,
      lastTradeId: tradeId,
      portfolioId: portfolioId || null,
    });
  } else if (holding) {
    if (type === "buy") {
      // Update average price and quantity for buy orders
      const totalValue =
        holding.quantity * holding.averagePrice + quantity * entryPrice;
      const totalQuantity = holding.quantity + quantity;

      holding.averagePrice = totalValue / totalQuantity;
      holding.quantity = totalQuantity;
      holding.lastTradeId = tradeId;

      await holding.save();
    } else if (type === "sell") {
      // Reduce quantity for sell orders
      holding.quantity = Math.max(0, holding.quantity - quantity);
      holding.lastTradeId = tradeId;

      await holding.save();
    }
  }

  return holding;
}

// Recalculate all holdings (useful for data integrity)
router.post("/recalculate", async (req, res) => {
  try {
    // Clear all holdings
    await Holding.destroy({ where: {} });

    // Get all trades ordered by date
    const trades = await Trade.findAll({
      order: [
        ["date", "ASC"],
        ["createdAt", "ASC"],
      ],
    });

    // Process each trade to rebuild holdings
    for (const trade of trades) {
      await updateHoldings(trade.dataValues);
    }

    // Return updated holdings
    const holdings = await Holding.findAll({
      where: {
        quantity: {
          [require("sequelize").Op.gt]: 0,
        },
      },
      order: [["symbol", "ASC"]],
    });

    res.json(holdings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = { router, updateHoldings };
