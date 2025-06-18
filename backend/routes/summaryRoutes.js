const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/auth');
const { postSummary, getSummaries } = require('../controllers/summaryController');

router.post('/', verifyToken, postSummary);
router.get('/:uid', getSummaries);

module.exports = router;
