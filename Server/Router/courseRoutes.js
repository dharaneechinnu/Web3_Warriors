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

// Update progress for learner
router.post('/updateProgress', courseController.updateProgress);

// Get progress for learner in a specific course
router.get('/getProgress/:learnerId/:courseId', courseController.getProgress);



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

module.exports = router;
