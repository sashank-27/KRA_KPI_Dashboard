const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
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
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

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

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join admin room for real-time updates
  socket.on('join-admin-room', () => {
    socket.join('admin-room');
    console.log('User joined admin room:', socket.id);
  });
  
  // Leave admin room
  socket.on('leave-admin-room', () => {
    socket.leave('admin-room');
    console.log('User left admin room:', socket.id);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

connectDB().then(async () => {
  console.log("Database connected, seeding users...");
  await seedSuperAdmin();
  await seedAdmin();
  console.log("Users seeded, starting server...");
  server.listen(5000, () => {
    console.log("Server started on http://localhost:5000");
  });
}).catch((error) => {
  console.error("Failed to start server:", error);
});
