const express = require("express");
const router = express.Router();

const conversationController = require('../controllers/conversationController');
const { identifier } = require('../middlewares/identification');
const { adminCheck } = require('../middlewares/adminOnly');

// User routes - require authentication
router.post('/create', identifier, conversationController.createConverstaion);
router.get('/user/:anonymizedUserId', identifier, conversationController.getUserConversations);
router.get('/:id', identifier, conversationController.getConversationById);
router.post('/:id/message', identifier, conversationController.sendMessage);
// router.patch('/:id/tokens', identifier, conversationController.updateTokenUsage);
router.delete('/:id', identifier, conversationController.deleteConversation);

module.exports = router;
