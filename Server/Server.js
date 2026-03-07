const dotenv = require('dotenv');
// Load environment-specific file first (.env.development or .env.production),
// then fall back to .env so VPS deployments (which only have .env) still work.
const NODE_ENV = process.env.NODE_ENV || 'development';
dotenv.config({ path: `.env.${NODE_ENV}` });
dotenv.config(); // fallback: loads .env without overriding already-set vars

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

// Socket.IO with same CORS whitelist
const allowedSocketOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://187.124.96.177:3000',
    'https://ardk.online',
    'https://www.ardk.online',
    CLIENT_URL.replace(/\/$/, ''),
];

const io = new SocketIOServer(httpServer, {
    cors: { 
        origin: allowedSocketOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    }
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

// ── CORS Configuration with Whitelist ─────────────────────────────────────────
const allowedOrigins = [
    'http://localhost:3000',           // Development frontend
    'http://localhost:3001',           // Alternative dev port
    'http://127.0.0.1:3000',           // Localhost alternative
    'http://187.124.96.177:3000',      // Dev machine IP
    'https://ardk.online',             // Production frontend
    'https://www.ardk.online',         // Production frontend with www
    CLIENT_URL.replace(/\/$/, ''),     // CLIENT_URL from .env (normalized)
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        
        // Check if origin is in whitelist
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`⚠️  CORS blocked request from origin: ${origin}`);
            callback(new Error(`CORS policy: Origin ${origin} is not allowed`));
        }
    },
    credentials: true, // Allow cookies and authorization headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Range', // For video streaming
    ],
    exposedHeaders: [
        'Content-Length',
        'Content-Range',
        'Accept-Ranges',
        'X-Total-Count',
    ],
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
    maxAge: 86400, // Cache preflight response for 24 hours
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "600mb" }));
app.use(express.urlencoded({ limit: "600mb", extended: true }));

// Explicit CORS header middleware (robust handling for preflight in production)
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (!origin) return next(); // allow tools/servers with no origin header

    if (allowedOrigins.indexOf(origin) !== -1) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Range');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, X-Total-Count');
        if (req.method === 'OPTIONS') return res.sendStatus(200);
    } else {
        console.warn(`⚠️  CORS middleware: blocked origin ${origin}`);
    }

    return next();
});

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

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res, filePath) => {

      // Enable video streaming
      res.setHeader("Accept-Ranges", "bytes");

      // Video types
      if (filePath.endsWith(".mp4")) {
        res.setHeader("Content-Type", "video/mp4");
      }
      else if (filePath.endsWith(".webm")) {
        res.setHeader("Content-Type", "video/webm");
      }
      else if (filePath.endsWith(".mov")) {
        res.setHeader("Content-Type", "video/quicktime");
      }

      // PDF
      else if (filePath.endsWith(".pdf")) {
        res.setHeader("Content-Type", "application/pdf");
      }

      // Images
      else if (filePath.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        const ext = path.extname(filePath).toLowerCase();
        res.setHeader("Content-Type", `image/${ext.replace(".", "")}`);
      }

      /*
      ----------------------------------------
      CORS HEADERS FOR VIDEO STREAMING
      ----------------------------------------
      */
      res.setHeader("Access-Control-Allow-Origin", "https://ardk.online");
      res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Range");
      res.setHeader(
        "Access-Control-Expose-Headers",
        "Content-Length, Content-Range, Accept-Ranges"
      );
    }
  })
);
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