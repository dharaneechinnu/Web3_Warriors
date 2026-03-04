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

// Pass io to MentorshipController for real-time notifications
const mentorshipController = require('./Controller/MentorshipController');
mentorshipController.setIO(io);

// Pass io to ChallengeController for real-time notifications
const challengeController = require('./Controller/ChallengeController');
challengeController.setIO(io);

// Pass io to CourseController for enrollment/grading notifications
const courseController = require('./Controller/CourseController');
courseController.setIO(io);

// ── Web3 health check on startup ──────────────────────────────────────────────
const { checkConnection } = require('./web3/web3Provider');
checkConnection();

// Socket.IO: let authenticated users join their personal notification room
io.on('connection', (socket) => {
    socket.on('join-notifications', (userId) => {
        if (userId) {
            socket.join(`user_${userId}`);
            socket.join(`mentor_${userId}`);
            socket.join(`learner_${userId}`);
        }
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
    'uploads/challenges',
    'uploads/images',
    'uploads/mentors',
    'uploads/resumes',
    'uploads/intros',      // Mentor intro videos
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

// Serve uploaded files with proper MIME types and headers for video streaming
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
  setHeaders: (res, filePath) => {
    // Handle video files
    if (filePath.endsWith('.mp4')) {
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Accept-Ranges', 'bytes');
    } else if (filePath.endsWith('.webm')) {
      res.setHeader('Content-Type', 'video/webm');
      res.setHeader('Accept-Ranges', 'bytes');
    } else if (filePath.endsWith('.mov')) {
      res.setHeader('Content-Type', 'video/quicktime');
      res.setHeader('Accept-Ranges', 'bytes');
    }
    // Handle PDF files
    else if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
    }
    // Handle image files
    else if (filePath.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      res.setHeader('Content-Type', `image/${filePath.split('.').pop().toLowerCase()}`);
    }
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
  }
}));

// Serve test pages from public directory
app.use("/test", express.static(path.join(__dirname, "public")));

app.use("/courses", require("./Router/courseRoutes"));
// app.use("/courses", require("./Router/CourseProgressRoutes")); // Removed - progress tracking disabled
app.use("/udemy-courses", require("./Router/UdemyStyleCourseRoutes")); // New Udemy-style courses
app.use("/mentorship",require("./Router/MentorRouter"))

// New feature routes
app.use("/wallet", require("./Router/walletRoutes"));
app.use("/challenges", require("./Router/ChallengeRoutes"));
app.use("/sessions", require("./Router/SessionRoutes"));
app.use("/notifications", require("./Router/NotificationRoutes"));
app.use("/availability", require("./Router/AvailabilityRoutes"));
app.use("/mentorship-requests", require("./Router/MentorshipRequestRoutes"));
app.use("/slots", require("./Router/SlotRoutes"));

// Mentor application & AI evaluation
app.use("/mentor-application", require("./Router/mentorApplicationRoutes"));

// Admin panel (mentor approval / rejection)
app.use("/api/admin", require("./Router/adminRoutes"));

httpServer.listen(PORT, () => {
    console.log(`Server is running on PORT: ${PORT} (HTTP + WebSocket)`);
});