// routes/userSearchRoutes.js

const express = require('express');
const router = express.Router();
const { searchUsers } = require('../controllers/userSearchController');
const { authenticateToken } = require('../middlewares/auth');

// This route must be protected so only logged-in users can search
router.get('/search', authenticateToken, searchUsers);

module.exports = router;