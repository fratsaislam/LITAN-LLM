const mongoose = require("mongoose");

const exerciseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    markdownContent: {
      type: String,
      required: true,
    },

    // Optional experiment binding
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExperimentGroup",
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Exercise", exerciseSchema);
