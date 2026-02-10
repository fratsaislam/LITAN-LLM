const express = require("express");
const router = express.Router();

const exerciseController = require('../controllers/exerciseController');
const { adminCheck } = require('../middlewares/adminOnly');

// All routes require admin privileges
router.post('/create', adminCheck, exerciseController.createExercise);
router.put('/edit/:id', adminCheck, exerciseController.editExercise);
router.get('/all', adminCheck, exerciseController.getAllExercises);
router.get('/:id', adminCheck, exerciseController.getExerciseById);
router.delete('/delete/:id', adminCheck, exerciseController.deleteExercise);

module.exports = router;
