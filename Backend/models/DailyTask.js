const mongoose = require("mongoose");

const DailyTaskSchema = new mongoose.Schema(
  {
    task: {
      type: String,
      required: true,
      trim: true,
    },
    srId: {
      type: String,
      required: false,
      trim: true,
    },
    remarks: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["in-progress", "closed"],
      default: "in-progress",
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    attachments: [{
      filename: String,
      url: String,
      uploadedAt: { type: Date, default: Date.now },
    }],
    // Escalation fields
    escalatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    escalatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    escalatedAt: {
      type: Date,
      default: null,
    },
    escalationReason: {
      type: String,
      trim: true,
      default: "",
    },
    isEscalated: {
      type: Boolean,
      default: false,
    },
    originalUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for better query performance
DailyTaskSchema.index({ user: 1, date: -1 });
DailyTaskSchema.index({ department: 1, date: -1 });
DailyTaskSchema.index({ status: 1, date: -1 });
DailyTaskSchema.index({ srId: 1 });
DailyTaskSchema.index({ escalatedTo: 1, isEscalated: 1 });
DailyTaskSchema.index({ originalUser: 1, isEscalated: 1 });

module.exports = mongoose.model("DailyTask", DailyTaskSchema);
