const express = require("express");
const router = express.Router();
const { Image, Tag } = require("../models");

// Get all images
router.get("/", async (req, res) => {
  const images = await Image.findAll({ include: [Tag] });
  res.json(images);
});

// Create an image
router.post("/", async (req, res) => {
  const image = await Image.create(req.body);
  res.status(201).json(image);
});

// Update an image
router.put("/:id", async (req, res) => {
  const image = await Image.findByPk(req.params.id);
  if (!image) return res.status(404).json({ error: "Not found" });
  await image.update(req.body);
  res.json(image);
});

// Delete an image
router.delete("/:id", async (req, res) => {
  const image = await Image.findByPk(req.params.id);
  if (!image) return res.status(404).json({ error: "Not found" });
  await image.destroy();
  res.status(204).end();
});

module.exports = router;
