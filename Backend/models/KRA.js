const mongoose = require("mongoose");

const KRASchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    responsibilityAreas: [{
      type: String,
      required: true,
      trim: true,
    }],
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: false,
    },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled", "on-hold"],
      default: "active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
  },
  { timestamps: true }
);

// Index for better query performance
KRASchema.index({ assignedTo: 1, status: 1 });
KRASchema.index({ department: 1, status: 1 });
KRASchema.index({ createdBy: 1 });

module.exports = mongoose.model("KRA", KRASchema);
