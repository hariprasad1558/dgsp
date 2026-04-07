const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
  recno: {
    type: Number,
    required: true,
    unique: true
  },
  recommendation: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'Pending'
  },
  details: {
    type: String,
    default: ''
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  last_updated_by: {
    type: String,
    default: ''
  }
});

const Recommendation = mongoose.model('Recommendation', recommendationSchema, 'recommendations');

module.exports = Recommendation;
