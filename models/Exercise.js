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

    // Optional: exercise belongs to an experiment
    experimentId: {
      type: mongoose.Schema.Types.ObjectId,
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
