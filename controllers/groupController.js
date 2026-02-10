const ExperimentGroup = require("../models/ExperimentGroup");


exports.createGroup = async (req, res) => {
  try {
    const { name, description, promptTweaks, assignmentType, assignmentRules, isActive } = req.body;

    // Validation
    if (!name || !promptTweaks) {
      return res.status(400).json({
        success: false,
        message: "Name and promptTweaks are required fields"
      });
    }

    const existingGroup = await ExperimentGroup.findOne({ name });
    if (existingGroup) {
      return res.status(409).json({
        success: false,
        message: "A group with this name already exists"
      });
    }

    const newGroup = await ExperimentGroup.create({
      name,
      description,
      promptTweaks,
      assignmentType: assignmentType || "random",
      assignmentRules: assignmentRules || null,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
      success: true,
      message: "Experiment group created successfully",
      data: newGroup
    });
  } catch (err) {
    console.error("Error creating group:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create experiment group",
      error: err.message
    });
  }
};


exports.editGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, promptTweaks, assignmentType, assignmentRules, isActive } = req.body;

    // Check if group exists
    const group = await ExperimentGroup.findById(id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Experiment group not found"
      });
    }

    // If name is being changed, check for duplicates
    if (name && name !== group.name) {
      const existingGroup = await ExperimentGroup.findOne({ name });
      if (existingGroup) {
        return res.status(409).json({
          success: false,
          message: "A group with this name already exists"
        });
      }
    }

    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (promptTweaks) group.promptTweaks = promptTweaks;
    if (assignmentType) group.assignmentType = assignmentType;
    if (assignmentRules !== undefined) group.assignmentRules = assignmentRules;
    if (isActive !== undefined) group.isActive = isActive;

    await group.save();

    res.status(200).json({
      success: true,
      message: "Experiment group updated successfully",
      data: group
    });
  } catch (err) {
    console.error("Error editing group:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update experiment group",
      error: err.message
    });
  }
};


exports.getAllGroups = async (req, res) => {
  try {
    const groups = await ExperimentGroup.find();
    res.status(200).json({
      success: true,
      data: groups
    });
  } catch (err) {
    console.error("Error fetching groups:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch experiment groups",
      error: err.message
    });
  }
};


exports.getGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await ExperimentGroup.findById(id);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Experiment group not found"
      });
    }

    res.status(200).json({
      success: true,
      data: group
    });
  } catch (err) {
    console.error("Error fetching group:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch experiment group",
      error: err.message
    });
  }
};


exports.deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await ExperimentGroup.findByIdAndDelete(id);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Experiment group not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Experiment group deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting group:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete experiment group",
      error: err.message
    });
  }
};
