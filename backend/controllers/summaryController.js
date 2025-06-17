const Summary = require('../models/Summary');

exports.postSummary = async (req, res) => {
  try {
    const summary = new Summary({ ...req.body, uid: req.user.uid });
    await summary.save();
    res.status(201).json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save summary' });
  }
};

exports.getSummaries = async (req, res) => {
  try {
    const summaries = await Summary.find({ uid: req.params.uid });
    res.json(summaries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch summaries' });
  }
};
