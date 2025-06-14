const express = require('express');
const router = express.Router();
const { signup, login } = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');

// Public
router.post('/signup', signup);
router.post('/login', login);

// Protected
router.get('/user', protect, (req, res) => {
  res.status(200).json(req.user);
});

module.exports = router;
