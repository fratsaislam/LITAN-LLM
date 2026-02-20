const express = require("express");
const router = express.Router();

const statsController = require('../controllers/statsController');
const { adminCheck } = require('../middlewares/adminOnly');
const { identifier } = require('../middlewares/identification');

// User stats
router.get('/my', identifier, statsController.getMyStats);

// Admin only - statistics endpoints
router.get('/users', adminCheck, statsController.getTotalUsers);
router.get('/exercises', adminCheck, statsController.getTotalExercises);
router.get('/groups', adminCheck, statsController.getTotalGroups);
router.get('/conversations', adminCheck, statsController.getTotalConversations);
router.get('/all', adminCheck, statsController.getAllStats);

module.exports = router;
