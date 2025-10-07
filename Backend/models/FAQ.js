const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema(
  {
    // Problem description (question)
    problem: {
      type: String,
      required: true,
      trim: true,
    },
    // SR-ID from the task
    srId: {
      type: String,
      required: true,
      trim: true,
    },
    // Task reference
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DailyTask",
      required: true,
    },
    // Solution file details
    solutionFile: {
      filename: {
        type: String,
        required: true,
      },
      originalName: {
        type: String,
        required: true,
      },
      path: {
        type: String,
        required: true,
      },
      mimetype: {
        type: String,
        required: true,
      },
      size: {
        type: Number,
        required: true,
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
    // User who solved the problem
    solvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Department reference
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    // Tags for better searching
    tags: [{
      type: String,
      trim: true,
    }],
    // Active status
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
faqSchema.index({ srId: 1 });
faqSchema.index({ solvedBy: 1 });
faqSchema.index({ department: 1 });
faqSchema.index({ isActive: 1, createdAt: -1 });
faqSchema.index({ task: 1 });

module.exports = mongoose.model("FAQ", faqSchema);
