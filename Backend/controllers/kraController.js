const mongoose = require("mongoose");
const KRA = require("../models/KRA");
const User = require("../models/User");
const Department = require("../models/Department");

// Get all KRAs
const getAllKRAs = async (req, res) => {
  try {
    const kras = await KRA.find()
      .populate("department", "name")
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json(kras);
  } catch (error) {
    console.error("Error fetching KRAs:", error);
    res.status(500).json({ error: "Failed to fetch KRAs" });
  }
};

// Get KRA by ID
const getKRAById = async (req, res) => {
  try {
    const kra = await KRA.findById(req.params.id)
      .populate("department", "name")
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    if (!kra) {
      return res.status(404).json({ error: "KRA not found" });
    }

    res.json(kra);
  } catch (error) {
    console.error("Error fetching KRA:", error);
    res.status(500).json({ error: "Failed to fetch KRA" });
  }
};

// Get KRAs by assigned user
const getKRAsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log("Fetching KRAs for user ID:", userId);
    
    // Validate ObjectId format
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      console.error("Invalid user ID format:", userId);
      return res.status(400).json({ error: "Invalid user ID format" });
    }
    
    const kras = await KRA.find({ assignedTo: userId })
      .populate("department", "name")
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    console.log("Found KRAs:", kras.length);
    res.json(kras);
  } catch (error) {
    console.error("Error fetching user KRAs:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({ error: "Failed to fetch user KRAs", details: error.message });
  }
};

// Create new KRA
const createKRA = async (req, res) => {
  try {
    const {
      title,
      responsibilityAreas,
      department,
      assignedTo,
      startDate,
      endDate,
      description,
      priority,
    } = req.body;

    // Validate required fields
    if (!title || !responsibilityAreas || !department || !assignedTo || !startDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate that assignedTo user exists
    const user = await User.findById(assignedTo);
    if (!user) {
      return res.status(400).json({ error: "Assigned user not found" });
    }

    // Validate that department exists
    const dept = await Department.findById(department);
    if (!dept) {
      return res.status(400).json({ error: "Department not found" });
    }

    // Create new KRA
    const newKRA = new KRA({
      title,
      responsibilityAreas: Array.isArray(responsibilityAreas) 
        ? responsibilityAreas 
        : responsibilityAreas.split('\n').filter(area => area.trim()),
      department,
      assignedTo,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      description,
      priority: priority || "medium",
      createdBy: req.user.id, // Assuming user ID is available in req.user
    });

    const savedKRA = await newKRA.save();
    
    // Populate the response
    const populatedKRA = await KRA.findById(savedKRA._id)
      .populate("department", "name")
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    res.status(201).json(populatedKRA);
  } catch (error) {
    console.error("Error creating KRA:", error);
    res.status(500).json({ error: "Failed to create KRA" });
  }
};

// Update KRA
const updateKRA = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Convert responsibility areas if it's a string
    if (updateData.responsibilityAreas && typeof updateData.responsibilityAreas === 'string') {
      updateData.responsibilityAreas = updateData.responsibilityAreas
        .split('\n')
        .filter(area => area.trim());
    }

    // Convert dates if provided
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }

    const updatedKRA = await KRA.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("department", "name")
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    if (!updatedKRA) {
      return res.status(404).json({ error: "KRA not found" });
    }

    res.json(updatedKRA);
  } catch (error) {
    console.error("Error updating KRA:", error);
    res.status(500).json({ error: "Failed to update KRA" });
  }
};

// Delete KRA
const deleteKRA = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedKRA = await KRA.findByIdAndDelete(id);

    if (!deletedKRA) {
      return res.status(404).json({ error: "KRA not found" });
    }

    res.json({ message: "KRA deleted successfully" });
  } catch (error) {
    console.error("Error deleting KRA:", error);
    res.status(500).json({ error: "Failed to delete KRA" });
  }
};

// Update KRA status
const updateKRAStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "completed", "cancelled", "on-hold"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const updatedKRA = await KRA.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    )
      .populate("department", "name")
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    if (!updatedKRA) {
      return res.status(404).json({ error: "KRA not found" });
    }

    res.json(updatedKRA);
  } catch (error) {
    console.error("Error updating KRA status:", error);
    res.status(500).json({ error: "Failed to update KRA status" });
  }
};

module.exports = {
  getAllKRAs,
  getKRAById,
  getKRAsByUser,
  createKRA,
  updateKRA,
  deleteKRA,
  updateKRAStatus,
};
