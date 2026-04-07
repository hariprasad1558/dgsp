const Recommendation = require('../models/Recommendation');

// Add a new recommendation
exports.addRecommendation = async (req, res) => {
  try {
    const { recno, recommendation, status, details, data, last_updated_by } = req.body;
    const rec = new Recommendation({ recno, recommendation, status, details, data, last_updated_by });
    await rec.save();
    res.status(201).json(rec);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all recommendations
exports.getRecommendations = async (req, res) => {
  try {
    const recs = await Recommendation.find().sort({ recno: 1 });
    res.json(recs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
