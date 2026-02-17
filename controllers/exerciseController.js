const Exercise = require("../models/Exercise");
const ExperimentGroup = require("../models/ExperimentGroup");
const UserExercise = require("../models/UserExercise");


exports.createExercise = async (req, res) => {
  try {
    const { title, markdownContent, experimentId, isActive } = req.body;

    // Validation
    if (!title || !markdownContent) {
      return res.status(400).json({
        success: false,
        message: "Title and markdownContent are required fields"
      });
    }

    // If experimentId is provided, verify it exists
    if (experimentId) {
      const group = await ExperimentGroup.findById(experimentId);
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
      experimentId: experimentId || null,
      isActive: isActive !== undefined ? isActive : true
    });

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
    const { title, markdownContent, experimentId, isActive } = req.body;

    // Check if exercise exists
    const exercise = await Exercise.findById(id);
    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: "Exercise not found"
      });
    }

    // If experimentId is being changed, verify it exists
    if (experimentId && experimentId !== exercise.experimentId?.toString()) {
      const group = await ExperimentGroup.findById(experimentId);
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
    if (experimentId !== undefined) exercise.experimentId = experimentId || null;
    if (isActive !== undefined) exercise.isActive = isActive;

    await exercise.save();

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
    const { experimentId, isActive } = req.query;
    
    // Build query filter
    const filter = {};
    if (experimentId) filter.experimentId = experimentId;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const exercises = await Exercise.find(filter);
    
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
    const exercise = await Exercise.findById(id);
    
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

/**
 * Assign exercise to users
 */
exports.assignExerciseToUsers = async (req, res) => {
  try {
    const { exerciseId, groupId } = req.body;

    // Validation
    if (!exerciseId || !groupId ) {
      return res.status(400).json({
        success: false,
        message: "exerciseId and groupId are required"
      });
    }

    // Verify exercise exists
    const exercise = await Exercise.findById(exerciseId);
    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: "Exercise not found"
      });
    }

    // Verify group exists
    const group = await ExperimentGroup.findById(groupId).populate("users");
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Experiment group not found"
      });
    }

    const usersData = group.users.map(u => ({
      userId: u._id,
      anonymizedId: u.anonymizedId
    }));

    const assignments = usersData.map(user => ({
      userId: user.userId,
      anonymizedUserId: user.anonymizedId,
      exerciseId,
      groupId
    }))

    data = await UserExercise.insertMany(assignments);

    res.status(200).json({
      success: true,
      message: "Exercise assigned to users successfully",
      data
    });
    
  } catch (err) {
    console.error("Error assigning exercise:", err);
    res.status(500).json({
      success: false,
      message: "Failed to assign exercise",
      error: err.message
    });
  }
};

/**
 * Get user's exercises
 */
exports.getUserExercises = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    const filter = { userId };
    if (status) filter.status = status;

    const userExercises = await UserExercise.find(filter)
      .populate("exerciseId")
      .populate("groupId");

    res.status(200).json({
      success: true,
      data: userExercises
    });
  } catch (err) {
    console.error("Error fetching user exercises:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user exercises",
      error: err.message
    });
  }
};

/**
 * Update user exercise status
 */
exports.updateUserExerciseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["assigned", "in_progress", "completed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status (assigned, in_progress, completed) is required"
      });
    }

    const userExercise = await UserExercise.findById(id);
    if (!userExercise) {
      return res.status(404).json({
        success: false,
        message: "User exercise assignment not found"
      });
    }

    userExercise.status = status;
    if (status === "completed") {
      userExercise.completedAt = new Date();
    }

    await userExercise.save();

    res.status(200).json({
      success: true,
      message: "User exercise status updated successfully",
      data: userExercise
    });
  } catch (err) {
    console.error("Error updating user exercise:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update user exercise status",
      error: err.message
    });
  }
};