const mongoose = require("mongoose");

const experimentGroupSchema = new mongoose.Schema(
  {
    name: { 
        type: String,
        required: true, 
        unique: true },
    description: { 
      type: String 
    },

    promptTweaks: { 
      type: String, 
      required: true 
    },

    assignmentType: {
      type: String,
      enum: ["random", "rule-based"],
      default: "random",
    },

    assignmentRules: { 
      type: Object, 
      default: null 
    },

    isActive: { 
      type: Boolean, 
      default: true 
    },

    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);


module.exports = mongoose.model("ExperimentGroup", experimentGroupSchema);
