const express = require("express");
const router = express.Router();
const { Tag } = require("../models");

// Get all tags
router.get("/", async (req, res) => {
  const tags = await Tag.findAll();
  res.json(tags);
});

// Create a tag
router.post("/", async (req, res) => {
  const tag = await Tag.create(req.body);
  res.status(201).json(tag);
});

// Update a tag
router.put("/:id", async (req, res) => {
  const tag = await Tag.findByPk(req.params.id);
  if (!tag) return res.status(404).json({ error: "Not found" });
  await tag.update(req.body);
  res.json(tag);
});

// Delete a tag
router.delete("/:id", async (req, res) => {
  const tag = await Tag.findByPk(req.params.id);
  if (!tag) return res.status(404).json({ error: "Not found" });
  await tag.destroy();
  res.status(204).end();
});

module.exports = router;
