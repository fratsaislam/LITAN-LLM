const mongoose = require("mongoose");

const experimentGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },

    description: {
      type: String,
    },

    // 👁 Hidden prompt manipulation
    promptTweaks: {
      type: String, // system instructions
      required: true,
    },

    assignmentType: {
      type: String,
      enum: ["random", "rule-based"],
      default: "random",
    },

    assignmentRules: {
      type: Object, // JSON for future logic
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExperimentGroup", experimentGroupSchema);
