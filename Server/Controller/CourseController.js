const Course = require('../Model/CourseModel');
const path = require('path');
const User = require("../Model/UserModel")
// Upload course
exports.uploadCourse = async (req, res) => {
    try {
        const { title, description, mentorId } = req.body;  // Get mentorId from the request body

        // Check for missing fields
        if (!title || !description || !mentorId) {
            return res.status(400).json({ message: "Title, Description, and Mentor ID are required" });
        }

        // Check for missing files
        if (!req.files || !req.files.image || !req.files.thumbnail || !req.files.video) {
            return res.status(400).json({ message: "Image, thumbnail, and video are required" });
        }

        // Get file paths
        const imagePath = path.join("uploads/images/", req.files.image[0].filename);
        const thumbnailPath = path.join("uploads/images/", req.files.thumbnail[0].filename);
        const videoPath = path.join("uploads/videos/", req.files.video[0].filename);

        // Create new course document
        const newCourse = await Course.create({
            mentorId,  // Use the mentorId from the request body
            title,
            description,
            image: imagePath,
            thumbnail: thumbnailPath,
            video: videoPath
        });

        // Respond with only course details (excluding mentorId)
        const courseDetails = {
            title: newCourse.title,
            description: newCourse.description,
            image: newCourse.image,
            thumbnail: newCourse.thumbnail,
            video: newCourse.video,
            createdAt: newCourse.createdAt
        };

        res.status(201).json({ message: "Course uploaded successfully", course: courseDetails });

    } catch (error) {
        console.error("Error uploading course:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get all courses (excluding mentor details)
exports.getAllCourses = async (req, res) => {
    try {
        const courses = await Course.find().select('title description image thumbnail video createdAt');  // Only select course details
        res.status(200).json(courses);
    } catch (error) {
        console.error("Error fetching courses:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get a single course by ID (excluding mentor details)
exports.getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).select('title description image thumbnail video createdAt');  // Only select course details
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }
        res.status(200).json(course);
    } catch (error) {
        console.error("Error fetching course:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.enrollInCourse = async (req, res) => {
    try {
        const { learnerId, courseId } = req.body;  // Get learnerId and courseId from the request body
        console.log(learnerId, courseId)
        // Check if the course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Check if the learner already enrolled
        if (course.enrolledLearners.includes(learnerId)) {
            return res.status(400).json({ message: "You are already enrolled in this course" });
        }

        // Enroll the learner by updating both course and user
        course.enrolledLearners.push(learnerId);
        await course.save();

        // Add course to the learner's coursesEnrolled field
        const learner = await User.findById(learnerId);
        if (!learner) {
            return res.status(404).json({ message: "Learner not found" });
        }
        learner.coursesEnrolled.push(courseId);
        await learner.save();

        res.status(200).json({ message: "Successfully enrolled in the course", course });
    } catch (error) {
        console.error("Error enrolling in course:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.getMentorCourses = async (req, res) => {
    try {
        const mentorId = req.params.mentorId;  // Get mentorId from the URL

        // Find all courses for the mentor
        const courses = await Course.find({ mentorId: mentorId })

        // If no courses are found
        if (!courses || courses.length === 0) {
            return res.status(404).json({ message: "No courses found for this mentor" });
        }

        // Prepare the course data with enrolled learner count
        const coursesWithEnrollmentCount = courses.map(course => ({
            title: course.title,
            description: course.description,
            enrolledLearnersCount: course.enrolledLearners
        }));

        res.status(200).json({ courses: coursesWithEnrollmentCount });
    } catch (error) {
        console.error("Error fetching courses for mentor:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Update learner's progress in a specific course


    exports.updateProgress = async (req, res) => {
    try {
        const { learnerId, courseId, progress } = req.body;  // Get learnerId, courseId, and progress from request body

        // Validate progress value
        if (progress < 0 || progress > 100) {
            return res.status(400).json({ message: 'Progress must be between 0 and 100' });
        }

        // Find the learner and the course
        const learner = await User.findById(learnerId);
        if (!learner) {
            return res.status(404).json({ message: 'Learner not found' });
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if the learner is enrolled in the course
        if (!learner.coursesEnrolled.includes(courseId)) {
            return res.status(400).json({ message: 'Learner is not enrolled in this course' });
        }

        // Initialize progress array if it doesn't exist
        if (!learner.progress) {
            learner.progress = [];
        }

        // Check if progress entry for this course already exists
        const progressIndex = learner.progress.findIndex(p => p.courseId.toString() === courseId.toString());

        if (progressIndex === -1) {
            // If progress entry doesn't exist, create it
            learner.progress.push({ courseId, progress });
        } else {
            // If progress entry exists, update it
            learner.progress[progressIndex].progress = progress;
        }

        await learner.save();

        res.status(200).json({ message: 'Progress updated successfully', progress: learner.progress });
    } catch (error) {
        console.error('Error updating progress:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


exports.getProgress = async (req, res) => {
    try {
        const { learnerId, courseId } = req.params;  // Get learnerId and courseId from URL params

        // Find the learner
        const learner = await User.findById(learnerId);
        if (!learner) {
            return res.status(404).json({ message: 'Learner not found' });
        }

        // Ensure progress field exists
        if (!learner.progress) {
            learner.progress = [];  // Initialize as an empty array if undefined
        }

        // Find the progress for the course
        const progressEntry = learner.progress.find(p => p.courseId.toString() === courseId.toString());

        if (!progressEntry) {
            return res.status(404).json({ message: 'Progress not found for this course' });
        }

        res.status(200).json({ progress: progressEntry.progress });
    } catch (error) {
        console.error('Error fetching progress:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


exports.completeCourse = async (req, res) => {
    try {
        const { learnerId, courseId } = req.body;

        // Find the course
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Check if learner is enrolled
        const progressEntry = course.progress.find(p => p.learnerId.toString() === learnerId);
        if (!progressEntry) {
            return res.status(400).json({ message: "User is not enrolled in this course" });
        }

        // Update progress to 100% and mark as completed
        progressEntry.progress = 100;
        progressEntry.completed = true;

        await course.save();

        res.status(200).json({ message: "Course marked as completed", course });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

// Get completed courses for a learner
exports.getCompletedCourses = async (req, res) => {
    try {
        const { learnerId } = req.params;

        // Find courses where the learner has completed them
        const completedCourses = await Course.find({
            "progress.learnerId": learnerId,
            "progress.completed": true
        });

        res.status(200).json({ completedCourses });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

// In courseController.js

exports.getEnrolledCourses = async (req, res) => {
    try {
        const { userId } = req.params;

        // Find all courses that have the userId in the enrolledLearners array
        const enrolledCourses = await Course.find({ enrolledLearners: userId });
        if (enrolledCourses.length === 0) {
            return res.status(404).json({ message: "No courses found for this user" });
        }
        console.log(enrolledCourses)
        res.status(200).json({ enrolledCourses });

    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};
