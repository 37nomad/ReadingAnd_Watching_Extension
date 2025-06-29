// routes/dataRoutes.js

const express = require("express");
const router = express.Router();
const { addData, getData } = require("../controllers/dataController");
const { authenticateToken } = require("../middlewares/auth");

// @route   POST /api/data
// @desc    Add a new data entry to the logged-in user's profile
// @access  Private
router.post("/", authenticateToken, addData);

// @route   GET /api/data/:username
// @desc    Get the data for a specific user (if you have permission)
// @access  Private (Owner or Friend)
router.get("/:username", authenticateToken, getData);

module.exports = router;