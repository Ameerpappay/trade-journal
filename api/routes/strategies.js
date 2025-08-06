const express = require("express");
const router = express.Router();
const { Strategy } = require("../models");

// Get all strategies
router.get("/", async (req, res) => {
  const strategies = await Strategy.findAll();
  res.json(strategies);
});

// Create a strategy
router.post("/", async (req, res) => {
  const strategy = await Strategy.create(req.body);
  res.status(201).json(strategy);
});

// Update a strategy
router.put("/:id", async (req, res) => {
  const strategy = await Strategy.findByPk(req.params.id);
  if (!strategy) return res.status(404).json({ error: "Not found" });
  await strategy.update(req.body);
  res.json(strategy);
});

// Delete a strategy
router.delete("/:id", async (req, res) => {
  const strategy = await Strategy.findByPk(req.params.id);
  if (!strategy) return res.status(404).json({ error: "Not found" });
  await strategy.destroy();
  res.status(204).end();
});

module.exports = router;
