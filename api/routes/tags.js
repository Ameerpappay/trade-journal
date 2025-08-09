const express = require("express");
const router = express.Router();
const { Tag } = require("../models");
const { authenticateToken, ensureOwnership } = require("../middleware/auth");

// Get all tags (user's own tags + public tags if needed)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const whereClause =
      req.user.role === "admin"
        ? {} // Admin can see all tags
        : { userId: req.user.id }; // Users see only their tags

    const tags = await Tag.findAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
    });
    res.json(tags);
  } catch (error) {
    console.error("Error fetching tags:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create a tag
router.post("/", authenticateToken, ensureOwnership(), async (req, res) => {
  try {
    const tag = await Tag.create({
      ...req.body,
      userId: req.user.id,
    });
    res.status(201).json(tag);
  } catch (error) {
    console.error("Error creating tag:", error);
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ error: error.errors[0].message });
    }
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ error: "Tag name already exists" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update a tag
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const whereClause =
      req.user.role === "admin"
        ? { id: req.params.id }
        : { id: req.params.id, userId: req.user.id };

    const tag = await Tag.findOne({ where: whereClause });
    if (!tag) {
      return res.status(404).json({ error: "Tag not found or access denied" });
    }

    await tag.update(req.body);
    res.json(tag);
  } catch (error) {
    console.error("Error updating tag:", error);
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ error: error.errors[0].message });
    }
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ error: "Tag name already exists" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a tag
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const whereClause =
      req.user.role === "admin"
        ? { id: req.params.id }
        : { id: req.params.id, userId: req.user.id };

    const tag = await Tag.findOne({ where: whereClause });
    if (!tag) {
      return res.status(404).json({ error: "Tag not found or access denied" });
    }

    await tag.destroy();
    res.status(204).end();
  } catch (error) {
    console.error("Error deleting tag:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
