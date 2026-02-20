const express = require("express");
const router = express.Router();

const conversationController = require('../controllers/conversationController');
const { identifier } = require('../middlewares/identification');
const { adminCheck } = require('../middlewares/adminOnly');

// User routes - require authentication
router.post('/create', identifier, conversationController.createConverstaion);
router.post('/exercise', identifier, conversationController.getOrCreateExerciseConversation);
router.get('/user', identifier, conversationController.getUserConversations);
router.get('/:id', identifier, conversationController.getConversationById);
router.post('/:id/message', identifier, conversationController.sendMessage);
router.post('/:id/complete-exercise', identifier, conversationController.completeExercise);
router.delete('/:id', identifier, conversationController.deleteConversation);

module.exports = router;
