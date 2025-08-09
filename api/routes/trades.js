const express = require("express");
const router = express.Router();
const { Trade, Strategy, Image, Tag, TradeSentimentTag } = require("../models");
const { updateHoldings } = require("./holdings");

// Get all trades with pagination
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, ...filters } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause based on filters
    const where = {};

    // Add date filter if provided
    if (filters.startDate && filters.endDate) {
      where.date = {
        [require("sequelize").Op.between]: [filters.startDate, filters.endDate],
      };
    }

    // Add symbol filter if provided
    if (filters.symbol) {
      where.symbol = {
        [require("sequelize").Op.iLike]: `%${filters.symbol}%`,
      };
    }

    const { count, rows: trades } = await Trade.findAndCountAll({
      where,
      include: [
        Strategy,
        { model: Image, include: [Tag] },
        { model: Tag, as: "SentimentTags" },
      ],
      order: [
        ["date", "DESC"],
        ["createdAt", "DESC"],
      ],
      limit: parseInt(limit),
      offset: offset,
    });

    const totalPages = Math.ceil(count / parseInt(limit));

    res.json({
      trades,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        hasMore: parseInt(page) < totalPages,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a trade
router.post("/", async (req, res) => {
  try {
    const { images, sentimentTagIds, ...tradeData } = req.body;

    // Get the active portfolio if no portfolioId is provided
    if (!tradeData.portfolioId) {
      const { Portfolio } = require("../models");
      const activePortfolio = await Portfolio.findOne({
        where: { isActive: true },
      });

      if (activePortfolio) {
        tradeData.portfolioId = activePortfolio.id;
      }
    }

    // Create the trade first
    const trade = await Trade.create(tradeData); // Update holdings based on this trade
    await updateHoldings(trade.dataValues);

    // If images are provided, create them
    if (images && images.length > 0) {
      const imagePromises = images.map((imageData) =>
        Image.create({
          ...imageData,
          tradeId: trade.id,
        })
      );
      await Promise.all(imagePromises);
    }

    // If sentiment tags are provided, create the associations
    if (sentimentTagIds && sentimentTagIds.length > 0) {
      const sentimentTagPromises = sentimentTagIds.map((tagId) =>
        TradeSentimentTag.create({
          tradeId: trade.id,
          tagId: tagId,
        })
      );
      await Promise.all(sentimentTagPromises);
    }

    // Fetch the complete trade with associations
    const completeTradeData = await Trade.findByPk(trade.id, {
      include: [
        Strategy,
        { model: Image, include: [Tag] },
        { model: Tag, as: "SentimentTags" },
      ],
    });

    res.status(201).json(completeTradeData);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get a single trade
router.get("/:id", async (req, res) => {
  const trade = await Trade.findByPk(req.params.id, {
    include: [
      Strategy,
      { model: Image, include: [Tag] },
      { model: Tag, as: "SentimentTags" },
    ],
  });
  if (!trade) return res.status(404).json({ error: "Not found" });
  res.json(trade);
});

// Update a trade
router.put("/:id", async (req, res) => {
  const trade = await Trade.findByPk(req.params.id);
  if (!trade) return res.status(404).json({ error: "Not found" });
  await trade.update(req.body);
  res.json(trade);
});

// Delete a trade
router.delete("/:id", async (req, res) => {
  const trade = await Trade.findByPk(req.params.id);
  if (!trade) return res.status(404).json({ error: "Not found" });
  await trade.destroy();
  res.status(204).end();
});

module.exports = router;
