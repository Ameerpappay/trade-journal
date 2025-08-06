const express = require("express");
const router = express.Router();
const { Trade, Strategy, Image, Tag } = require("../models");
const { updateHoldings } = require("./holdings");

// Get all trades
router.get("/", async (req, res) => {
  const trades = await Trade.findAll({
    include: [Strategy, { model: Image, include: [Tag] }],
    order: [
      ["date", "DESC"],
      ["createdAt", "DESC"],
    ],
  });
  res.json(trades);
});

// Create a trade
router.post("/", async (req, res) => {
  try {
    const { images, ...tradeData } = req.body;

    // Create the trade first
    const trade = await Trade.create(tradeData);

    // Update holdings based on this trade
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

    // Fetch the complete trade with associations
    const completeTradeData = await Trade.findByPk(trade.id, {
      include: [Strategy, { model: Image, include: [Tag] }],
    });

    res.status(201).json(completeTradeData);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get a single trade
router.get("/:id", async (req, res) => {
  const trade = await Trade.findByPk(req.params.id, {
    include: [Strategy, { model: Image, include: [Tag] }],
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
