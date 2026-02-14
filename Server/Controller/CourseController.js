const Course = require('../Model/CourseModel');
const CertificationModel = require('../Model/CertificationModel');
const path = require('path');
const User = require("../Model/UserModel");
const mongoose = require('mongoose');

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
        console.log('\n🚀 === COURSE UPLOAD STARTED ===');
        console.log('📝 Request Body:', JSON.stringify(req.body, null, 2));
        console.log('📎 Files:', req.files ? Object.keys(req.files) : 'No files uploaded');
        
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
        
        console.log('📊 Extracted Data:', {
            title,
            description: description?.substring(0, 100) + '...',
            mentorId,
            mentorName,
            mentorEmail,
            price,
            duration,
            level,
            category
        });

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
        const courseData = {
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
        };
        
        console.log('💾 Storing Course Data to Database:', JSON.stringify(courseData, null, 2));
        
        const newCourse = await Course.create(courseData);
        
        console.log('✅ Course Created Successfully!');
        console.log('🆔 Course ID:', newCourse._id);
        console.log('📅 Created At:', newCourse.createdAt);
        console.log('🔗 File Paths:', {
            image: newCourse.image,
            thumbnail: newCourse.thumbnail,
            video: newCourse.video
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
            console.log('❌ Course not found for ID:', req.params.id);
            return res.status(404).json({ message: "Course not found" });
        }
        
        console.log('📚 Course Retrieved Successfully:');
        console.log('🆔 Course ID:', course._id);
        console.log('📖 Title:', course.title);
        console.log('👨‍🏫 Mentor:', course.mentorName);
        
        if (course.curriculum && course.curriculum.sections) {
            console.log('📊 Curriculum Stats:');
            console.log('  📑 Sections:', course.curriculum.sections.length);
            const totalLectures = course.curriculum.sections.reduce((total, section) => 
                total + (section.lectures?.length || 0), 0);
            console.log('  📝 Total Lectures:', totalLectures);
            
            // Count content types
            let quizCount = 0, assignmentCount = 0, articleCount = 0, videoCount = 0;
            course.curriculum.sections.forEach(section => {
                if (section.lectures) {
                    section.lectures.forEach(lecture => {
                        switch(lecture.type) {
                            case 'quiz': quizCount++; break;
                            case 'assignment': assignmentCount++; break;
                            case 'article': articleCount++; break;
                            case 'video': videoCount++; break;
                        }
                    });
                }
            });
            
            console.log('  🧩 Quizzes:', quizCount);
            console.log('  📋 Assignments:', assignmentCount);
            console.log('  📄 Articles:', articleCount);
            console.log('  🎥 Videos:', videoCount);
        } else {
            console.log('📝 No curriculum found for this course');
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

// Get enrolled courses for a learner
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
        
        // Format courses data and include learner progress summary
        const baseUrl = req.protocol + '://' + req.get('host');
        const coursesWithData = enrolledCourses.map((course) => {
            // Calculate overall progress for this learner/course using user's lectureProgress
            let totalLectures = 0;
            let completedLectures = 0;

            try {
                if (course.curriculum && course.curriculum.sections) {
                    course.curriculum.sections.forEach(section => {
                        if (section.lectures) {
                            totalLectures += section.lectures.length;
                            section.lectures.forEach(lecture => {
                                const prog = user.lectureProgress?.find(p => p.courseId?.toString() === course._id.toString() && p.lectureId === (lecture._id?.toString() || lecture._id));
                                if (prog && prog.completed) completedLectures++;
                            });
                        }
                    });
                }
            } catch (e) {
                console.error('Error computing lecture counts for course', course._id, e);
            }

            const overallProgress = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;

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
                lastAccessed: course.createdAt, // Default to creation date
                status: 'Enrolled',
                overallProgress,
                progress: overallProgress,
                totalLectures,
                completedLectures
            };
        });

        console.log('Courses data prepared:', coursesWithData.length);
        
        res.status(200).json({
            success: true,
            courses: coursesWithData
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

exports.completeCourse = async (req, res) => {
    try {
        const { courseId, userId } = req.params;
        console.log('Completing course:', { courseId, userId });

        // Find the learner
        const learner = await User.findById(userId);
        if (!learner) {
            console.log("Learner not found");
            return res.status(404).json({ 
                success: false,
                message: "Learner not found" 
            });
        }

        // Find the course
        const course = await Course.findById(courseId);
        if (!course) {
            console.log("Course not found");
            return res.status(404).json({ 
                success: false,
                message: "Course not found" 
            });
        }

        // Check if learner is enrolled
        if (!learner.coursesEnrolled.includes(courseId)) {
            return res.status(400).json({ 
                success: false,
                message: "Learner is not enrolled in this course" 
            });
        }

        // Initialize progress array if it doesn't exist
        if (!learner.progress) {
            learner.progress = [];
        }

        // Find or create course progress
        let courseProgress = learner.progress.find(p => p.courseId.toString() === courseId.toString());
        
        if (!courseProgress) {
            courseProgress = {
                courseId,
                progress: 100,
                completed: true,
                completedAt: new Date(),
                lectureProgress: []
            };
            learner.progress.push(courseProgress);
        } else {
            // Update existing progress to completion
            courseProgress.progress = 100;
            courseProgress.completed = true;
            courseProgress.completedAt = new Date();
        }

        await learner.save();

        // Also update the course's completion tracking if it exists
        if (course.progress) {
            const courseProgressEntry = course.progress.find(p => p.learnerId.toString() === userId);
            if (courseProgressEntry) {
                courseProgressEntry.progress = 100;
                courseProgressEntry.completed = true;
                courseProgressEntry.completedAt = new Date();
                await course.save();
            }
        }

        console.log('Course marked as completed successfully');
        res.status(200).json({ 
            success: true,
            message: "Course marked as completed", 
            progress: courseProgress
        });
    } catch (error) {
        console.log("Server Error", error);
        res.status(500).json({ 
            success: false,
            message: "Server Error", 
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
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

// Validate quiz data
const validateQuizData = (quiz, lectureTitle = '') => {
    console.log('  🔍 Validating Quiz Data...');
    if (!quiz) {
        console.log('  ⚠️ No quiz data provided');
        return null;
    }
    
    const errors = [];
    
    // Use quiz title or fallback to lecture title
    const quizTitle = quiz.title || lectureTitle || '';
    if (!quizTitle || quizTitle.trim() === '') {
        errors.push('Quiz title is required');
    }
    
    if (!quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
        errors.push('Quiz must have at least one question');
    } else {
        quiz.questions.forEach((question, index) => {
            if (!question.question || question.question.trim() === '') {
                errors.push(`Question ${index + 1}: Question text is required`);
            }
            
            // Default to single_correct if not specified
            const questionType = question.type || 'single_correct';
            if (!['single_correct', 'multiple_correct', 'short_answer'].includes(questionType)) {
                errors.push(`Question ${index + 1}: Valid question type is required`);
            }
            
            if (questionType === 'single_correct') {
                if (!question.choices || !Array.isArray(question.choices) || question.choices.filter(c => c && c.trim()).length < 2) {
                    errors.push(`Question ${index + 1}: Single correct questions must have at least 2 choices`);
                }
                // correctIndex can be 0, so check for undefined/null explicitly
                if (question.correctIndex === undefined || question.correctIndex === null || 
                    question.correctIndex < 0 || question.correctIndex >= (question.choices?.length || 0)) {
                    errors.push(`Question ${index + 1}: Valid correct index is required`);
                }
            }
            
            if (questionType === 'multiple_correct') {
                if (!question.choices || !Array.isArray(question.choices) || question.choices.filter(c => c && c.trim()).length < 2) {
                    errors.push(`Question ${index + 1}: Multiple correct questions must have at least 2 choices`);
                }
                if (!question.correctIndices || !Array.isArray(question.correctIndices) || 
                    question.correctIndices.length === 0) {
                    errors.push(`Question ${index + 1}: At least one correct answer must be specified`);
                }
            }
            
            // Sample answer is optional for short answer questions - will be graded manually
            // if (questionType === 'short_answer' && (!question.sampleAnswer || question.sampleAnswer.trim() === '')) {
            //     errors.push(`Question ${index + 1}: Sample answer is required for short answer questions`);
            // }
        });
    }
    
    return errors.length > 0 ? { errors } : {
        title: quizTitle.trim(),
        description: quiz.description || '',
        timeLimitMinutes: quiz.timeLimitMinutes || 30,
        passingScore: quiz.passingScore || 70,
        attemptsAllowed: quiz.attemptsAllowed === 'unlimited' ? -1 : (parseInt(quiz.attemptsAllowed) || 3),
        tokenReward: quiz.tokenReward || 5,
        questions: quiz.questions.map(q => ({
            question: q.question,
            type: q.type || 'single_correct',
            choices: q.choices || [],
            correctIndex: q.correctIndex,
            correctIndices: q.correctIndices || [],
            marks: q.marks || 1,
            sampleAnswer: q.sampleAnswer || ''
        }))
    };
};

// Validate assignment data
const validateAssignmentData = (assignment) => {
    console.log('  🔍 Validating Assignment Data...');
    if (!assignment) {
        console.log('  ⚠️ No assignment data provided');
        return null;
    }
    
    const errors = [];
    
    // Accept description from various possible fields
    const description = assignment.description || assignment.assignmentDescription || assignment.instructions || '';
    const instructions = assignment.instructions || assignment.assignmentDescription || assignment.description || '';
    
    if (!description || description.trim() === '') {
        errors.push('Assignment description is required');
    }
    
    // Instructions are optional if description is provided (they can be the same)
    
    // Normalize submissionType values from different clients
    let submissionTypeRaw = (assignment.submissionType || assignment.type || 'file');
    if (typeof submissionTypeRaw === 'string') submissionTypeRaw = submissionTypeRaw.toLowerCase();

    const submissionTypeMap = {
        'file_upload': 'file',
        'file': 'file',
        'text_answer': 'text',
        'text': 'text',
        'external_link': 'link',
        'link': 'link',
        'both': 'both'
    };

    const submissionType = submissionTypeMap[submissionTypeRaw] || 'file';

    return errors.length > 0 ? { errors } : {
        submissionType,
        maxFileSize: assignment.maxFileSize || '10MB',
        maxScore: assignment.maxScore || 100,
        description: description.trim(),
        instructions: instructions.trim() || description.trim()
    };
};

// Validate article data
const validateArticleData = (lecture) => {
    console.log('  🔍 Validating Article Data...');
    if (lecture.type !== 'article') {
        console.log('  ⚠️ Not an article type lecture');
        return null;
    }
    
    const errors = [];
    // Accept content from several possible fields used by different frontends
    const rawContent = (lecture.content || lecture.articleContent || lecture.article || lecture.contentHtml || lecture.html || lecture.body || lecture.text || '');
    let contentStr = '';
    if (typeof rawContent === 'string') {
        contentStr = rawContent;
    } else if (rawContent && typeof rawContent === 'object') {
        try { contentStr = JSON.stringify(rawContent); } catch (e) { contentStr = String(rawContent); }
    } else {
        contentStr = String(rawContent || '');
    }

    // Remove HTML tags and whitespace to determine if there's meaningful text
    const textOnly = contentStr.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

    if (!textOnly || textOnly.length === 0) {
        errors.push('Article content is required');
    }

    return errors.length > 0 ? { errors } : {
        content: contentStr,
        readingTime: lecture.readingTime || '5 min',
        textPreview: textOnly.substring(0, 200)
    };
};

// Save course curriculum (sections and lectures)
exports.saveCurriculum = async (req, res) => {
    try {
        console.log('\n📚 === CURRICULUM SAVE STARTED ===');
        const { courseId, courseName, mentorId, sections } = req.body;
        
        console.log('📋 Curriculum Data Received:');
        console.log('🆔 Course ID:', courseId);
        console.log('📖 Course Name:', courseName);
        console.log('👨‍🏫 Mentor ID:', mentorId);
        console.log('📑 Number of Sections:', sections?.length || 0);
        
        // Log section overview
        if (sections && sections.length > 0) {
            console.log('\n📊 Sections Overview:');
            sections.forEach((section, index) => {
                const lectureCount = section.lectures?.length || 0;
                const quizCount = section.lectures?.filter(l => l.type === 'quiz').length || 0;
                const assignmentCount = section.lectures?.filter(l => l.type === 'assignment').length || 0;
                const articleCount = section.lectures?.filter(l => l.type === 'article').length || 0;
                const videoCount = section.lectures?.filter(l => l.type === 'video').length || 0;
                
                console.log(`  📝 Section ${index + 1}: "${section.title}"`);
                console.log(`    📊 Total Lectures: ${lectureCount}`);
                console.log(`    🧩 Quizzes: ${quizCount}, 📋 Assignments: ${assignmentCount}, 📄 Articles: ${articleCount}, 🎥 Videos: ${videoCount}`);
            });
        }

        // Validate input
        if (!courseId || !sections || sections.length === 0) {
            console.log('❌ Validation Failed: Missing required fields');
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

        // Validate and process sections
        console.log('\n🔍 Starting Validation and Processing...');
        const validationErrors = [];
        const processedSections = [];

        sections.forEach((section, sectionIndex) => {
            if (!section.title || section.title.trim() === '') {
                validationErrors.push(`Section ${sectionIndex + 1}: Title is required`);
                return;
            }

            const processedLectures = [];

            section.lectures.forEach((lecture, lectureIndex) => {
                if (!lecture.title || lecture.title.trim() === '') {
                    validationErrors.push(`Section ${sectionIndex + 1}, Lecture ${lectureIndex + 1}: Title is required`);
                    return;
                }

                if (!lecture.type || !['video', 'quiz', 'assignment', 'article'].includes(lecture.type)) {
                    validationErrors.push(`Section ${sectionIndex + 1}, Lecture ${lectureIndex + 1}: Valid type is required`);
                    return;
                }

                const processedLecture = {
                    _id: new mongoose.Types.ObjectId(),
                    order: lecture.order || lectureIndex + 1,
                    title: lecture.title,
                    type: lecture.type,
                    description: lecture.description || '',
                    isPreview: lecture.isPreview || false,
                    isPublished: lecture.isPublished !== false,
                    
                    // Initialize all content type objects as null
                    video: null,
                    quiz: null,
                    assignment: null,
                    article: null,
                    
                    // Legacy fields for backward compatibility
                    duration: lecture.duration,
                    videoUrl: lecture.videoUrl,
                    fileName: lecture.fileName,
                    fileSize: lecture.fileSize,
                    content: lecture.content,
                    readingTime: lecture.readingTime || '5 min',
                    resources: (lecture.resources || []).map(r => 
                        typeof r === 'string' ? { name: r, url: r, type: 'file' } : r
                    ),
                    
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                // Handle VIDEO type
                if (lecture.type === 'video') {
                    console.log(`🎥 Processing Video for Section ${sectionIndex + 1}, Lecture ${lectureIndex + 1}: "${lecture.title}"`);
                    const videoUrl = lecture.videoUrl || lecture.video?.videoUrl || '';
                    console.log('  📹 Video URL:', videoUrl || 'Not provided');
                    console.log('  ⏱️ Duration:', lecture.duration || lecture.video?.duration || 'Not specified');
                    
                    processedLecture.video = {
                        videoUrl: videoUrl,
                        duration: lecture.duration || lecture.video?.duration || '',
                        durationSeconds: lecture.durationSeconds || lecture.video?.durationSeconds || 0,
                        fileName: lecture.fileName || lecture.video?.fileName || '',
                        fileSize: lecture.fileSize || lecture.video?.fileSize || 0,
                        thumbnail: lecture.thumbnail || lecture.video?.thumbnail || '',
                        transcript: lecture.transcript || lecture.video?.transcript || ''
                    };
                    
                    // Also set legacy fields
                    processedLecture.videoUrl = videoUrl;
                    processedLecture.duration = lecture.duration || lecture.video?.duration;
                    console.log('  ✅ Video Processed Successfully');
                }

                // Handle QUIZ type
                if (lecture.type === 'quiz') {
                    console.log(`🧩 Processing Quiz for Section ${sectionIndex + 1}, Lecture ${lectureIndex + 1}: "${lecture.title}"`);
                    
                    // Get quiz data from various possible sources
                    const quizData = lecture.quiz || lecture.quizData || {};
                    console.log('  📝 Quiz Title:', quizData.title || lecture.title);
                    console.log('  ❓ Number of Questions:', quizData.questions?.length || 0);
                    console.log('  ⏱️ Time Limit:', quizData.timeLimitMinutes || 30, 'minutes');
                    console.log('  🎯 Passing Score:', quizData.passingScore || 70, '%');
                    
                    // Log each question for debugging
                    if (quizData.questions && quizData.questions.length > 0) {
                        quizData.questions.forEach((q, qIdx) => {
                            console.log(`    Q${qIdx + 1}: "${q.question?.substring(0, 50)}..." | Type: ${q.type} | Choices: ${q.choices?.length || 0}`);
                        });
                    }
                    
                    const quizValidation = validateQuizData(quizData, lecture.title);
                    if (quizValidation && quizValidation.errors) {
                        console.log('  ❌ Quiz Validation Failed:', quizValidation.errors);
                        validationErrors.push(`Section ${sectionIndex + 1}, Lecture ${lectureIndex + 1}: ${quizValidation.errors.join(', ')}`);
                    } else if (quizValidation) {
                        console.log('  ✅ Quiz Validation Passed');
                        // Store in new structured format
                        processedLecture.quiz = {
                            title: quizValidation.title || lecture.title,
                            description: quizValidation.description || '',
                            timeLimitMinutes: quizValidation.timeLimitMinutes || 30,
                            passingScore: quizValidation.passingScore || 70,
                            attemptsAllowed: quizValidation.attemptsAllowed || 3,
                            tokenReward: quizValidation.tokenReward || 5,
                            shuffleQuestions: quizData.shuffleQuestions || false,
                            showCorrectAnswers: quizData.showCorrectAnswers !== false,
                            questions: quizValidation.questions.map((q, idx) => ({
                                _id: new mongoose.Types.ObjectId(),
                                question: q.question,
                                type: q.type || 'single_correct',
                                choices: q.choices || [],
                                correctIndex: q.correctIndex,
                                correctIndices: q.correctIndices || [],
                                marks: q.marks || 1,
                                sampleAnswer: q.sampleAnswer || '',
                                explanation: q.explanation || ''
                            }))
                        };
                        console.log('  💾 Quiz Stored:', processedLecture.quiz.questions.length, 'questions');
                    } else {
                        console.log('  ⚠️ No quiz data provided, creating empty quiz');
                        processedLecture.quiz = {
                            title: lecture.title,
                            description: '',
                            timeLimitMinutes: 30,
                            passingScore: 70,
                            attemptsAllowed: 3,
                            tokenReward: 5,
                            shuffleQuestions: false,
                            showCorrectAnswers: true,
                            questions: []
                        };
                    }
                }

                // Handle ASSIGNMENT type
                if (lecture.type === 'assignment') {
                    console.log(`📋 Processing Assignment for Section ${sectionIndex + 1}, Lecture ${lectureIndex + 1}: "${lecture.title}"`);
                    
                    // Get assignment data from various possible sources
                    const assignmentData = lecture.assignment || lecture.assignmentData || {};
                    console.log('  📝 Description:', (assignmentData.description || '').substring(0, 50) + '...');
                    console.log('  📏 Max Score:', assignmentData.maxScore || 100);
                    console.log('  📁 Submission Type:', assignmentData.submissionType || 'file');
                    console.log('  💾 Max File Size:', assignmentData.maxFileSize || '10MB');
                    
                    const assignmentValidation = validateAssignmentData(assignmentData);
                    if (assignmentValidation && assignmentValidation.errors) {
                        console.log('  ❌ Assignment Validation Failed:', assignmentValidation.errors);
                        validationErrors.push(`Section ${sectionIndex + 1}, Lecture ${lectureIndex + 1}: ${assignmentValidation.errors.join(', ')}`);
                    } else if (assignmentValidation) {
                        console.log('  ✅ Assignment Validation Passed');
                        // Store in new structured format
                        processedLecture.assignment = {
                            title: assignmentData.title || lecture.title,
                            description: assignmentValidation.description,
                            instructions: assignmentValidation.instructions,
                            submissionType: assignmentValidation.submissionType || 'file',
                            maxFileSize: assignmentValidation.maxFileSize || '10MB',
                            maxScore: assignmentValidation.maxScore || 100,
                            dueDate: assignmentData.dueDate || null,
                            allowedFileTypes: assignmentData.allowedFileTypes || ['pdf', 'doc', 'docx', 'txt', 'zip'],
                            rubric: assignmentData.rubric || ''
                        };
                        console.log('  💾 Assignment Stored Successfully');
                    } else {
                        console.log('  ⚠️ No assignment data provided, creating empty assignment');
                        processedLecture.assignment = {
                            title: lecture.title,
                            description: '',
                            instructions: '',
                            submissionType: 'file',
                            maxFileSize: '10MB',
                            maxScore: 100,
                            allowedFileTypes: ['pdf', 'doc', 'docx', 'txt', 'zip'],
                            rubric: ''
                        };
                    }
                }

                // Handle ARTICLE type
                if (lecture.type === 'article') {
                    console.log(`📄 Processing Article for Section ${sectionIndex + 1}, Lecture ${lectureIndex + 1}: "${lecture.title}"`);
                    
                    // Get article content from various possible sources
                    const rawContent = lecture.content || lecture.articleContent || lecture.article?.content || 
                                      lecture.body || lecture.text || lecture.html || '';
                    
                    console.log('  📝 Content Length:', rawContent?.length || 0, 'characters');
                    console.log('  ⏱️ Reading Time:', lecture.readingTime || '5 min');
                    console.log('  📄 Content Preview:', (rawContent || '').substring(0, 100) + '...');
                    
                    const articleValidation = validateArticleData(lecture);
                    if (articleValidation && articleValidation.errors) {
                        console.log('  ❌ Article Validation Failed:', articleValidation.errors);
                        validationErrors.push(`Section ${sectionIndex + 1}, Lecture ${lectureIndex + 1}: ${articleValidation.errors.join(', ')}`);
                    } else if (articleValidation) {
                        console.log('  ✅ Article Validation Passed');
                        
                        // Calculate word count
                        const textOnly = articleValidation.content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
                        const wordCount = textOnly.split(/\s+/).filter(w => w.length > 0).length;
                        
                        // Store in new structured format
                        processedLecture.article = {
                            content: articleValidation.content,
                            contentType: lecture.contentType || 'html',
                            readingTime: articleValidation.readingTime || lecture.readingTime || '5 min',
                            wordCount: wordCount,
                            summary: lecture.summary || textOnly.substring(0, 200) + '...'
                        };
                        
                        // Also set legacy fields for backward compatibility
                        processedLecture.content = articleValidation.content;
                        processedLecture.readingTime = articleValidation.readingTime || lecture.readingTime || '5 min';
                        
                        console.log('  💾 Article Stored:', wordCount, 'words');
                    } else {
                        console.log('  ⚠️ No article content provided, creating empty article');
                        processedLecture.article = {
                            content: '',
                            contentType: 'html',
                            readingTime: '5 min',
                            wordCount: 0,
                            summary: ''
                        };
                    }
                }

                processedLectures.push(processedLecture);
            });

            processedSections.push({
                _id: new mongoose.Types.ObjectId(),
                order: section.order || sectionIndex + 1,
                title: section.title,
                description: section.description || '',
                isPublished: section.isPublished !== false,
                lectures: processedLectures,
                lectureCount: processedLectures.length,
                totalDuration: section.totalDuration || ''
            });
        });

        // If there are validation errors, return them
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors found',
                errors: validationErrors
            });
        }

        // Create curriculum structure as a nested object within the course
        const curriculum = {
            sections: processedSections
        };
        
        console.log('\n💾 Preparing to Save Curriculum to Database...');
        console.log('📊 Final Statistics:');
        console.log('  📑 Total Sections:', processedSections.length);
        console.log('  📝 Total Lectures:', processedSections.reduce((total, section) => total + section.lectures.length, 0));
        
        // Calculate detailed stats
        let totalQuizzes = 0, totalAssignments = 0, totalArticles = 0, totalVideos = 0, totalQuestions = 0;
        processedSections.forEach(section => {
            section.lectures.forEach(lecture => {
                switch (lecture.type) {
                    case 'quiz': 
                        totalQuizzes++; 
                        if (lecture.quiz && lecture.quiz.questions) {
                            totalQuestions += lecture.quiz.questions.length;
                        }
                        break;
                    case 'assignment': totalAssignments++; break;
                    case 'article': totalArticles++; break;
                    case 'video': totalVideos++; break;
                }
            });
        });
        
        console.log('  🧩 Total Quizzes:', totalQuizzes, `(${totalQuestions} questions)`);
        console.log('  📋 Total Assignments:', totalAssignments);
        console.log('  📄 Total Articles:', totalArticles);
        console.log('  🎥 Total Videos:', totalVideos);
        
        console.log('\n🔄 Updating Course in Database...');

        // Use save() to trigger pre-save middleware for stats calculation
        course.curriculum = {
            sections: processedSections,
            lastUpdated: new Date()
        };
        course.updatedAt = new Date();
        
        await course.save();
        
        console.log('✅ Curriculum Successfully Saved to Database!');
        console.log('🆔 Course ID:', courseId);
        console.log('⏰ Updated At:', new Date().toISOString());
        console.log('📊 Course Stats:', course.stats);

        const responseData = { 
            success: true, 
            message: 'Curriculum saved successfully',
            courseId: courseId,
            sectionsCount: processedSections.length,
            lecturesCount: processedSections.reduce((total, section) => total + section.lectures.length, 0),
            stats: {
                totalSections: processedSections.length,
                totalLectures: processedSections.reduce((total, section) => total + section.lectures.length, 0),
                totalQuizzes,
                totalAssignments,
                totalArticles,
                totalVideos,
                totalQuestions
            }
        };
        
        console.log('\n🎉 === CURRICULUM SAVE COMPLETED SUCCESSFULLY ===');
        console.log('📤 Response Data:', JSON.stringify(responseData, null, 2));
        console.log('================================================\n');
        
        res.json(responseData);

    } catch (error) {
        console.log('\n❌ === CURRICULUM SAVE FAILED ===');
        console.error('💥 Error Details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        console.log('=====================================\n');
        
        res.status(500).json({ 
            success: false, 
            message: 'Failed to save curriculum',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Add a specific quiz to a lecture
exports.addQuizToLecture = async (req, res) => {
    try {
        console.log('\n🧩 === ADD QUIZ TO LECTURE ===');
        const { courseId, sectionIndex, lectureIndex, quiz } = req.body;
        
        console.log('📍 Input Data:', {
            courseId,
            sectionIndex,
            lectureIndex,
            quizTitle: quiz?.title,
            questionsCount: quiz?.questions?.length || 0
        });

        if (!courseId || sectionIndex === undefined || lectureIndex === undefined || !quiz) {
            return res.status(400).json({
                success: false,
                message: 'Course ID, section index, lecture index, and quiz data are required'
            });
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Validate quiz data
        const quizValidation = validateQuizData(quiz);
        if (quizValidation.errors) {
            return res.status(400).json({
                success: false,
                message: 'Quiz validation failed',
                errors: quizValidation.errors
            });
        }

        // Check if curriculum and section exist
        if (!course.curriculum || !course.curriculum.sections || !course.curriculum.sections[sectionIndex]) {
            return res.status(400).json({
                success: false,
                message: 'Section not found'
            });
        }

        // Check if lecture exists
        if (!course.curriculum.sections[sectionIndex].lectures || 
            !course.curriculum.sections[sectionIndex].lectures[lectureIndex]) {
            return res.status(400).json({
                success: false,
                message: 'Lecture not found'
            });
        }

        // Update the lecture with quiz data
        course.curriculum.sections[sectionIndex].lectures[lectureIndex].type = 'quiz';
        course.curriculum.sections[sectionIndex].lectures[lectureIndex].quiz = quizValidation;
        course.updatedAt = new Date();

        await course.save();
        
        console.log('✅ Quiz Successfully Added to Lecture!');
        console.log('📊 Quiz Data Stored:', {
            title: quizValidation.title,
            questionsCount: quizValidation.questions?.length || 0,
            timeLimitMinutes: quizValidation.timeLimitMinutes,
            passingScore: quizValidation.passingScore
        });
        console.log('================================\n');

        res.json({
            success: true,
            message: 'Quiz added to lecture successfully',
            quiz: quizValidation
        });

    } catch (error) {
        console.error('Add quiz to lecture error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add quiz to lecture',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Add a specific assignment to a lecture
exports.addAssignmentToLecture = async (req, res) => {
    try {
        console.log('\n📋 === ADD ASSIGNMENT TO LECTURE ===');
        const { courseId, sectionIndex, lectureIndex, assignment } = req.body;
        
        console.log('📍 Input Data:', {
            courseId,
            sectionIndex,
            lectureIndex,
            assignmentDescription: assignment?.description?.substring(0, 50) + '...',
            maxScore: assignment?.maxScore,
            submissionType: assignment?.submissionType
        });

        if (!courseId || sectionIndex === undefined || lectureIndex === undefined || !assignment) {
            return res.status(400).json({
                success: false,
                message: 'Course ID, section index, lecture index, and assignment data are required'
            });
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Validate assignment data
        const assignmentValidation = validateAssignmentData(assignment);
        if (assignmentValidation.errors) {
            return res.status(400).json({
                success: false,
                message: 'Assignment validation failed',
                errors: assignmentValidation.errors
            });
        }

        // Check if curriculum and section exist
        if (!course.curriculum || !course.curriculum.sections || !course.curriculum.sections[sectionIndex]) {
            return res.status(400).json({
                success: false,
                message: 'Section not found'
            });
        }

        // Check if lecture exists
        if (!course.curriculum.sections[sectionIndex].lectures || 
            !course.curriculum.sections[sectionIndex].lectures[lectureIndex]) {
            return res.status(400).json({
                success: false,
                message: 'Lecture not found'
            });
        }

        // Update the lecture with assignment data
        course.curriculum.sections[sectionIndex].lectures[lectureIndex].type = 'assignment';
        course.curriculum.sections[sectionIndex].lectures[lectureIndex].assignment = assignmentValidation;
        course.updatedAt = new Date();

        await course.save();
        
        console.log('✅ Assignment Successfully Added to Lecture!');
        console.log('📊 Assignment Data Stored:', {
            description: assignmentValidation.description?.substring(0, 50) + '...',
            instructions: assignmentValidation.instructions?.substring(0, 50) + '...',
            submissionType: assignmentValidation.submissionType,
            maxScore: assignmentValidation.maxScore,
            maxFileSize: assignmentValidation.maxFileSize
        });
        console.log('=====================================\n');

        res.json({
            success: true,
            message: 'Assignment added to lecture successfully',
            assignment: assignmentValidation
        });

    } catch (error) {
        console.error('Add assignment to lecture error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add assignment to lecture',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Update article content for a lecture
exports.updateArticleContent = async (req, res) => {
    try {
        console.log('\n📄 === UPDATE ARTICLE CONTENT ===');
        const { courseId, sectionIndex, lectureIndex, content, readingTime } = req.body;
        
        console.log('📍 Input Data:', {
            courseId,
            sectionIndex,
            lectureIndex,
            contentLength: content?.length || 0,
            readingTime: readingTime || '5 min',
            contentPreview: content?.substring(0, 100) + '...'
        });

        if (!courseId || sectionIndex === undefined || lectureIndex === undefined || !content) {
            return res.status(400).json({
                success: false,
                message: 'Course ID, section index, lecture index, and content are required'
            });
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check if curriculum and section exist
        if (!course.curriculum || !course.curriculum.sections || !course.curriculum.sections[sectionIndex]) {
            return res.status(400).json({
                success: false,
                message: 'Section not found'
            });
        }

        // Check if lecture exists
        if (!course.curriculum.sections[sectionIndex].lectures || 
            !course.curriculum.sections[sectionIndex].lectures[lectureIndex]) {
            return res.status(400).json({
                success: false,
                message: 'Lecture not found'
            });
        }

        // Update the lecture with article content
        course.curriculum.sections[sectionIndex].lectures[lectureIndex].type = 'article';
        course.curriculum.sections[sectionIndex].lectures[lectureIndex].content = content;
        course.curriculum.sections[sectionIndex].lectures[lectureIndex].readingTime = readingTime || '5 min';
        course.updatedAt = new Date();

        await course.save();
        
        console.log('✅ Article Content Successfully Updated!');
        console.log('📊 Article Data Stored:', {
            contentLength: content.length,
            readingTime: readingTime || '5 min',
            wordsCount: content.split(' ').length,
            charactersCount: content.length
        });
        console.log('====================================\n');

        res.json({
            success: true,
            message: 'Article content updated successfully',
            content: content,
            readingTime: readingTime || '5 min'
        });

    } catch (error) {
        console.error('Update article content error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update article content',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get quiz data for a specific lecture
exports.getQuizData = async (req, res) => {
    try {
        const { courseId, sectionIndex, lectureIndex } = req.params;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check if curriculum and section exist
        if (!course.curriculum || !course.curriculum.sections || !course.curriculum.sections[sectionIndex]) {
            return res.status(400).json({
                success: false,
                message: 'Section not found'
            });
        }

        // Check if lecture exists
        if (!course.curriculum.sections[sectionIndex].lectures || 
            !course.curriculum.sections[sectionIndex].lectures[lectureIndex]) {
            return res.status(400).json({
                success: false,
                message: 'Lecture not found'
            });
        }

        const lecture = course.curriculum.sections[sectionIndex].lectures[lectureIndex];
        
        if (lecture.type !== 'quiz' || !lecture.quiz) {
            return res.status(400).json({
                success: false,
                message: 'This lecture is not a quiz or has no quiz data'
            });
        }

        res.json({
            success: true,
            quiz: lecture.quiz
        });

    } catch (error) {
        console.error('Get quiz data error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get quiz data',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get assignment data for a specific lecture
exports.getAssignmentData = async (req, res) => {
    try {
        const { courseId, sectionIndex, lectureIndex } = req.params;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check if curriculum and section exist
        if (!course.curriculum || !course.curriculum.sections || !course.curriculum.sections[sectionIndex]) {
            return res.status(400).json({
                success: false,
                message: 'Section not found'
            });
        }

        // Check if lecture exists
        if (!course.curriculum.sections[sectionIndex].lectures || 
            !course.curriculum.sections[sectionIndex].lectures[lectureIndex]) {
            return res.status(400).json({
                success: false,
                message: 'Lecture not found'
            });
        }

        const lecture = course.curriculum.sections[sectionIndex].lectures[lectureIndex];
        
        if (lecture.type !== 'assignment' || !lecture.assignment) {
            return res.status(400).json({
                success: false,
                message: 'This lecture is not an assignment or has no assignment data'
            });
        }

        res.json({
            success: true,
            assignment: lecture.assignment
        });

    } catch (error) {
        console.error('Get assignment data error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get assignment data',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get article content for a specific lecture
exports.getArticleData = async (req, res) => {
    try {
        const { courseId, sectionIndex, lectureIndex } = req.params;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check if curriculum and section exist
        if (!course.curriculum || !course.curriculum.sections || !course.curriculum.sections[sectionIndex]) {
            return res.status(400).json({
                success: false,
                message: 'Section not found'
            });
        }

        // Check if lecture exists
        if (!course.curriculum.sections[sectionIndex].lectures || 
            !course.curriculum.sections[sectionIndex].lectures[lectureIndex]) {
            return res.status(400).json({
                success: false,
                message: 'Lecture not found'
            });
        }

        const lecture = course.curriculum.sections[sectionIndex].lectures[lectureIndex];
        
        if (lecture.type !== 'article' || !lecture.content) {
            return res.status(400).json({
                success: false,
                message: 'This lecture is not an article or has no content'
            });
        }

        res.json({
            success: true,
            content: lecture.content,
            readingTime: lecture.readingTime || '5 min'
        });

    } catch (error) {
        console.error('Get article data error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get article data',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ============================================
// VIDEO PROGRESS TRACKING APIs
// ============================================

// Update lecture progress (save current video position)
exports.updateLectureProgress = async (req, res) => {
    try {
        const { 
            learnerId, 
            courseId, 
            lectureId, 
            sectionId,
            currentTime, 
            videoProgress, 
            completed,
            contentType = 'video'
        } = req.body;

        console.log('📊 SERVER: updateLectureProgress called:', {
            learnerId,
            courseId,
            lectureId,
            currentTime,
            videoProgress,
            completed,
            contentType
        });

        if (!learnerId || !courseId || !lectureId) {
            return res.status(400).json({
                success: false,
                message: 'Learner ID, Course ID, and Lecture ID are required'
            });
        }

        // Find user
        const user = await User.findById(learnerId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Initialize lectureProgress array if it doesn't exist
        if (!user.lectureProgress) {
            user.lectureProgress = [];
        }

        // Find existing progress entry for this lecture
        const existingProgressIndex = user.lectureProgress.findIndex(
            p => p.courseId?.toString() === courseId && p.lectureId === lectureId
        );

        const progressData = {
            courseId: courseId,
            lectureId: lectureId,
            sectionId: sectionId || null,
            currentTime: currentTime || 0,
            videoProgress: videoProgress || 0,
            completed: completed || false,
            contentType: contentType,
            lastAccessed: new Date(),
            completedAt: completed ? new Date() : null
        };

        if (existingProgressIndex >= 0) {
            // Update existing entry - but don't go backwards unless completing
            const existing = user.lectureProgress[existingProgressIndex];
            
            // Only update currentTime if it's further ahead OR if we're completing
            if (currentTime >= (existing.currentTime || 0) || completed) {
                user.lectureProgress[existingProgressIndex] = {
                    ...existing,
                    ...progressData,
                    // Keep completedAt if already completed
                    completedAt: existing.completedAt || progressData.completedAt
                };
            } else {
                // Just update lastAccessed
                user.lectureProgress[existingProgressIndex].lastAccessed = new Date();
            }
            
            console.log('✅ SERVER: Updated existing progress entry');
        } else {
            // Create new entry
            user.lectureProgress.push(progressData);
            console.log('✅ SERVER: Created new progress entry');
        }

        await user.save();

        console.log('💾 SERVER: Progress saved successfully:', {
            lectureId,
            currentTime,
            videoProgress,
            completed
        });

        res.json({
            success: true,
            message: 'Progress updated successfully',
            progress: progressData
        });

    } catch (error) {
        console.error('❌ SERVER: Error updating lecture progress:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update progress',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get user's current position in a course (where they should resume)
exports.getUserCurrentPosition = async (req, res) => {
    try {
        const { learnerId, courseId } = req.params;

        console.log('📍 SERVER: getUserCurrentPosition called:', { learnerId, courseId });

        if (!learnerId || !courseId) {
            return res.status(400).json({
                success: false,
                message: 'Learner ID and Course ID are required'
            });
        }

        // Find user
        const user = await User.findById(learnerId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Find course
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Get all progress for this course
        const courseProgress = user.lectureProgress?.filter(
            p => p.courseId?.toString() === courseId
        ) || [];

        if (courseProgress.length === 0) {
            // No progress - should start from beginning
            console.log('📍 SERVER: No progress found, starting from beginning');
            return res.json({
                success: true,
                currentPosition: {
                    shouldStartFromBeginning: true,
                    lectureId: null,
                    currentTime: 0,
                    videoProgress: 0,
                    isCompleted: false
                }
            });
        }

        // Find the most recently accessed incomplete lecture
        const sortedProgress = courseProgress.sort(
            (a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed)
        );

        // Find last incomplete lecture
        const lastIncomplete = sortedProgress.find(p => !p.completed);
        
        if (lastIncomplete) {
            console.log('📍 SERVER: Found incomplete lecture:', {
                lectureId: lastIncomplete.lectureId,
                currentTime: lastIncomplete.currentTime,
                videoProgress: lastIncomplete.videoProgress
            });

            return res.json({
                success: true,
                currentPosition: {
                    shouldStartFromBeginning: false,
                    lectureId: lastIncomplete.lectureId,
                    sectionId: lastIncomplete.sectionId,
                    currentTime: lastIncomplete.currentTime || 0,
                    videoProgress: lastIncomplete.videoProgress || 0,
                    isCompleted: false,
                    lastAccessed: lastIncomplete.lastAccessed
                }
            });
        }

        // All lectures are completed - find next incomplete lecture in course order
        const allLectureIds = [];
        if (course.curriculum?.sections) {
            course.curriculum.sections.forEach(section => {
                section.lectures?.forEach(lecture => {
                    allLectureIds.push({
                        lectureId: lecture._id?.toString(),
                        sectionId: section._id?.toString()
                    });
                });
            });
        }

        // Find first lecture not in completed list
        const completedLectureIds = new Set(
            sortedProgress.filter(p => p.completed).map(p => p.lectureId)
        );

        const nextIncomplete = allLectureIds.find(
            l => !completedLectureIds.has(l.lectureId)
        );

        if (nextIncomplete) {
            console.log('📍 SERVER: Found next incomplete lecture:', nextIncomplete);
            return res.json({
                success: true,
                currentPosition: {
                    shouldStartFromBeginning: false,
                    lectureId: nextIncomplete.lectureId,
                    sectionId: nextIncomplete.sectionId,
                    currentTime: 0,
                    videoProgress: 0,
                    isCompleted: false,
                    isNext: true
                }
            });
        }

        // All lectures are completed - return the most recent one
        const mostRecent = sortedProgress[0];
        console.log('📍 SERVER: All lectures completed, returning most recent:', {
            lectureId: mostRecent.lectureId
        });

        return res.json({
            success: true,
            currentPosition: {
                shouldStartFromBeginning: false,
                lectureId: mostRecent.lectureId,
                sectionId: mostRecent.sectionId,
                currentTime: mostRecent.currentTime || 0,
                videoProgress: 100,
                isCompleted: true,
                lastAccessed: mostRecent.lastAccessed
            }
        });

    } catch (error) {
        console.error('❌ SERVER: Error getting current position:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get current position',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get specific lecture progress
exports.getLectureProgress = async (req, res) => {
    try {
        const { learnerId, courseId, lectureId } = req.params;

        console.log('📊 SERVER: getLectureProgress called:', { learnerId, courseId, lectureId });

        if (!learnerId || !courseId || !lectureId) {
            return res.status(400).json({
                success: false,
                message: 'Learner ID, Course ID, and Lecture ID are required'
            });
        }

        const user = await User.findById(learnerId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const lectureProgress = user.lectureProgress?.find(
            p => p.courseId?.toString() === courseId && p.lectureId === lectureId
        );

        if (lectureProgress) {
            console.log('✅ SERVER: Found lecture progress:', lectureProgress);
            return res.json({
                success: true,
                hasProgress: true,
                progress: {
                    lectureId: lectureProgress.lectureId,
                    currentTime: lectureProgress.currentTime || 0,
                    videoProgress: lectureProgress.videoProgress || 0,
                    completed: lectureProgress.completed || false,
                    lastAccessed: lectureProgress.lastAccessed
                }
            });
        }

        console.log('📝 SERVER: No progress found for this lecture');
        return res.json({
            success: true,
            hasProgress: false,
            progress: null
        });

    } catch (error) {
        console.error('❌ SERVER: Error getting lecture progress:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get lecture progress',
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
// ============================================
// LEARNER CONTENT RETRIEVAL APIs
// ============================================

// Get full course content for learner (structured for easy navigation)
exports.getCourseContentForLearner = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { learnerId } = req.query;
        
        console.log('\n📚 === FETCHING COURSE CONTENT FOR LEARNER ===');
        console.log('🆔 Course ID:', courseId);
        console.log('👤 Learner ID:', learnerId);
        
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        // Build absolute URLs for media
        const baseUrl = req.protocol + '://' + req.get('host');
        
        // Get learner's progress if learnerId is provided
        let learnerProgress = [];
        if (learnerId) {
            const user = await User.findById(learnerId);
            if (user && user.lectureProgress) {
                learnerProgress = user.lectureProgress.filter(p => 
                    p.courseId?.toString() === courseId
                );
            }
        }
        
        // Structure the response for easy learner navigation
        const courseContent = {
            courseId: course._id,
            title: course.title,
            description: course.description,
            thumbnail: makeAbsolute(baseUrl, course.thumbnail),
            mentorName: course.mentorName,
            level: course.level,
            category: course.category,
            language: course.language,
            duration: course.duration,
            stats: course.stats,
            
            // Structured curriculum
            curriculum: {
                totalSections: course.curriculum?.sections?.length || 0,
                totalLectures: 0,
                sections: []
            }
        };
        
        // Process each section
        if (course.curriculum && course.curriculum.sections) {
            let lectureCounter = 0;
            
            courseContent.curriculum.sections = course.curriculum.sections.map((section, sectionIdx) => {
                const sectionData = {
                    _id: section._id,
                    order: section.order || sectionIdx + 1,
                    title: section.title,
                    description: section.description,
                    lectureCount: section.lectures?.length || 0,
                    lectures: []
                };
                
                // Process each lecture
                if (section.lectures) {
                    sectionData.lectures = section.lectures.map((lecture, lectureIdx) => {
                        lectureCounter++;
                        
                        // Get learner's progress for this lecture
                        const progress = learnerProgress.find(p => 
                            p.lectureId === lecture._id?.toString()
                        );
                        
                        const lectureData = {
                            _id: lecture._id,
                            order: lecture.order || lectureIdx + 1,
                            globalOrder: lectureCounter,
                            title: lecture.title,
                            type: lecture.type,
                            description: lecture.description,
                            isPreview: lecture.isPreview || false,
                            duration: lecture.duration || lecture.readingTime,
                            
                            // Progress
                            isCompleted: progress?.completed || false,
                            progressPercent: progress?.progress || 0,
                            lastAccessed: progress?.lastAccessed,
                            
                            // Content based on type
                            content: null
                        };
                        
                        // Add type-specific content
                        switch (lecture.type) {
                            case 'video':
                                lectureData.content = {
                                    type: 'video',
                                    videoUrl: makeAbsolute(baseUrl, lecture.video?.videoUrl || lecture.videoUrl),
                                    duration: lecture.video?.duration || lecture.duration,
                                    durationSeconds: lecture.video?.durationSeconds || 0,
                                    thumbnail: makeAbsolute(baseUrl, lecture.video?.thumbnail),
                                    transcript: lecture.video?.transcript
                                };
                                break;
                                
                            case 'quiz':
                                lectureData.content = {
                                    type: 'quiz',
                                    title: lecture.quiz?.title || lecture.title,
                                    description: lecture.quiz?.description,
                                    timeLimitMinutes: lecture.quiz?.timeLimitMinutes || 30,
                                    passingScore: lecture.quiz?.passingScore || 70,
                                    questionsCount: lecture.quiz?.questions?.length || 0,
                                    attemptsAllowed: lecture.quiz?.attemptsAllowed || 3,
                                    tokenReward: lecture.quiz?.tokenReward || 5,
                                    // Don't send correct answers to learner initially
                                    questions: lecture.quiz?.questions?.map((q, qIdx) => ({
                                        _id: q._id,
                                        order: qIdx + 1,
                                        question: q.question,
                                        type: q.type,
                                        choices: q.choices,
                                        marks: q.marks
                                        // correctIndex, correctIndices, sampleAnswer hidden until submitted
                                    })) || []
                                };
                                break;
                                
                            case 'assignment':
                                lectureData.content = {
                                    type: 'assignment',
                                    title: lecture.assignment?.title || lecture.title,
                                    description: lecture.assignment?.description,
                                    instructions: lecture.assignment?.instructions,
                                    submissionType: lecture.assignment?.submissionType || 'file',
                                    maxFileSize: lecture.assignment?.maxFileSize || '10MB',
                                    maxScore: lecture.assignment?.maxScore || 100,
                                    allowedFileTypes: lecture.assignment?.allowedFileTypes,
                                    dueDate: lecture.assignment?.dueDate,
                                    rubric: lecture.assignment?.rubric
                                };
                                break;
                                
                            case 'article':
                                lectureData.content = {
                                    type: 'article',
                                    content: lecture.article?.content || lecture.content,
                                    contentType: lecture.article?.contentType || 'html',
                                    readingTime: lecture.article?.readingTime || lecture.readingTime || '5 min',
                                    wordCount: lecture.article?.wordCount || 0,
                                    summary: lecture.article?.summary
                                };
                                break;
                        }
                        
                        // Add resources if any
                        lectureData.resources = lecture.resources || [];
                        
                        return lectureData;
                    });
                }
                
                return sectionData;
            });
            
            courseContent.curriculum.totalLectures = lectureCounter;
        }
        
        // Calculate overall progress
        if (learnerId && learnerProgress.length > 0) {
            const completedCount = learnerProgress.filter(p => p.completed).length;
            courseContent.progress = {
                completedLectures: completedCount,
                totalLectures: courseContent.curriculum.totalLectures,
                percentage: courseContent.curriculum.totalLectures > 0 
                    ? Math.round((completedCount / courseContent.curriculum.totalLectures) * 100) 
                    : 0
            };
        }
        
        console.log('✅ Course Content Retrieved Successfully');
        console.log('📊 Stats:', {
            sections: courseContent.curriculum.totalSections,
            lectures: courseContent.curriculum.totalLectures
        });
        
        res.json({
            success: true,
            course: courseContent
        });
        
    } catch (error) {
        console.error('Get course content error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get course content',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get specific lecture content for learner
exports.getLectureContent = async (req, res) => {
    try {
        const { courseId, sectionId, lectureId } = req.params;
        const { learnerId } = req.query;
        
        console.log('\n📝 === FETCHING LECTURE CONTENT ===');
        console.log('🆔 Course ID:', courseId);
        console.log('📑 Section ID:', sectionId);
        console.log('📄 Lecture ID:', lectureId);
        
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        // Find the section and lecture
        let targetSection = null;
        let targetLecture = null;
        let sectionIndex = -1;
        let lectureIndex = -1;
        
        if (course.curriculum && course.curriculum.sections) {
            for (let i = 0; i < course.curriculum.sections.length; i++) {
                const section = course.curriculum.sections[i];
                if (section._id?.toString() === sectionId || i.toString() === sectionId) {
                    targetSection = section;
                    sectionIndex = i;
                    
                    if (section.lectures) {
                        for (let j = 0; j < section.lectures.length; j++) {
                            const lecture = section.lectures[j];
                            if (lecture._id?.toString() === lectureId || j.toString() === lectureId) {
                                targetLecture = lecture;
                                lectureIndex = j;
                                break;
                            }
                        }
                    }
                    break;
                }
            }
        }
        
        if (!targetSection || !targetLecture) {
            return res.status(404).json({
                success: false,
                message: 'Section or lecture not found'
            });
        }
        
        const baseUrl = req.protocol + '://' + req.get('host');
        
        // Build lecture response
        const lectureData = {
            _id: targetLecture._id,
            title: targetLecture.title,
            type: targetLecture.type,
            description: targetLecture.description,
            sectionTitle: targetSection.title,
            sectionIndex: sectionIndex,
            lectureIndex: lectureIndex,
            
            // Navigation info
            navigation: {
                hasPrevious: sectionIndex > 0 || lectureIndex > 0,
                hasNext: true, // Calculate based on actual content
                previousLecture: null,
                nextLecture: null
            }
        };
        
        // Add type-specific content
        switch (targetLecture.type) {
            case 'video':
                lectureData.video = {
                    videoUrl: makeAbsolute(baseUrl, targetLecture.video?.videoUrl || targetLecture.videoUrl),
                    duration: targetLecture.video?.duration || targetLecture.duration,
                    durationSeconds: targetLecture.video?.durationSeconds || 0,
                    thumbnail: makeAbsolute(baseUrl, targetLecture.video?.thumbnail),
                    transcript: targetLecture.video?.transcript,
                    fileName: targetLecture.video?.fileName || targetLecture.fileName
                };
                break;
                
            case 'quiz':
                lectureData.quiz = {
                    title: targetLecture.quiz?.title || targetLecture.title,
                    description: targetLecture.quiz?.description,
                    timeLimitMinutes: targetLecture.quiz?.timeLimitMinutes || 30,
                    passingScore: targetLecture.quiz?.passingScore || 70,
                    attemptsAllowed: targetLecture.quiz?.attemptsAllowed || 3,
                    tokenReward: targetLecture.quiz?.tokenReward || 5,
                    shuffleQuestions: targetLecture.quiz?.shuffleQuestions || false,
                    questions: targetLecture.quiz?.questions?.map((q, idx) => ({
                        _id: q._id,
                        order: idx + 1,
                        question: q.question,
                        type: q.type,
                        choices: q.choices,
                        marks: q.marks
                    })) || []
                };
                break;
                
            case 'assignment':
                lectureData.assignment = {
                    title: targetLecture.assignment?.title || targetLecture.title,
                    description: targetLecture.assignment?.description,
                    instructions: targetLecture.assignment?.instructions,
                    submissionType: targetLecture.assignment?.submissionType || 'file',
                    maxFileSize: targetLecture.assignment?.maxFileSize || '10MB',
                    maxScore: targetLecture.assignment?.maxScore || 100,
                    allowedFileTypes: targetLecture.assignment?.allowedFileTypes,
                    dueDate: targetLecture.assignment?.dueDate,
                    rubric: targetLecture.assignment?.rubric
                };
                break;
                
            case 'article':
                lectureData.article = {
                    content: targetLecture.article?.content || targetLecture.content,
                    contentType: targetLecture.article?.contentType || 'html',
                    readingTime: targetLecture.article?.readingTime || targetLecture.readingTime || '5 min',
                    wordCount: targetLecture.article?.wordCount || 0,
                    summary: targetLecture.article?.summary
                };
                break;
        }
        
        // Add resources
        lectureData.resources = (targetLecture.resources || []).map(r => ({
            ...r,
            url: r.url ? makeAbsolute(baseUrl, r.url) : null
        }));
        
        console.log('✅ Lecture Content Retrieved:', targetLecture.title);
        
        res.json({
            success: true,
            lecture: lectureData
        });
        
    } catch (error) {
        console.error('Get lecture content error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get lecture content',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Submit quiz answers and get results
exports.submitQuizAnswers = async (req, res) => {
    try {
        const { courseId, sectionIndex, lectureIndex } = req.params;
        const { learnerId, answers } = req.body;
        
        console.log('\n📝 === QUIZ SUBMISSION ===');
        console.log('🆔 Course ID:', courseId);
        console.log('👤 Learner ID:', learnerId);
        console.log('📝 Answers Count:', answers?.length || 0);
        
        if (!learnerId || !answers) {
            return res.status(400).json({
                success: false,
                message: 'Learner ID and answers are required'
            });
        }
        
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        // Get the quiz
        const section = course.curriculum?.sections?.[sectionIndex];
        const lecture = section?.lectures?.[lectureIndex];
        
        if (!lecture || lecture.type !== 'quiz' || !lecture.quiz) {
            return res.status(400).json({
                success: false,
                message: 'Quiz not found'
            });
        }
        
        const quiz = lecture.quiz;
        let totalMarks = 0;
        let earnedMarks = 0;
        const results = [];
        
        // Grade each question
        quiz.questions.forEach((question, qIdx) => {
            const answer = answers.find(a => a.questionId === question._id?.toString() || a.questionIndex === qIdx);
            const questionMarks = question.marks || 1;
            totalMarks += questionMarks;
            
            let isCorrect = false;
            let earnedForQuestion = 0;
            
            switch (question.type) {
                case 'single_correct':
                    isCorrect = answer?.selectedIndex === question.correctIndex;
                    earnedForQuestion = isCorrect ? questionMarks : 0;
                    break;
                    
                case 'multiple_correct':
                    const selectedIndices = answer?.selectedIndices || [];
                    const correctIndices = question.correctIndices || [];
                    isCorrect = selectedIndices.length === correctIndices.length &&
                               selectedIndices.every(idx => correctIndices.includes(idx));
                    earnedForQuestion = isCorrect ? questionMarks : 0;
                    break;
                    
                case 'short_answer':
                    // For short answer, we just store the response - manual grading needed
                    isCorrect = null; // Pending review
                    earnedForQuestion = 0;
                    break;
            }
            
            earnedMarks += earnedForQuestion;
            
            results.push({
                questionId: question._id,
                questionIndex: qIdx,
                question: question.question,
                yourAnswer: answer,
                isCorrect: isCorrect,
                correctAnswer: quiz.showCorrectAnswers ? {
                    type: question.type,
                    correctIndex: question.correctIndex,
                    correctIndices: question.correctIndices,
                    sampleAnswer: question.sampleAnswer
                } : null,
                marks: questionMarks,
                earnedMarks: earnedForQuestion,
                explanation: question.explanation
            });
        });
        
        const percentage = totalMarks > 0 ? Math.round((earnedMarks / totalMarks) * 100) : 0;
        const passed = percentage >= (quiz.passingScore || 70);
        
        // Update learner's progress
        const user = await User.findById(learnerId);
        if (user) {
            // Initialize lectureProgress if it doesn't exist
            if (!user.lectureProgress) {
                user.lectureProgress = [];
            }
            
            const lectureId = lecture._id?.toString();
            let progressEntry = user.lectureProgress.find(p => 
                p.courseId?.toString() === courseId && p.lectureId === lectureId
            );
            
            if (progressEntry) {
                progressEntry.completed = passed;
                progressEntry.progress = percentage;
                progressEntry.lastAccessed = new Date();
            } else {
                user.lectureProgress.push({
                    courseId: courseId,
                    lectureId: lectureId,
                    sectionId: section._id?.toString(),
                    progress: percentage,
                    completed: passed,
                    lastAccessed: new Date()
                });
            }
            
            // Award tokens if passed
            if (passed && quiz.tokenReward) {
                user.tokenBalance = (user.tokenBalance || 0) + quiz.tokenReward;
                user.transactionHistory.push({
                    transactionType: 'earn',
                    amount: quiz.tokenReward,
                    description: `Quiz completed: ${quiz.title || lecture.title}`,
                    timestamp: new Date()
                });
            }
            
            await user.save();
        }
        
        console.log('✅ Quiz Graded:', {
            score: `${earnedMarks}/${totalMarks}`,
            percentage: `${percentage}%`,
            passed
        });
        
        res.json({
            success: true,
            result: {
                quizTitle: quiz.title || lecture.title,
                totalQuestions: quiz.questions.length,
                totalMarks,
                earnedMarks,
                percentage,
                passingScore: quiz.passingScore || 70,
                passed,
                tokenReward: passed ? quiz.tokenReward : 0,
                results,
                message: passed 
                    ? `Congratulations! You passed with ${percentage}%` 
                    : `You scored ${percentage}%. You need ${quiz.passingScore || 70}% to pass.`
            }
        });
        
    } catch (error) {
        console.error('Submit quiz error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit quiz',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};