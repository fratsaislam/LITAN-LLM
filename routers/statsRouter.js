const express = require("express");
const router = express.Router();

const statsController = require('../controllers/statsController');
const { adminCheck } = require('../middlewares/adminOnly');

// Admin only - statistics endpoints
router.get('/users', adminCheck, statsController.getTotalUsers);
router.get('/exercises', adminCheck, statsController.getTotalExercises);
router.get('/groups', adminCheck, statsController.getTotalGroups);
router.get('/conversations', adminCheck, statsController.getTotalConversations);
router.get('/all', adminCheck, statsController.getAllStats);

module.exports = router;
