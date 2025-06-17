const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  friends: [{ type: String }]  // list of other uids
});

module.exports = mongoose.model('User', userSchema);
