require('dotenv').config();
const express= require("express");
const app = express();
const http = require('http');
const { Server: SocketIOServer } = require('socket.io');
const { PORT, CLIENT_URL } = require('./config/appConfig');
const mongoose = require('mongoose');
const cors = require("cors");
const path = require("path");
const fs = require('fs');

// ── HTTP server & Socket.IO ───────────────────────────────────────────────────
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});
require('./sockets/signaling')(io);

// Pass io to SessionController so it can emit real-time notifications
const sessionController = require('./Controller/SessionController');
sessionController.setIO(io);

// Socket.IO: let authenticated users join their personal notification room
io.on('connection', (socket) => {
    socket.on('join-notifications', (userId) => {
        if (userId) socket.join(`user_${userId}`);
    });
});

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB)
   .then(()=>{console.log("DataBase Connect Successfully...")})
  .catch(err=>{
        console.log("Error in While connection  : ",err);
    })

// Ensure upload directories exist to prevent multer write errors
const uploadDirs = [
    'uploads/courses/thumbnails',
    'uploads/courses/promos',
    'uploads/courses/videos',
    'uploads/courses/resources',
    'uploads/courses/assignments',
    'uploads/assignments', // Add this for the new assignment uploads
    'uploads/images',
    'uploads/mentors'
];
uploadDirs.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    try {
        fs.mkdirSync(fullPath, { recursive: true });
    } catch (err) {
        console.warn('Could not create upload directory', fullPath, err.message);
    }
});

// Keep existing generic Auth router for compatibility
app.use("/Auth", require("./Router/AuthRouter"))

// Mount role-specific auth routers
app.use('/Auth/learner', require('./Router/LearnerAuthRouter'))
app.use('/Auth/mentor', require('./Router/MentorAuthRouter'))
app.use("/User",require("./Router/userRoutes"))
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Serve uploaded files
app.use("/courses", require("./Router/courseRoutes"));
// app.use("/courses", require("./Router/CourseProgressRoutes")); // Removed - progress tracking disabled
app.use("/udemy-courses", require("./Router/UdemyStyleCourseRoutes")); // New Udemy-style courses
app.use("/mentorship",require("./Router/MentorRouter"))

// New feature routes
app.use("/wallet", require("./Router/walletRoutes"));
app.use("/challenges", require("./Router/ChallengeRoutes"));
app.use("/sessions", require("./Router/SessionRoutes"));
app.use("/notifications", require("./Router/NotificationRoutes"));

httpServer.listen(PORT, () => {
    console.log(`Server is running on PORT: ${PORT} (HTTP + WebSocket)`);
});