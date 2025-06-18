const mongoose = require('mongoose');

const summarySchema = new mongoose.Schema({
  uid: { type: String, required: true },
  type: { type: String, enum: ['article', 'video'], required: true },
  title: String,
  url: String,
  summary: String,
  tags: [String],
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Summary', summarySchema);
