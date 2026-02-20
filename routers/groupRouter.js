const express = require("express");
const router = express.Router();

const groupController = require('../controllers/groupController');
const { adminCheck } = require('../middlewares/adminOnly');

// All routes require admin privileges
router.post('/create', adminCheck, groupController.createGroup);
router.put('/edit/:id', adminCheck, groupController.editGroup);
router.get('/all', adminCheck, groupController.getAllGroups);
router.post('/assign-user', adminCheck, groupController.assignUserToGroup);
router.get('/:id/users', adminCheck, groupController.getGroupUsers);
router.get('/:id', adminCheck, groupController.getGroupById);
router.delete('/delete/:id', adminCheck, groupController.deleteGroup);

module.exports = router;
