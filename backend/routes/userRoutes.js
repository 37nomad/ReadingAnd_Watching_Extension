const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/auth');
const { addFriend, getFriends } = require('../controllers/userController');

router.post('/add-friend', verifyToken, addFriend);
router.get('/:uid/friends', getFriends);

module.exports = router;
