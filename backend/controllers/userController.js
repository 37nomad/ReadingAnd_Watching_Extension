const User = require('../models/User');

exports.addFriend = async (req, res) => {
  try {
    const { friendUid } = req.body;
    const user = await User.findOne({ uid: req.user.uid });
    if (!user.friends.includes(friendUid)) {
      user.friends.push(friendUid);
      await user.save();
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Could not add friend' });
  }
};

exports.getFriends = async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.params.uid });
    res.status(200).json(user?.friends || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
};
