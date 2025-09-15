const Department = require("../models/Department");

// Create a new department
exports.createDepartment = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Department name is required" });
    }
    const existing = await Department.findOne({ name });
    if (existing) {
      return res.status(409).json({ message: "Department already exists" });
    }
    const department = new Department({ name });
    await department.save();
    res.status(201).json(department);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get all departments
exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find();
    res.status(200).json(departments);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update department
exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Department name is required" });
    }
    const department = await Department.findByIdAndUpdate(
      id,
      { name },
      { new: true }
    );
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }
    res.status(200).json(department);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Delete department
exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const department = await Department.findByIdAndDelete(id);
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }
    res.status(200).json({ message: "Department deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
