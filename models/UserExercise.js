const mongoose = require("mongoose");

const userExerciseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    anonymizedUserId: {
      type: String,
      required: true,
      index: true,
    },

    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exercise",
      required: true,
    },

    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExperimentGroup",
      default: null,
    },

    status: {
      type: String,
      enum: ["assigned", "in_progress", "completed"],
      default: "assigned",
    },

    completedAt: {
      type: Date,
      default: null,
    },

    result: {
      type: String,
      default: null,
    },

    chatHistory: [
      {
        role: { type: String, enum: ["user", "assistant", "system"] },
        content: { type: String },
        _id: false,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserExercise", userExerciseSchema);
