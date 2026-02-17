const Conversation = require("../models/Conversation");
const User = require("../models/userModel");
const ExperimentGroup = require("../models/ExperimentGroup");

exports.createConverstaion = async (req, res) => {
    const { anonymizedUserId } = req.body;
    try{
        const existingUser = await User.findOne({anonymizedUserId});
        if(!existingUser){
            return res.status(404).json({success:false, message: 'user does not exist'});
        }

    
        const group = await ExperimentGroup.findOne({users: existingUser._id});

        const result = await Conversation.create({
            anonymizedUserId,
            groupId : group._id,
            model: "gpt-4",
            messages: [
                {role: "system", content: group.promptTweaks}
            ],
        });

        return res.status(201).json({
            success: true,
            message: 'Conversation created successfully',
            data: result
        });

    } catch(err){
        console.log(err);
        res.status(500).json({
            success: false,
            message: 'Failed to create conversation',
            error: err.message
        });
    }
};

/**
 * Get all conversations for a user
 */
exports.getUserConversations = async (req, res) => {
    try {
        const { anonymizedUserId } = req.params;

        const conversations = await Conversation.find({ anonymizedUserId })
            .populate("groupId")
            .populate("userExerciseId")
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            data: conversations
        });
    } catch (err) {
        console.error("Error fetching user conversations:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch conversations",
            error: err.message
        });
    }
};

/**
 * Get a single conversation by ID
 */
exports.getConversationById = async (req, res) => {
    try {
        const { id } = req.params;

        const conversation = await Conversation.findById(id)
            .populate("groupId")
            .populate("userExerciseId");

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found"
            });
        }

        res.status(200).json({
            success: true,
            data: conversation
        });
    } catch (err) {
        console.error("Error fetching conversation:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch conversation",
            error: err.message
        });
    }
};

/**
 * Send a message in a conversation
 */
exports.sendMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.user._id;

        // Validation
        if (!content) {
            return res.status(400).json({
                success: false,
                message: "Content is required"
            });
        }

        // Find conversation
        const conversation = await Conversation.findById(id);
        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found"
            });
        }

        // Verify user owns this conversation
        const user = await User.findById(userId);
        if (!user || user.anonymizedId !== conversation.anonymizedUserId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized to access this conversation"
            });
        }

        // Push user message
        conversation.messages.push({ role: "user", content });
        await conversation.save();

        res.status(200).json({
            success: true,
            message: "Message sent successfully",
            data: conversation
        });
    } catch (err) {
        console.error("Error sending message:", err);
        res.status(500).json({
            success: false,
            message: "Failed to send message",
            error: err.message
        });
    }
};

/**
 * Update token usage for a conversation
 */
exports.updateTokenUsage = async (req, res) => {
    try {
        const { id } = req.params;
        const { promptTokens, completionTokens, totalTokens } = req.body;

        const conversation = await Conversation.findById(id);
        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found"
            });
        }

        conversation.tokenUsage = {
            promptTokens: promptTokens || 0,
            completionTokens: completionTokens || 0,
            totalTokens: totalTokens || 0
        };

        await conversation.save();

        res.status(200).json({
            success: true,
            message: "Token usage updated successfully",
            data: conversation
        });
    } catch (err) {
        console.error("Error updating token usage:", err);
        res.status(500).json({
            success: false,
            message: "Failed to update token usage",
            error: err.message
        });
    }
};

/**
 * Delete a conversation
 */
exports.deleteConversation = async (req, res) => {
    try {
        const { id } = req.params;

        const conversation = await Conversation.findByIdAndDelete(id);
        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Conversation deleted successfully"
        });
    } catch (err) {
        console.error("Error deleting conversation:", err);
        res.status(500).json({
            success: false,
            message: "Failed to delete conversation",
            error: err.message
        });
    }
};