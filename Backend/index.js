// ...existing code...
const express = require("express");
const connectDB = require("./config/db");
const User = require("./models/User");
const Department = require("./models/Department");
const bcrypt = require("bcryptjs");

const cors = require("cors");

const userRoutes = require("./routes/userRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const kraRoutes = require("./routes/kraRoutes");
const dailyTaskRoutes = require("./routes/dailyTaskRoutes");

const app = express();
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

app.use("/api", userRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/kras", kraRoutes);
app.use("/api/daily-tasks", dailyTaskRoutes);

app.get("/", (req, res) => {
  res.send("hello world");
});

async function seedSuperAdmin() {
  const superAdmin = await User.findOne({ email: "tyrone@superadmin.com" });
  if (!superAdmin) {
    const hash = await bcrypt.hash("Sashan12k", 10);
    await User.create({
      username: "tyrone",
      name: "Tyrone Super Admin",
      email: "tyrone@superadmin.com",
      password: hash,
      role: "superadmin",
      isSuperAdmin: true,
      // No department for superadmin
    });
    console.log("Superadmin user created successfully");
  }
}

async function seedAdmin() {
  const admin = await User.findOne({ email: "admin@gmail.com" });
  if (!admin) {
    // Create a default admin department if it doesn't exist
    let adminDepartment = await Department.findOne({ name: "Administration" });
    if (!adminDepartment) {
      adminDepartment = await Department.create({ name: "Administration" });
    }
    
    const hash = await bcrypt.hash("password123", 10);
    await User.create({
      username: "admin",
      name: "Administrator",
      email: "admin@gmail.com",
      password: hash,
      role: "admin",
      department: adminDepartment._id,
    });
  }
}

connectDB().then(async () => {
  console.log("Database connected, seeding users...");
  await seedSuperAdmin();
  await seedAdmin();
  console.log("Users seeded, starting server...");
  app.listen(5000, () => {
    console.log("Server started on http://localhost:5000");
  });
}).catch((error) => {
  console.error("Failed to start server:", error);
});
