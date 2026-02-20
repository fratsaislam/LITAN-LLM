const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["system", "user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    anonymizedUserId: {
      type: String,
      required: true,
      index: true,
    },

    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExperimentGroup",
      default: null,
      index: true,
    },

    title: {
      type: String,
      default: "New Conversation",
    },

    model: {
      type: String, // llama-3.3-70b-versatile, etc.
      default: "llama-3.3-70b-versatile",
    },

    messages: {
      type: [messageSchema],
      required: true,
    },

    // tokenUsage: {
    //   promptTokens: Number,
    //   completionTokens: Number,
    //   totalTokens: Number,
    // },

    // 🔗 Optional links
    userExerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserExercise",
      default: null,
    },


    experimentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", conversationSchema);
