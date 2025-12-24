const Course = require('../Model/CourseModel');
const CertificationModel = require('../Model/CertificationModel');
const path = require('path');
const User = require("../Model/UserModel")

// Helper to build absolute URL for stored paths (normalize backslashes and ensure leading slash)
const makeAbsolute = (baseUrl, p) => {
    if (!p) return null;
    if (typeof p !== 'string') p = String(p);
    if (p.startsWith('http')) return p;
    // normalize backslashes to forward slashes
    let s = p.replace(/\\\\/g, '/').replace(/\\/g, '/');
    if (!s.startsWith('/')) s = '/' + s;
    return baseUrl + s;
};
// Upload course
exports.uploadCourse = async (req, res) => {
    try {
        const { 
            title, 
            description, 
            mentorId, 
            mentorName, 
            mentorEmail,
            price = '0',
            duration = '1 hour',
            level = 'beginner',
            category 
        } = req.body;

        // Check for missing required fields
        if (!title || !description || !mentorId || !category) {
            return res.status(400).json({ 
                message: "Title, Description, Mentor ID, and Category are required" 
            });
        }

        // Verify mentor exists
        const mentor = await User.findById(mentorId);
        if (!mentor || mentor.role !== 'mentor') {
            return res.status(400).json({ message: "Invalid mentor ID or user is not a mentor" });
        }

        // Files are optional, but if provided, validate them
        let imagePath, thumbnailPath, videoPath;
        
        if (req.files) {
            if (req.files.image) {
                imagePath = '/' + path.posix.join("uploads", "mentors", mentorId, "images", req.files.image[0].filename);
            }
            if (req.files.thumbnail) {
                thumbnailPath = '/' + path.posix.join("uploads", "mentors", mentorId, "images", req.files.thumbnail[0].filename);
            }
            if (req.files.video) {
                videoPath = '/' + path.posix.join("uploads", "mentors", mentorId, "videos", req.files.video[0].filename);
            }
        }

        // Create new course document
        const newCourse = await Course.create({
            mentorId,
            mentorName: mentorName || mentor.name,
            mentorEmail: mentorEmail || mentor.email,
            title,
            description,
            price: parseFloat(price),
            duration,
            level,
            category,
            image: imagePath,
            thumbnail: thumbnailPath,
            video: videoPath,
            enrolledLearners: [],
            isActive: true
        });

        // Respond with course details
        // Build absolute URLs for attachments so client can load them
        const baseUrl = req.protocol + '://' + req.get('host');

        const courseDetails = {
            _id: newCourse._id,
            title: newCourse.title,
            description: newCourse.description,
            price: newCourse.price,
            duration: newCourse.duration,
            level: newCourse.level,
            category: newCourse.category,
            mentorName: newCourse.mentorName,
            image: makeAbsolute(baseUrl, newCourse.image),
            thumbnail: makeAbsolute(baseUrl, newCourse.thumbnail),
            video: makeAbsolute(baseUrl, newCourse.video),
            createdAt: newCourse.createdAt
        };

        res.status(201).json({ 
            message: "Course uploaded successfully", 
            course: courseDetails 
        });

    } catch (error) {
        console.error("Error uploading course:", error);
        res.status(500).json({ 
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get all courses (excluding mentor details)
exports.getAllCourses = async (req, res) => {
    try {
        // Return the fields the client needs for listing (include price, mentorName, duration, level, category)
        const courses = await Course.find().select('title description image thumbnail video createdAt price duration level category mentorName');
        const baseUrl = req.protocol + '://' + req.get('host');
        const coursesWithUrls = courses.map(c => ({
            _id: c._id,
            title: c.title,
            description: c.description,
            price: c.price,
            duration: c.duration,
            level: c.level,
            category: c.category,
            mentorName: c.mentorName,
            createdAt: c.createdAt,
            image: makeAbsolute(baseUrl, c.image),
            thumbnail: makeAbsolute(baseUrl, c.thumbnail),
            video: makeAbsolute(baseUrl, c.video),
        }));
        res.status(200).json(coursesWithUrls);
    } catch (error) {
        console.error("Error fetching courses:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get a single course by ID (including curriculum for course viewing)
exports.getCourseById = async (req, res) => {
    try {
        // Include curriculum for course viewing
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }
        
        console.log('Course found with curriculum:', course.curriculum);
        
        // convert any stored paths to absolute URLs
        const baseUrl = req.protocol + '://' + req.get('host');
        const courseObj = course.toObject();
        courseObj.image = makeAbsolute(baseUrl, courseObj.image);
        courseObj.thumbnail = makeAbsolute(baseUrl, courseObj.thumbnail);
        courseObj.video = makeAbsolute(baseUrl, courseObj.video);
        
        // Convert video URLs in curriculum lectures
        if (courseObj.curriculum && courseObj.curriculum.sections) {
            courseObj.curriculum.sections.forEach(section => {
                if (section.lectures) {
                    section.lectures.forEach(lecture => {
                        if (lecture.videoUrl) {
                            lecture.videoUrl = makeAbsolute(baseUrl, lecture.videoUrl);
                        }
                    });
                }
            });
        }
        
        res.status(200).json(courseObj);
    } catch (error) {
        console.error("Error fetching course:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.enrollInCourse = async (req, res) => {
    try {
        const { learnerId, courseId, tokenCost = 5 } = req.body;  // Get learnerId, courseId, and tokenCost from the request body
        console.log(learnerId, courseId, tokenCost);
        
        // Check if the course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Find the learner
        const learner = await User.findById(learnerId);
        if (!learner) {
            return res.status(404).json({ message: "Learner not found" });
        }

        // Check if the learner already enrolled
        if (course.enrolledLearners.includes(learnerId)) {
            return res.status(400).json({ message: "You are already enrolled in this course" });
        }

        // Prevent mentors from enrolling in their own course
        try {
            const courseMentorId = course.mentorId || course.mentor || course.mentor?._id;
            const normalize = v => (v && v.toString) ? v.toString() : String(v || '');
            if (normalize(courseMentorId) === normalize(learnerId)) {
                return res.status(403).json({ message: "Mentors cannot enroll in their own course" });
            }
        } catch (e) {
            // if anything goes wrong with the check, log and continue (do not block enrollment for unrelated errors)
            console.warn('Error while checking mentor self-enroll prevention:', e);
        }

        // Check if learner has enough tokens
        if (learner.tokenBalance < tokenCost) {
            return res.status(400).json({ 
                message: `Insufficient tokens. You need ${tokenCost} tokens to enroll, but you only have ${learner.tokenBalance} tokens.` 
            });
        }

        // Deduct tokens from learner's balance
        learner.tokenBalance -= tokenCost;
        
        // Add transaction history
        learner.transactionHistory.push({
            transactionType: 'spend',
            amount: tokenCost,
            description: `Enrolled in course: ${course.title}`,
            timestamp: new Date()
        });

        // Enroll the learner by updating both course and user
        course.enrolledLearners.push(learnerId);
        learner.coursesEnrolled.push(courseId);

        // Save both documents
        await Promise.all([course.save(), learner.save()]);

        console.log(`Enrollment completed. Course now has ${course.enrolledLearners.length} enrolled learners.`);

        res.status(200).json({ 
            message: "Successfully enrolled in the course", 
            course: {
                _id: course._id,
                title: course.title,
                enrolledLearnersCount: course.enrolledLearners.length
            },
            tokensDeducted: tokenCost,
            remainingTokens: learner.tokenBalance
        });
    } catch (error) {
        console.error("Error enrolling in course:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.getMentorCourses = async (req, res) => {
    try {
        const mentorId = req.params.mentorId;  // Get mentorId from the URL

        // Find all courses for the mentor
        const courses = await Course.find({ mentorId: mentorId });

        // If no courses are found
        if (!courses || courses.length === 0) {
            return res.status(200).json({ courses: [] });
        }

        // Prepare the course data with enrolled learner count and all necessary fields
        const coursesWithEnrollmentCount = courses.map(course => {
            const enrolledCount = course.enrolledLearners ? course.enrolledLearners.length : 0;
            console.log(`Course "${course.title}" has ${enrolledCount} enrolled learners:`, course.enrolledLearners);
            
            return {
                _id: course._id,
                title: course.title,
                description: course.description,
                price: course.price,
                duration: course.duration,
                level: course.level,
                category: course.category,
                image: course.image,
                thumbnail: course.thumbnail,
                video: course.video,
                createdAt: course.createdAt,
                    enrolledLearnersCount: enrolledCount,
                    enrolledCount: enrolledCount,
                    enrolledLearners: course.enrolledLearners || []
            };
        });

        res.status(200).json({ courses: coursesWithEnrollmentCount });
    } catch (error) {
        console.error("Error fetching courses for mentor:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get enrolled courses for a learner with progress data
exports.getEnrolledCourses = async (req, res) => {
    try {
        const userId = req.params.userId;
        console.log('Fetching enrolled courses for user:', userId);
        
        // Find the user with enrolled courses
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }

        console.log('User found, enrolled courses count:', user.coursesEnrolled?.length || 0);
        
        // Find all enrolled courses
        const enrolledCourses = await Course.find({
            _id: { $in: user.coursesEnrolled }
        });

        console.log('Retrieved enrolled courses:', enrolledCourses.length);
        
        // Calculate progress for each enrolled course
        const baseUrl = req.protocol + '://' + req.get('host');
        const coursesWithProgress = await Promise.all(
            enrolledCourses.map(async (course) => {
                // Get lecture progress for this course
                const lectureProgress = user.lectureProgress ? 
                    user.lectureProgress.filter(lp => lp.courseId.toString() === course._id.toString()) : [];

                // Calculate overall progress based on curriculum
                let totalLectures = 0;
                let completedLectures = 0;
                let progressPercentage = 0;

                if (course.curriculum && course.curriculum.sections && Array.isArray(course.curriculum.sections)) {
                    course.curriculum.sections.forEach(section => {
                        if (section.lectures && Array.isArray(section.lectures)) {
                            totalLectures += section.lectures.length;
                            section.lectures.forEach(lecture => {
                                const progressEntry = lectureProgress.find(lp => 
                                    lp.lectureId === lecture._id?.toString() && lp.completed
                                );
                                if (progressEntry) {
                                    completedLectures++;
                                }
                            });
                        }
                    });
                    
                    progressPercentage = totalLectures > 0 ? 
                        Math.round((completedLectures / totalLectures) * 100) : 0;
                } else {
                    // If no curriculum is set up yet, default to 0% progress
                    progressPercentage = 0;
                }

                console.log(`Course ${course.title}: ${completedLectures}/${totalLectures} lectures completed, ${progressPercentage}% progress`);

                // Get last accessed time
                const lastAccessed = lectureProgress.length > 0 ? 
                    Math.max(...lectureProgress.map(lp => new Date(lp.lastAccessed))) : course.createdAt;

                return {
                    _id: course._id,
                    title: course.title,
                    description: course.description,
                    mentorName: course.mentorName,
                    mentorId: course.mentorId,
                    price: course.price,
                    duration: course.duration,
                    level: course.level,
                    skillLevel: course.level, // For compatibility with UI
                    category: course.category,
                    thumbnail: makeAbsolute(baseUrl, course.thumbnail),
                    createdAt: course.createdAt,
                    lastAccessed: new Date(lastAccessed),
                    progress: progressPercentage, // This should be a number, not array
                    completed: progressPercentage >= 100,
                    status: progressPercentage >= 100 ? 'Completed' : 'In Progress',
                    totalLectures: totalLectures,
                    completedLectures: completedLectures
                };
            })
        );

        console.log('Courses with progress calculated:', coursesWithProgress.length);
        
        res.status(200).json({
            success: true,
            courses: coursesWithProgress
        });

    } catch (error) {
        console.error("Error fetching enrolled courses:", error);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
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
console.log(learnerId, courseId);
        // Find the course
        const course = await Course.findById(courseId);
        if (!course) {
              console.log("Course not found");
            return res.status(404).json({ message: "Course not found" });
          
        }

        // Check if learner is enrolled
        const progressEntry = course.progress.find(p => p.learnerId.toString() === learnerId);
     
        // Update progress to 100% and mark as completed
        progressEntry.progress = 100;
        progressEntry.completed = true;

        await course.save();

        res.status(200).json({ message: "Course marked as completed", course });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
        console.log("Server Error", error);
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

// Update course
exports.updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            title, 
            description, 
            price = '0',
            duration = '1 hour',
            level = 'beginner',
            category,
            mentorId
        } = req.body;

        // Find the course
        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Verify mentor ownership
        if (course.mentorId.toString() !== mentorId) {
            return res.status(403).json({ message: "Unauthorized: You can only update your own courses" });
        }

        // Handle file updates
        let imagePath = course.image;
        let thumbnailPath = course.thumbnail;
        let videoPath = course.video;
        
        if (req.files) {
            if (req.files.image) {
                imagePath = '/' + path.posix.join("uploads", "mentors", mentorId, "images", req.files.image[0].filename);
            }
            if (req.files.thumbnail) {
                thumbnailPath = '/' + path.posix.join("uploads", "mentors", mentorId, "images", req.files.thumbnail[0].filename);
            }
            if (req.files.video) {
                videoPath = '/' + path.posix.join("uploads", "mentors", mentorId, "videos", req.files.video[0].filename);
            }
        }

        // Update course
        const updatedCourse = await Course.findByIdAndUpdate(
            id,
            {
                title,
                description,
                price: parseFloat(price),
                duration,
                level,
                category,
                image: imagePath,
                thumbnail: thumbnailPath,
                video: videoPath,
            },
            { new: true }
        );

        res.status(200).json({ 
            message: "Course updated successfully", 
            course: updatedCourse 
        });

    } catch (error) {
        console.error("Error updating course:", error);
        res.status(500).json({ 
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Delete course
exports.deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { mentorId } = req.body;

        // Find the course
        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Verify mentor ownership (if mentorId is provided in body)
        if (mentorId && course.mentorId.toString() !== mentorId) {
            return res.status(403).json({ message: "Unauthorized: You can only delete your own courses" });
        }

        // Remove course from enrolled learners' records
        if (course.enrolledLearners && course.enrolledLearners.length > 0) {
            await User.updateMany(
                { _id: { $in: course.enrolledLearners } },
                { $pull: { coursesEnrolled: id } }
            );
        }

        // Delete the course
        await Course.findByIdAndDelete(id);

        res.status(200).json({ 
            message: "Course deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting course:", error);
        res.status(500).json({ 
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Save course curriculum (sections and lectures)
exports.saveCurriculum = async (req, res) => {
    try {
        const { courseId, courseName, mentorId, sections } = req.body;

        // Validate input
        if (!courseId || !sections || sections.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Course ID and at least one section are required' 
            });
        }

        // Verify course exists and belongs to mentor
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ 
                success: false, 
                message: 'Course not found' 
            });
        }

        if (course.mentorId.toString() !== mentorId) {
            return res.status(403).json({ 
                success: false, 
                message: 'Unauthorized to modify this course' 
            });
        }

        // Create curriculum structure as a nested object within the course
        const curriculum = {
            sections: sections.map(section => ({
                order: section.order,
                title: section.title,
                description: section.description,
                lectures: section.lectures.map(lecture => ({
                    order: lecture.order,
                    title: lecture.title,
                    type: lecture.type,
                    duration: lecture.duration,
                    videoUrl: lecture.videoUrl,
                    fileName: lecture.fileName,
                    fileSize: lecture.fileSize,
                    content: lecture.content,
                    resources: lecture.resources,
                    quiz: lecture.quiz || null,
                    assignment: lecture.assignment || null
                }))
            }))
        };

        // Update course with curriculum
        await Course.findByIdAndUpdate(courseId, {
            curriculum: curriculum,
            updatedAt: new Date()
        });

        res.json({ 
            success: true, 
            message: 'Curriculum saved successfully',
            courseId: courseId
        });

    } catch (error) {
        console.error('Save curriculum error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to save curriculum',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Update lecture progress for a learner
exports.updateLectureProgress = async (req, res) => {
    try {
        const { learnerId, courseId, lectureId, sectionId, progress, completed, watchTime, totalDuration } = req.body;

        if (!learnerId || !courseId || !lectureId || progress === undefined) {
            return res.status(400).json({ 
                success: false, 
                message: 'Learner ID, Course ID, Lecture ID, and progress are required' 
            });
        }

        // Find the user and update their lecture progress
        const user = await User.findById(learnerId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Initialize lectureProgress if it doesn't exist
        if (!user.lectureProgress) {
            user.lectureProgress = [];
        }

        // Find existing progress entry or create new one
        let progressEntry = user.lectureProgress.find(p => 
            p.courseId.toString() === courseId && p.lectureId === lectureId
        );

        if (progressEntry) {
            progressEntry.progress = Math.max(progressEntry.progress || 0, progress);
            progressEntry.videoProgress = Math.max(progressEntry.videoProgress || 0, progress);
            progressEntry.completed = completed || progress >= 90;
            progressEntry.lastAccessed = new Date();
            if (watchTime !== undefined) progressEntry.watchTime = watchTime;
            if (totalDuration !== undefined) progressEntry.totalDuration = totalDuration;
        } else {
            user.lectureProgress.push({
                courseId: courseId,
                lectureId: lectureId,
                sectionId: sectionId,
                progress: progress,
                videoProgress: progress,
                completed: completed || progress >= 90,
                lastAccessed: new Date(),
                watchTime: watchTime || 0,
                totalDuration: totalDuration || 0
            });
        }

        await user.save();

        // Calculate overall course progress
        const course = await Course.findById(courseId);
        let courseProgress = 0;
        let totalLectures = 0;
        let completedLectures = 0;

        if (course && course.curriculum && course.curriculum.sections) {
            course.curriculum.sections.forEach(section => {
                if (section.lectures && Array.isArray(section.lectures)) {
                    totalLectures += section.lectures.length;
                    section.lectures.forEach(lecture => {
                        const lectureProgress = user.lectureProgress.find(lp => 
                            lp.courseId.toString() === courseId && lp.lectureId === lecture._id?.toString()
                        );
                        if (lectureProgress && lectureProgress.completed) {
                            completedLectures++;
                        }
                    });
                }
            });

            courseProgress = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;
        }

        res.json({ 
            success: true, 
            message: 'Lecture progress updated successfully',
            lectureProgress: {
                lectureId,
                progress: progress,
                completed: completed || progress >= 90,
                watchTime: watchTime || 0
            },
            courseProgress: {
                overallProgress: courseProgress,
                completedLectures,
                totalLectures
            }
        });

    } catch (error) {
        console.error('Update lecture progress error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update lecture progress',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get course progress for a learner
exports.getCourseProgress = async (req, res) => {
    try {
        const { learnerId, courseId } = req.params;

        if (!learnerId || !courseId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Learner ID and Course ID are required' 
            });
        }

        // Find the user
        const user = await User.findById(learnerId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Find the course
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ 
                success: false, 
                message: 'Course not found' 
            });
        }

        // Get lecture progress for this course
        const lectureProgress = user.lectureProgress ? 
            user.lectureProgress.filter(p => p.courseId.toString() === courseId) : [];

        // Calculate overall progress
        let totalLectures = 0;
        let completedLectures = 0;

        if (course.curriculum && course.curriculum.sections) {
            course.curriculum.sections.forEach(section => {
                if (section.lectures) {
                    totalLectures += section.lectures.length;
                    section.lectures.forEach(lecture => {
                        const progress = lectureProgress.find(p => p.lectureId === lecture._id?.toString());
                        if (progress && progress.completed) {
                            completedLectures++;
                        }
                    });
                }
            });
        }

        const overallProgress = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;

        res.json({ 
            success: true,
            courseProgress: {
                courseId: courseId,
                overallProgress: overallProgress,
                completedLectures: completedLectures,
                totalLectures: totalLectures,
                lectureProgress: lectureProgress
            }
        });

    } catch (error) {
        console.error('Get course progress error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get course progress',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
