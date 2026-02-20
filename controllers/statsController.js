const User = require("../models/userModel");
const Exercise = require("../models/Exercise");
const ExperimentGroup = require("../models/ExperimentGroup");
const Conversation = require("../models/Conversation");
const UserExercise = require("../models/UserExercise");

/**
 * Get total user count
 */
exports.getTotalUsers = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();

        res.status(200).json({
            success: true,
            data: {
                totalUsers
            }
        });
    } catch (err) {
        console.error("Error fetching total users:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch total users",
            error: err.message
        });
    }
};

/**
 * Get total exercises count
 */
exports.getTotalExercises = async (req, res) => {
    try {
        const totalExercises = await Exercise.countDocuments();

        res.status(200).json({
            success: true,
            data: {
                totalExercises
            }
        });
    } catch (err) {
        console.error("Error fetching total exercises:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch total exercises",
            error: err.message
        });
    }
};

/**
 * Get total experiment groups count
 */
exports.getTotalGroups = async (req, res) => {
    try {
        const totalGroups = await ExperimentGroup.countDocuments();

        res.status(200).json({
            success: true,
            data: {
                totalGroups
            }
        });
    } catch (err) {
        console.error("Error fetching total groups:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch total groups",
            error: err.message
        });
    }
};

/**
 * Get total conversations count
 */
exports.getTotalConversations = async (req, res) => {
    try {
        const totalConversations = await Conversation.countDocuments();

        res.status(200).json({
            success: true,
            data: {
                totalConversations
            }
        });
    } catch (err) {
        console.error("Error fetching total conversations:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch total conversations",
            error: err.message
        });
    }
};

/**
 * Get stats for the current authenticated user
 */
exports.getMyStats = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const [totalConversations, totalExercises, completedExercises, inProgressExercises] = await Promise.all([
            Conversation.countDocuments({ anonymizedUserId: user.anonymizedId }),
            UserExercise.countDocuments({ userId }),
            UserExercise.countDocuments({ userId, status: "completed" }),
            UserExercise.countDocuments({ userId, status: "in_progress" }),
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalConversations,
                totalExercises,
                completedExercises,
                inProgressExercises,
                assignedExercises: totalExercises - completedExercises - inProgressExercises,
            },
        });
    } catch (err) {
        console.error("Error fetching user stats:", err);
        res.status(500).json({ success: false, message: "Failed to fetch stats", error: err.message });
    }
};

/**
 * Get all stats in one call
 */
exports.getAllStats = async (req, res) => {
    try {
        const [totalUsers, totalExercises, totalGroups, totalConversations] = await Promise.all([
            User.countDocuments(),
            Exercise.countDocuments(),
            ExperimentGroup.countDocuments(),
            Conversation.countDocuments()
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalExercises,
                totalGroups,
                totalConversations
            }
        });
    } catch (err) {
        console.error("Error fetching stats:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch stats",
            error: err.message
        });
    }
};
