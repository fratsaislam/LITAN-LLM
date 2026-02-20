const Exercise = require("../models/Exercise");
const ExperimentGroup = require("../models/ExperimentGroup");
const UserExercise = require("../models/UserExercise");
const Conversation = require("../models/Conversation");


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

    // Create new exerciseW
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
    const { exerciseId, groupId, userIds } = req.body;
    const User = require("../models/userModel");

    // Validation
    if (!exerciseId) {
      return res.status(400).json({
        success: false,
        message: "exerciseId is required"
      });
    }
    if (!userIds && !groupId) {
      return res.status(400).json({
        success: false,
        message: "Either userIds or groupId is required"
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

    // Resolve target users
    let targetUsers = [];
    let resolvedGroupId = groupId || null;

    if (userIds && userIds.length > 0) {
      // Assign to specific users
      const users = await User.find({ _id: { $in: userIds } });
      targetUsers = users.map(u => ({
        userId: u._id,
        anonymizedId: u.anonymizedId
      }));
    } else if (groupId) {
      // Assign to all users in a group
      const group = await ExperimentGroup.findById(groupId).populate("users");
      if (!group) {
        return res.status(404).json({
          success: false,
          message: "Experiment group not found"
        });
      }
      targetUsers = group.users.map(u => ({
        userId: u._id,
        anonymizedId: u.anonymizedId
      }));
    }

    if (targetUsers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No users found to assign"
      });
    }

    // Prevent duplicate assignments
    const existingAssignments = await UserExercise.find({
      exerciseId,
      userId: { $in: targetUsers.map(u => u.userId) }
    });
    const alreadyAssignedIds = new Set(existingAssignments.map(a => a.userId.toString()));
    const newUsers = targetUsers.filter(u => !alreadyAssignedIds.has(u.userId.toString()));

    if (newUsers.length === 0) {
      return res.status(200).json({
        success: true,
        message: "All selected users already have this exercise assigned",
        data: [],
        skipped: targetUsers.length
      });
    }

    const assignments = newUsers.map(user => ({
      userId: user.userId,
      anonymizedUserId: user.anonymizedId,
      exerciseId,
      groupId: resolvedGroupId
    }));

    const data = await UserExercise.insertMany(assignments);

    res.status(200).json({
      success: true,
      message: `Exercise assigned to ${data.length} user(s) successfully` +
        (alreadyAssignedIds.size > 0 ? ` (${alreadyAssignedIds.size} already assigned, skipped)` : ''),
      data,
      skipped: alreadyAssignedIds.size
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
 * Get current user's exercises (for students)
 */
exports.getMyExercises = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;

    const filter = { userId };
    if (status) filter.status = status;

    const userExercises = await UserExercise.find(filter)
      .populate("exerciseId")
      .populate("groupId", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: userExercises });
  } catch (err) {
    console.error("Error fetching my exercises:", err);
    res.status(500).json({ success: false, message: "Failed to fetch exercises", error: err.message });
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
 * Get users assigned to a specific exercise (admin)
 */
exports.getAssignedUsers = async (req, res) => {
  try {
    const { exerciseId } = req.params;
    const assignments = await UserExercise.find({ exerciseId })
      .populate("userId", "username email profilePic")
      .populate("groupId", "name")
      .sort({ createdAt: -1 });

    const data = assignments.map(a => ({
      _id: a._id,
      userId: a.userId?._id,
      username: a.userId?.username,
      email: a.userId?.email,
      profilePic: a.userId?.profilePic,
      groupName: a.groupId?.name || null,
      status: a.status,
      result: a.result,
      completedAt: a.completedAt,
      createdAt: a.createdAt,
    }));

    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("Error fetching assigned users:", err);
    res.status(500).json({ success: false, message: "Failed to fetch assigned users", error: err.message });
  }
};

/**
 * Get the full conversation for a user exercise assignment (admin)
 */
exports.getExerciseConversation = async (req, res) => {
  try {
    const { id } = req.params; // userExercise id

    const userExercise = await UserExercise.findById(id);
    if (!userExercise) {
      return res.status(404).json({ success: false, message: "Exercise assignment not found" });
    }

    // Find the conversation linked to this userExercise
    const conversation = await Conversation.findOne({ userExerciseId: id });

    if (!conversation) {
      return res.status(200).json({
        success: true,
        data: { messages: [], found: false },
        message: "No conversation found for this exercise"
      });
    }

    // Filter out system messages for display, return the full chat
    const messages = conversation.messages.filter(m => m.role !== "system");

    res.status(200).json({
      success: true,
      data: {
        conversationId: conversation._id,
        title: conversation.title,
        messages,
        found: true,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      }
    });
  } catch (err) {
    console.error("Error fetching exercise conversation:", err);
    res.status(500).json({ success: false, message: "Failed to fetch conversation", error: err.message });
  }
};

/**
 * Submit exercise result (student)
 */
exports.submitExerciseResult = async (req, res) => {
  try {
    const { id } = req.params; // userExercise id
    const { result, chatHistory } = req.body;
    const userId = req.user.userId;

    if (!result || !result.trim()) {
      return res.status(400).json({ success: false, message: "Result text is required" });
    }

    const userExercise = await UserExercise.findById(id);
    if (!userExercise) {
      return res.status(404).json({ success: false, message: "Exercise assignment not found" });
    }

    // Verify ownership
    if (userExercise.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    userExercise.result = result.trim();
    userExercise.status = "completed";
    userExercise.completedAt = new Date();
    if (chatHistory && Array.isArray(chatHistory)) {
      userExercise.chatHistory = chatHistory.filter(m => m.role !== "system");
    }

    await userExercise.save();

    res.status(200).json({
      success: true,
      message: "Exercise result submitted successfully",
      data: userExercise,
    });
  } catch (err) {
    console.error("Error submitting exercise result:", err);
    res.status(500).json({ success: false, message: "Failed to submit result", error: err.message });
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