const Conversation = require("../models/Conversation");
const User = require("../models/userModel");
const ExperimentGroup = require("../models/ExperimentGroup");
const UserExercise = require("../models/UserExercise");
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Create a new conversation
 */
exports.createConverstaion = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { userExerciseId } = req.body || {};
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Try to find user's group for system prompt, but it's optional
        let group = null;
        if (user.groupId) {
            group = await ExperimentGroup.findById(user.groupId);
        }
        if (!group) {
            group = await ExperimentGroup.findOne({ users: user._id });
        }

        let systemPrompt = group?.promptTweaks || "You are a helpful AI learning assistant.";
        let title = "New Conversation";

        // If linked to an exercise, prepend exercise context to system prompt
        let exerciseRef = null;
        if (userExerciseId) {
            const userExercise = await UserExercise.findById(userExerciseId).populate("exerciseId");
            if (userExercise && userExercise.exerciseId) {
                const exercise = userExercise.exerciseId;
                systemPrompt += `\n\nThe student is working on the following exercise:\n**${exercise.title}**\n${exercise.markdownContent}\n\nHelp them understand and complete this exercise. Guide them step by step without giving direct answers unless asked.`;
                title = `Exercise: ${exercise.title}`;
                exerciseRef = userExerciseId;

                // Mark exercise as in_progress if it was assigned
                if (userExercise.status === "assigned") {
                    userExercise.status = "in_progress";
                    await userExercise.save();
                }
            }
        }

        const systemMessage = { role: "system", content: systemPrompt };

        const result = await Conversation.create({
            anonymizedUserId: user.anonymizedId,
            groupId: group?._id || null,
            model: "llama-3.3-70b-versatile",
            title,
            messages: [systemMessage],
            userExerciseId: exerciseRef,
        });

        return res.status(201).json({
            success: true,
            message: "Conversation created successfully",
            data: result,
        });
    } catch (err) {
        console.error("Error creating conversation:", err);
        res.status(500).json({
            success: false,
            message: "Failed to create conversation",
            error: err.message,
        });
    }
};

/**
 * Get or create a conversation for a specific exercise
 */
exports.getOrCreateExerciseConversation = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { userExerciseId } = req.body;

        if (!userExerciseId) {
            return res.status(400).json({ 
                success: false, 
                message: "userExerciseId is required" 
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Check if conversation already exists for this exercise
        let conversation = await Conversation.findOne({
            anonymizedUserId: user.anonymizedId,
            userExerciseId: userExerciseId
        });

        // If conversation exists, return it
        if (conversation) {
            return res.status(200).json({
                success: true,
                message: "Existing conversation found",
                data: conversation,
                isNew: false
            });
        }

        // Otherwise, create a new conversation
        // Try to find user's group for system prompt
        let group = null;
        if (user.groupId) {
            group = await ExperimentGroup.findById(user.groupId);
        }
        if (!group) {
            group = await ExperimentGroup.findOne({ users: user._id });
        }

        let systemPrompt = group?.promptTweaks || "You are a helpful AI learning assistant.";
        let title = "New Conversation";

        // Get exercise details
        const userExercise = await UserExercise.findById(userExerciseId).populate("exerciseId");
        if (!userExercise || !userExercise.exerciseId) {
            return res.status(404).json({ 
                success: false, 
                message: "Exercise not found" 
            });
        }

        const exercise = userExercise.exerciseId;
        systemPrompt += `\n\nThe student is working on the following exercise:\n**${exercise.title}**\n${exercise.markdownContent}\n\nHelp them understand and complete this exercise. Guide them step by step without giving direct answers unless asked.`;
        title = `Exercise: ${exercise.title}`;

        // Mark exercise as in_progress if it was assigned
        if (userExercise.status === "assigned") {
            userExercise.status = "in_progress";
            await userExercise.save();
        }

        const systemMessage = { role: "system", content: systemPrompt };

        conversation = await Conversation.create({
            anonymizedUserId: user.anonymizedId,
            groupId: group?._id || null,
            model: "llama-3.3-70b-versatile",
            title,
            messages: [systemMessage],
            userExerciseId: userExerciseId,
        });

        return res.status(201).json({
            success: true,
            message: "New conversation created",
            data: conversation,
            isNew: true
        });
    } catch (err) {
        console.error("Error getting/creating exercise conversation:", err);
        res.status(500).json({
            success: false,
            message: "Failed to get or create conversation",
            error: err.message,
        });
    }
};

/**
 * Get all conversations for the authenticated user
 */
exports.getUserConversations = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const conversations = await Conversation.find({ anonymizedUserId: user.anonymizedId })
            .select("_id title model createdAt updatedAt messages userExerciseId")
            .sort({ updatedAt: -1 });

        // Return conversations with message count and last message preview
        const conversationList = conversations.map((conv) => ({
            _id: conv._id,
            title: conv.title,
            model: conv.model,
            messageCount: conv.messages.filter((m) => m.role !== "system").length,
            lastMessage: conv.messages.filter((m) => m.role !== "system").slice(-1)[0]?.content || "",
            createdAt: conv.createdAt,
            updatedAt: conv.updatedAt,
            userExerciseId: conv.userExerciseId || null,
        }));

        res.status(200).json({
            success: true,
            data: conversationList,
        });
    } catch (err) {
        console.error("Error fetching user conversations:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch conversations",
            error: err.message,
        });
    }
};

/**
 * Get a single conversation by ID
 */
exports.getConversationById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const user = await User.findById(userId);

        const conversation = await Conversation.findById(id);

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found",
            });
        }

        // Verify ownership
        if (user.anonymizedId !== conversation.anonymizedUserId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized to access this conversation",
            });
        }

        res.status(200).json({
            success: true,
            data: conversation,
        });
    } catch (err) {
        console.error("Error fetching conversation:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch conversation",
            error: err.message,
        });
    }
};

/**
 * Send a message and get AI response via ChatGPT
 */
exports.sendMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.user.userId;

        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: "Message content is required",
            });
        }

        const user = await User.findById(userId);
        const conversation = await Conversation.findById(id);
        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found",
            });
        }

        // Verify ownership
        if (!user || user.anonymizedId !== conversation.anonymizedUserId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized to access this conversation",
            });
        }

        // Push user message
        conversation.messages.push({ role: "user", content: content.trim() });

        // Auto-generate title from first user message (only for non-exercise conversations)
        const userMessages = conversation.messages.filter((m) => m.role === "user");
        if (userMessages.length === 1 && !conversation.userExerciseId) {
            conversation.title = content.trim().substring(0, 80) + (content.trim().length > 80 ? "..." : "");
        }

        // Save user message first so it's not lost if OpenAI fails
        await conversation.save();

        // Build chat history for Groq
        const groqMessages = conversation.messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
        }));

        // Call Groq API
        let assistantMessage;
        try {
            const chatCompletion = await groq.chat.completions.create({
                messages: groqMessages,
                model: "llama-3.3-70b-versatile",
            });

            assistantMessage = chatCompletion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
        } catch (aiErr) {
            console.error("Groq API error:", aiErr?.message);

            if (aiErr?.status === 429 || aiErr?.message?.includes("429")) {
                return res.status(429).json({
                    success: false,
                    message: "Rate limit reached. Please wait a moment and try again.",
                });
            }
            if (aiErr?.message?.includes("invalid_api_key") || aiErr?.message?.includes("API key")) {
                return res.status(500).json({
                    success: false,
                    message: "Invalid Groq API key. Contact admin.",
                });
            }

            return res.status(500).json({
                success: false,
                message: "AI service error: " + (aiErr?.message || "Unknown error"),
            });
        }

        // Push assistant response and save
        conversation.messages.push({ role: "assistant", content: assistantMessage });
        await conversation.save();

        res.status(200).json({
            success: true,
            data: {
                userMessage: { role: "user", content: content.trim() },
                assistantMessage: { role: "assistant", content: assistantMessage },
                conversationId: conversation._id,
                title: conversation.title,
            },
        });
    } catch (err) {
        console.error("Error sending message:", err);
        res.status(500).json({
            success: false,
            message: "Failed to send message",
            error: err.message,
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
                message: "Conversation not found",
            });
        }

        conversation.tokenUsage = {
            promptTokens: promptTokens || 0,
            completionTokens: completionTokens || 0,
            totalTokens: totalTokens || 0,
        };

        await conversation.save();

        res.status(200).json({
            success: true,
            message: "Token usage updated successfully",
            data: conversation,
        });
    } catch (err) {
        console.error("Error updating token usage:", err);
        res.status(500).json({
            success: false,
            message: "Failed to update token usage",
            error: err.message,
        });
    }
};

/**
 * Delete a conversation
 */
/**
 * Mark an exercise as completed via conversation
 */
exports.completeExercise = async (req, res) => {
    try {
        const { id } = req.params; // conversation id
        const userId = req.user.userId;
        const user = await User.findById(userId);

        const conversation = await Conversation.findById(id);
        if (!conversation) {
            return res.status(404).json({ success: false, message: "Conversation not found" });
        }
        if (user.anonymizedId !== conversation.anonymizedUserId) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        if (!conversation.userExerciseId) {
            return res.status(400).json({ success: false, message: "This conversation is not linked to an exercise" });
        }

        const userExercise = await UserExercise.findById(conversation.userExerciseId);
        if (!userExercise) {
            return res.status(404).json({ success: false, message: "Exercise assignment not found" });
        }

        userExercise.status = "completed";
        userExercise.completedAt = new Date();
        await userExercise.save();

        res.status(200).json({ success: true, message: "Exercise marked as completed", data: userExercise });
    } catch (err) {
        console.error("Error completing exercise:", err);
        res.status(500).json({ success: false, message: "Failed to complete exercise", error: err.message });
    }
};

exports.deleteConversation = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const user = await User.findById(userId);

        const conversation = await Conversation.findById(id);
        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found",
            });
        }

        // Verify ownership
        if (user.anonymizedId !== conversation.anonymizedUserId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized to delete this conversation",
            });
        }

        await Conversation.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Conversation deleted successfully",
        });
    } catch (err) {
        console.error("Error deleting conversation:", err);
        res.status(500).json({
            success: false,
            message: "Failed to delete conversation",
            error: err.message,
        });
    }
};