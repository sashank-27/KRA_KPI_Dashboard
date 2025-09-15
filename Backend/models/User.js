const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["superadmin", "admin", "user"], required: true },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    required: function() {
      return this.role !== "superadmin";
    },
  },
  isSuperAdmin: { type: Boolean, default: false },
  joined: { type: Date, default: Date.now },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  avatar: { type: String, required: false },
});

module.exports = mongoose.model("User", userSchema);
