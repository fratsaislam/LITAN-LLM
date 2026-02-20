const express = require("express");
const router = express.Router();

const exerciseController = require('../controllers/exerciseController');
const { adminCheck } = require('../middlewares/adminOnly');
const { identifier } = require('../middlewares/identification');

// User routes - require user authentication (MUST be before /:id to avoid conflicts)
router.get('/my', identifier, exerciseController.getMyExercises);
router.get('/user/:userId', identifier, exerciseController.getUserExercises);
router.patch('/user-status/:id', identifier, exerciseController.updateUserExerciseStatus);
router.post('/submit/:id', identifier, exerciseController.submitExerciseResult);

// Admin routes - require admin privileges
router.post('/create', adminCheck, exerciseController.createExercise);
router.put('/edit/:id', adminCheck, exerciseController.editExercise);
router.get('/all', adminCheck, exerciseController.getAllExercises);
router.get('/assigned/:exerciseId', adminCheck, exerciseController.getAssignedUsers);
router.get('/conversation/:id', adminCheck, exerciseController.getExerciseConversation);
router.delete('/delete/:id', adminCheck, exerciseController.deleteExercise);
router.get('/:id', adminCheck, exerciseController.getExerciseById);

// User assignment routes - admin only
router.post('/assign', adminCheck, exerciseController.assignExerciseToUsers);

module.exports = router;
