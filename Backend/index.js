const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const connectDB = require("./config/db");
const User = require("./models/User");
const Department = require("./models/Department");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const cors = require("cors");

// Ensure upload directories exist
const uploadDirs = [
  path.join(__dirname, "uploads"),
  path.join(__dirname, "uploads", "faqs")
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Allow localhost, 127.0.0.1, and network IP for frontend
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://172.17.20.56:3000" // Add your network IP here
];

const userRoutes = require("./routes/userRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const kraRoutes = require("./routes/kraRoutes");
const dailyTaskRoutes = require("./routes/dailyTaskRoutes");
const faqRoutes = require("./routes/faqRoutes");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS: ' + origin));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Parse JSON and URL-encoded bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


// Health check route for frontend connectivity
app.get("/api/server-status", (req, res) => {
  res.json({ status: "ok", message: "Backend server is running" });
});

app.use("/api", userRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/kras", kraRoutes);
app.use("/api/daily-tasks", dailyTaskRoutes);
app.use("/api/faqs", faqRoutes);

app.get("/", (req, res) => {
  res.send("hello world");
});

async function seedSuperAdmin() {
  const hash = await bcrypt.hash("Sashan12k", 10);
  const update = {
    username: "tyrone",
    name: "Tyrone Super Admin",
    email: "tyrone@netwebindia.com",
    password: hash,
    role: "superadmin",
    isSuperAdmin: true,
    // No department for superadmin
  };
  const result = await User.findOneAndUpdate(
    { $or: [ { email: "tyrone@netwebindia.com" }, { username: "tyrone" } ] },
    update,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  if (result) {
    console.log("Superadmin user ensured/updated successfully");
  }
}


// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);
  console.log('📊 Total connections:', io.engine.clientsCount);
  
  // Join admin room for real-time updates
  socket.on('join-admin-room', () => {
    socket.join('admin-room');
    console.log('✅ User joined admin room:', socket.id);
    // Send confirmation
    socket.emit('admin-room-joined', { message: 'Successfully joined admin room' });
  });

  // Join user-specific room for escalated tasks
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log('✅ User joined user room:', socket.id, 'for user:', userId);
  });
  
  // Leave admin room
  socket.on('leave-admin-room', () => {
    socket.leave('admin-room');
    console.log('❌ User left admin room:', socket.id);
  });

  
  socket.on('disconnect', (reason) => {
    console.log('❌ User disconnected:', socket.id, 'Reason:', reason);
    console.log('📊 Remaining connections:', io.engine.clientsCount);
  });

  socket.on('error', (error) => {
    console.error('💥 Socket error:', error);
  });
});

// Log when Socket.IO is ready
io.on('connect', () => {
  console.log('🚀 Socket.IO server is ready');
});

// Log server startup
console.log('🔧 Socket.IO server configured with CORS for:', ["http://localhost:3000", "http://127.0.0.1:3000"]);

// Make io available to routes
app.set('io', io);

connectDB().then(async () => {
  console.log("Database connected, seeding users...");
  await seedSuperAdmin();
  console.log("Users seeded, starting server...");
  server.listen(5000, '0.0.0.0', () => {
    console.log("Server started on http://0.0.0.0:5000 (accessible on your network IP)");
  });
}).catch((error) => {
  console.error("Failed to start server:", error);
});

