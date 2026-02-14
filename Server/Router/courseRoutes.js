const express = require("express");
const router = express.Router();
const courseController = require("../Controller/CourseController");
const upload = require("../MiddleWare/Upload");


// Route to upload a new course
router.post(
    "/upload",
    upload.fields([
        { name: "image", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 },
        { name: "video", maxCount: 1 }
    ]),
    courseController.uploadCourse
);

// Route to get all courses
router.get("/getall", courseController.getAllCourses);

// Route to get a single course by ID
router.get("/:id", courseController.getCourseById);

//router to enroll user 
router.post("/enroll", courseController.enrollInCourse);

router.get("/enrolled/:userId", courseController.getEnrolledCourses);

router.get("/mentor/:mentorId", courseController.getMentorCourses);

// Progress tracking routes
router.post('/updateLectureProgress', courseController.updateLectureProgress);
router.get('/progress/:learnerId/:courseId', courseController.getCourseProgress);
router.get('/progress/:learnerId/:courseId/:lectureId', courseController.getLectureProgress);
router.get('/current-position/:learnerId/:courseId', courseController.getUserCurrentPosition);



// Mark course as completed and award certification
router.post("/complete/:courseId/:userId", courseController.completeCourse);

// Get all completed courses for a learner
router.get("/completed/:learnerId", courseController.getCompletedCourses);

// Update course
router.put(
    "/update/:id",
    upload.fields([
        { name: "image", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 },
        { name: "video", maxCount: 1 }
    ]),
    courseController.updateCourse
);

// Delete course
router.delete("/delete/:id", courseController.deleteCourse);

// Save course curriculum (sections and lectures)
router.post("/save-curriculum", courseController.saveCurriculum);

// Add quiz to a specific lecture
router.post("/add-quiz", courseController.addQuizToLecture);

// Add assignment to a specific lecture
router.post("/add-assignment", courseController.addAssignmentToLecture);

// Update article content for a specific lecture
router.post("/update-article", courseController.updateArticleContent);

// Get quiz data for a specific lecture
router.get("/:courseId/section/:sectionIndex/lecture/:lectureIndex/quiz", courseController.getQuizData);

// Get assignment data for a specific lecture
router.get("/:courseId/section/:sectionIndex/lecture/:lectureIndex/assignment", courseController.getAssignmentData);

// Get article data for a specific lecture
router.get("/:courseId/section/:sectionIndex/lecture/:lectureIndex/article", courseController.getArticleData);

// ============================================
// LEARNER CONTENT RETRIEVAL ROUTES
// ============================================

// Get full course content for learner (structured curriculum)
router.get("/learner/content/:courseId", courseController.getCourseContentForLearner);

// Get specific lecture content
router.get("/learner/:courseId/section/:sectionId/lecture/:lectureId", courseController.getLectureContent);

// Submit quiz answers and get results
router.post("/:courseId/section/:sectionIndex/lecture/:lectureIndex/quiz/submit", courseController.submitQuizAnswers);

module.exports = router;
