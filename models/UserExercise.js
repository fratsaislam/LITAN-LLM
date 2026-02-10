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
      required: true,
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserExercise", userExerciseSchema);
