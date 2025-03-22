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

router.get("/mentor/:mentorId", courseController.getMentorCourses);

// Update progress for learner
router.post('/updateProgress', courseController.updateProgress);

// Get progress for learner in a specific course
router.get('/getProgress/:learnerId/:courseId', courseController.getProgress);


// Mark course as completed
router.post("/complete", courseController.completeCourse);

// Get all completed courses for a learner
router.get("/completed/:learnerId", courseController.getCompletedCourses);



module.exports = router;
