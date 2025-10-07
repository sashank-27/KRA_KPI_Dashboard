const FAQ = require("../models/FAQ");
const DailyTask = require("../models/DailyTask");
const path = require("path");
const fs = require("fs");

// Get all FAQs (with optional filtering)
exports.getAllFAQs = async (req, res) => {
  try {
    const { srId, search } = req.query;
    const filter = { isActive: true };

    if (srId) {
      filter.srId = srId;
    }

    let query = FAQ.find(filter)
      .populate("solvedBy", "name email")
      .populate("department", "name")
      .populate("task", "task")
      .sort({ createdAt: -1 });

    // Search functionality
    if (search) {
      query = query.where({
        $or: [
          { problem: { $regex: search, $options: "i" } },
          { srId: { $regex: search, $options: "i" } },
          { tags: { $in: [new RegExp(search, "i")] } }
        ]
      });
    }

    const faqs = await query;
    res.json(faqs);
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    res.status(500).json({ message: "Failed to fetch FAQs", error: error.message });
  }
};

// Get public FAQs (only active ones) - kept for compatibility
exports.getPublicFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.find({ isActive: true })
      .populate("solvedBy", "name email")
      .populate("department", "name")
      .select("problem srId solutionFile solvedBy department createdAt tags")
      .sort({ createdAt: -1 });

    res.json(faqs);
  } catch (error) {
    console.error("Error fetching public FAQs:", error);
    res.status(500).json({ message: "Failed to fetch FAQs", error: error.message });
  }
};

// Get FAQ by ID
exports.getFAQById = async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id)
      .populate("solvedBy", "name email")
      .populate("department", "name")
      .populate("task", "task remarks");

    if (!faq) {
      return res.status(404).json({ message: "FAQ not found" });
    }

    res.json(faq);
  } catch (error) {
    console.error("Error fetching FAQ:", error);
    res.status(500).json({ message: "Failed to fetch FAQ", error: error.message });
  }
};

// Create new FAQ (called when completing a task with SR-ID)
exports.createFAQ = async (req, res) => {
  try {
    console.log("=== FAQ Creation Request ===");
    console.log("Body:", req.body);
    console.log("File:", req.file);
    console.log("User:", req.user);
    
    const { taskId, problem, srId, tags } = req.body;
    const file = req.file;

    // Validate required fields
    if (!taskId || !problem || !srId || !file) {
      console.error("Validation failed:", { taskId: !!taskId, problem: !!problem, srId: !!srId, file: !!file });
      return res.status(400).json({ 
        message: "Task ID, problem description, SR-ID, and solution file are required",
        missing: {
          taskId: !taskId,
          problem: !problem,
          srId: !srId,
          file: !file
        }
      });
    }

    // Verify task exists and has SR-ID
    const task = await DailyTask.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (!task.srId || task.srId !== srId) {
      return res.status(400).json({ message: "Task SR-ID mismatch" });
    }

    // Create FAQ entry
    const faq = new FAQ({
      problem,
      srId,
      task: taskId,
      solutionFile: {
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size,
      },
      solvedBy: req.user.id, // JWT token uses 'id', not 'userId'
      department: task.department,
      tags: tags ? tags.split(",").map(t => t.trim()) : [],
      isActive: true,
    });

    await faq.save();

    // Update task status to closed
    task.status = "closed";
    task.closedAt = new Date();
    await task.save();

    const populatedFAQ = await FAQ.findById(faq._id)
      .populate("solvedBy", "name email")
      .populate("department", "name")
      .populate("task", "task");

    console.log("✅ FAQ created successfully:", populatedFAQ._id);
    
    res.status(201).json({
      message: "FAQ created and task completed successfully",
      faq: populatedFAQ,
    });
  } catch (error) {
    console.error("❌ Error creating FAQ:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      message: "Failed to create FAQ", 
      error: error.message,
      details: error.toString()
    });
  }
};

// Toggle FAQ active status (soft delete)
exports.toggleFAQStatus = async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);

    if (!faq) {
      return res.status(404).json({ message: "FAQ not found" });
    }

    faq.isActive = !faq.isActive;
    await faq.save();

    res.json({
      message: `FAQ ${faq.isActive ? "activated" : "deactivated"} successfully`,
      faq,
    });
  } catch (error) {
    console.error("Error toggling FAQ status:", error);
    res.status(500).json({ message: "Failed to toggle FAQ status", error: error.message });
  }
};

// Download solution file
exports.downloadSolution = async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);

    if (!faq) {
      return res.status(404).json({ message: "FAQ not found" });
    }

    const filePath = path.resolve(faq.solutionFile.path);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Solution file not found" });
    }

    res.download(filePath, faq.solutionFile.originalName);
  } catch (error) {
    console.error("Error downloading solution:", error);
    res.status(500).json({ message: "Failed to download solution", error: error.message });
  }
};

// Get FAQ statistics
exports.getFAQStats = async (req, res) => {
  try {
    const totalFAQs = await FAQ.countDocuments({ isActive: true });
    
    const faqsByDepartment = await FAQ.aggregate([
      { $match: { isActive: true } },
      { 
        $lookup: {
          from: "departments",
          localField: "department",
          foreignField: "_id",
          as: "dept"
        }
      },
      { $unwind: "$dept" },
      { $group: { _id: "$dept.name", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      totalFAQs,
      faqsByDepartment,
    });
  } catch (error) {
    console.error("Error fetching FAQ stats:", error);
    res.status(500).json({ message: "Failed to fetch FAQ statistics", error: error.message });
  }
};
