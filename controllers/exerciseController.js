const Exercise = require("../models/Exercise");
const ExperimentGroup = require("../models/ExperimentGroup");


exports.createExercise = async (req, res) => {
  try {
    const { title, markdownContent, groupId, isActive } = req.body;

    // Validation
    if (!title || !markdownContent) {
      return res.status(400).json({
        success: false,
        message: "Title and markdownContent are required fields"
      });
    }

    // If groupId is provided, verify it exists
    if (groupId) {
      const group = await ExperimentGroup.findById(groupId);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: "Experiment group not found"
        });
      }
    }

    // Create new exercise
    const newExercise = await Exercise.create({
      title,
      markdownContent,
      groupId: groupId || null,
      isActive: isActive !== undefined ? isActive : true
    });

    // Populate groupId if present
    await newExercise.populate("groupId");

    res.status(201).json({
      success: true,
      message: "Exercise created successfully",
      data: newExercise
    });
  } catch (err) {
    console.error("Error creating exercise:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create exercise",
      error: err.message
    });
  }
};


exports.editExercise = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, markdownContent, groupId, isActive } = req.body;

    // Check if exercise exists
    const exercise = await Exercise.findById(id);
    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: "Exercise not found"
      });
    }

    // If groupId is being changed, verify it exists
    if (groupId && groupId !== exercise.groupId?.toString()) {
      const group = await ExperimentGroup.findById(groupId);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: "Experiment group not found"
        });
      }
    }

    // Update fields
    if (title) exercise.title = title;
    if (markdownContent) exercise.markdownContent = markdownContent;
    if (groupId !== undefined) exercise.groupId = groupId || null;
    if (isActive !== undefined) exercise.isActive = isActive;

    await exercise.save();
    await exercise.populate("groupId");

    res.status(200).json({
      success: true,
      message: "Exercise updated successfully",
      data: exercise
    });
  } catch (err) {
    console.error("Error editing exercise:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update exercise",
      error: err.message
    });
  }
};


exports.getAllExercises = async (req, res) => {
  try {
    const { groupId, isActive } = req.query;
    
    // Build query filter
    const filter = {};
    if (groupId) filter.groupId = groupId;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const exercises = await Exercise.find(filter).populate("groupId");
    
    res.status(200).json({
      success: true,
      data: exercises
    });
  } catch (err) {
    console.error("Error fetching exercises:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch exercises",
      error: err.message
    });
  }
};


exports.getExerciseById = async (req, res) => {
  try {
    const { id } = req.params;
    const exercise = await Exercise.findById(id).populate("groupId");
    
    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: "Exercise not found"
      });
    }

    res.status(200).json({
      success: true,
      data: exercise
    });
  } catch (err) {
    console.error("Error fetching exercise:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch exercise",
      error: err.message
    });
  }
};


exports.deleteExercise = async (req, res) => {
  try {
    const { id } = req.params;
    const exercise = await Exercise.findByIdAndDelete(id);
    
    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: "Exercise not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Exercise deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting exercise:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete exercise",
      error: err.message
    });
  }
};
