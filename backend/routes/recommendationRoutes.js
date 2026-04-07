const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');

// Add a new recommendation
router.post('/', recommendationController.addRecommendation);

// Get all recommendations
router.get('/', recommendationController.getRecommendations);

module.exports = router;
