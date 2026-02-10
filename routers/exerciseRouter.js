const express = require("express");
const router = express.Router();

const exerciseController = require('../controllers/exerciseController');
const { adminCheck } = require('../middlewares/adminOnly');
const { identifier } = require('../middlewares/identification');

// Admin routes - require admin privileges
router.post('/create', adminCheck, exerciseController.createExercise);
router.put('/edit/:id', adminCheck, exerciseController.editExercise);
router.get('/all', adminCheck, exerciseController.getAllExercises);
router.get('/:id', adminCheck, exerciseController.getExerciseById);
router.delete('/delete/:id', adminCheck, exerciseController.deleteExercise);

// User assignment routes - admin only
router.post('/assign', adminCheck, exerciseController.assignExerciseToUsers);

// User routes - require user authentication
router.get('/user/:userId', identifier, exerciseController.getUserExercises);
router.patch('/user-status/:id', identifier, exerciseController.updateUserExerciseStatus);

module.exports = router;
