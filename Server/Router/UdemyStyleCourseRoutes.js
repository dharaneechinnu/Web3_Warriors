const express = require('express');
const router = express.Router();
const {
  UdemyCourse,
  CourseSection,
  CourseLecture,
  StudentProgress,
  AssignmentSubmission,
  CourseEnrollment,
  CourseBookmark,
  Quiz,
  QuizQuestion
} = require('../Model/CourseSystemModel');
const multer = require('multer');
const path = require('path');

// Configure multer for comprehensive file uploads (Udemy-style)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    switch (file.fieldname) {
      case 'thumbnail':
        cb(null, 'uploads/courses/thumbnails/');
        break;
      case 'promo_video':
        cb(null, 'uploads/courses/promos/');
        break;
      case 'lecture_video':
        cb(null, 'uploads/courses/videos/');
        break;
      case 'resource':
        cb(null, 'uploads/courses/resources/');
        break;
      case 'assignment':
        cb(null, 'uploads/courses/assignments/');
        break;
      default:
        cb(null, 'uploads/courses/');
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + sanitizedName);
  }
});

// File filter for different types
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    thumbnail: /jpeg|jpg|png|gif|webp/,
    promo_video: /mp4|avi|mov|wmv|flv|webm/,
    lecture_video: /mp4|avi|mov|wmv|flv|webm/,
    resource: /pdf|doc|docx|txt|zip|rar/,
    assignment: /.*/ // Allow all file types for assignments
  };
  
  const fieldType = file.fieldname;
  const fileType = allowedTypes[fieldType];
  
  if (fileType && fileType.test(path.extname(file.originalname).toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for ${fieldType}`), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  }
});

// MENTOR ROUTES - Course Creation and Management

// Upload lecture video (individual upload)
router.post('/upload-lecture-video', upload.single('lecture_video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No video file uploaded' 
      });
    }

    const filePath = `/uploads/courses/videos/${req.file.filename}`;
    const fileSize = req.file.size;
    const originalName = req.file.originalname;

    res.json({
      success: true,
      message: 'Video uploaded successfully',
      filePath,
      fileSize,
      fileName: originalName,
      fileUrl: `${req.protocol}://${req.get('host')}${filePath}`
    });

  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Create new course with file uploads (Udemy-style)
router.post('/create', upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'promo_video', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, description, skillLevel, learningOutcomes, price, category, mentorId } = req.body;
    
    // Handle file uploads
    const thumbnailUrl = req.files?.thumbnail ? `/uploads/courses/thumbnails/${req.files.thumbnail[0].filename}` : null;
    const promoVideoUrl = req.files?.promo_video ? `/uploads/courses/promos/${req.files.promo_video[0].filename}` : null;
    
    const course = new UdemyCourse({
      title,
      description,
      skillLevel,
      learningOutcomes: JSON.parse(learningOutcomes),
      price: price || 0,
      category,
      mentorId,
      thumbnail: thumbnailUrl,
      promoVideo: promoVideoUrl
    });
    
    await course.save();
    res.status(201).json({ success: true, course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get mentor's courses
router.get('/mentor/:mentorId', async (req, res) => {
  try {
    const courses = await UdemyUdemyCourse.find({ mentorId: req.params.mentorId });
    res.json({ success: true, courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get course with full structure for editing
router.get('/edit/:courseId', async (req, res) => {
  try {
    const course = await UdemyUdemyCourse.findById(req.params.courseId);
    const sections = await CourseSection.find({ courseId: req.params.courseId }).sort({ order: 1 });
    const lectures = await CourseCourseLecture.find({ courseId: req.params.courseId }).sort({ order: 1 });
    
    // Group lectures by section
    const sectionsWithLectures = sections.map(section => ({
      ...section.toObject(),
      lectures: lectures.filter(lecture => 
        CourseLecture.sectionId.toString() === section._id.toString()
      )
    }));
    
    res.json({ 
      success: true, 
      course, 
      sections: sectionsWithLectures 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add section to course
router.post('/section', async (req, res) => {
  try {
    const { title, courseId, order } = req.body;
    
    const section = new CourseSection({
      title,
      courseId,
      order
    });
    
    await section.save();
    res.status(201).json({ success: true, section });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update section
router.put('/section/:sectionId', async (req, res) => {
  try {
    const { title, order } = req.body;
    const section = await CourseSection.findByIdAndUpdate(
      req.params.sectionId,
      { title, order },
      { new: true }
    );
    res.json({ success: true, section });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete section
router.delete('/section/:sectionId', async (req, res) => {
  try {
    await CourseCourseLecture.deleteMany({ sectionId: req.params.sectionId });
    await CourseSection.findByIdAndDelete(req.params.sectionId);
    res.json({ success: true, message: 'Section deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add lecture to section
router.post('/lecture', async (req, res) => {
  try {
    const lectureData = req.body;
    const lecture = new Lecture(lectureData);
    await CourseLecture.save();
    
    // Update course total lectures
    await UdemyUdemyCourse.findByIdAndUpdate(lectureData.courseId, { $inc: { totalLectures: 1 } });
    
    res.status(201).json({ success: true, lecture });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update lecture
router.put('/lecture/:lectureId', async (req, res) => {
  try {
    const lecture = await CourseLecture.findByIdAndUpdate(
      req.params.lectureId,
      req.body,
      { new: true }
    );
    res.json({ success: true, lecture });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete lecture
router.delete('/lecture/:lectureId', async (req, res) => {
  try {
    const lecture = await CourseLecture.findByIdAndDelete(req.params.lectureId);
    
    // Update course total lectures
    await UdemyCourse.findByIdAndUpdate(CourseLecture.courseId, { $inc: { totalLectures: -1 } });
    
    res.json({ success: true, message: 'Lecture deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create or update quiz for a lecture
router.post('/lecture/:lectureId/quiz', async (req, res) => {
  try {
    const lectureId = req.params.lectureId;
    const { title, description, questions, timeLimitMinutes, passingScore } = req.body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'Quiz must contain at least one question' });
    }

    // upsert quiz
    let quiz = await Quiz.findOne({ lectureId });
    if (!quiz) {
      quiz = new Quiz({ lectureId, courseId: req.body.courseId, title, description, questions, timeLimitMinutes, passingScore });
    } else {
      quiz.title = title || quiz.title;
      quiz.description = description || quiz.description;
      quiz.questions = questions;
      quiz.timeLimitMinutes = timeLimitMinutes;
      quiz.passingScore = passingScore;
    }

    await quiz.save();
    res.json({ success: true, quiz });
  } catch (error) {
    console.error('Quiz save error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get lecture details including quiz and assignment submissions
router.get('/lecture/:lectureId', async (req, res) => {
  try {
    const lecture = await CourseLecture.findById(req.params.lectureId);
    if (!lecture) return res.status(404).json({ success: false, message: 'Lecture not found' });

    const quiz = await Quiz.findOne({ lectureId: lecture._id });
    const submissions = await AssignmentSubmission.find({ lectureId: lecture._id }).sort({ submittedAt: -1 }).limit(50);

    res.json({ success: true, lecture, quiz, submissions });
  } catch (error) {
    console.error('Get lecture detail error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Upload video for lecture
router.post('/upload/video/:lectureId', upload.single('video'), async (req, res) => {
  try {
    const videoUrl = `/uploads/videos/${req.file.filename}`;
    const { duration, description } = req.body;
    
    const lecture = await CourseLecture.findByIdAndUpdate(
      req.params.lectureId,
      {
        videoUrl,
        videoDuration: duration,
        videoDescription: description
      },
      { new: true }
    );
    
    res.json({ success: true, lecture, videoUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Upload resource for lecture
router.post('/upload/resource/:lectureId', upload.single('resource'), async (req, res) => {
  try {
    const resourceUrl = `/uploads/resources/${req.file.filename}`;
    const { resourceType } = req.body;
    
    const lecture = await CourseLecture.findByIdAndUpdate(
      req.params.lectureId,
      {
        resourceUrl,
        resourceType
      },
      { new: true }
    );
    
    res.json({ success: true, lecture, resourceUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Publish course
router.put('/publish/:courseId', async (req, res) => {
  try {
    const courseId = req.params.courseId;
    
    // Check publishing requirements
    const sections = await Section.find({ courseId });
    const assignments = await CourseLecture.find({ courseId, type: 'assignment' });
    
    if (sections.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Course must have at least one section' 
      });
    }
    
    if (assignments.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Course must have at least one assignment' 
      });
    }
    
    const course = await UdemyCourse.findByIdAndUpdate(
      courseId,
      { isPublished: true, updatedAt: new Date() },
      { new: true }
    );
    
    res.json({ success: true, course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// LEARNER ROUTES - Course Consumption

// Get all published courses
router.get('/published', async (req, res) => {
  try {
    const courses = await UdemyUdemyCourse.find({ isPublished: true })
      .populate('mentorId', 'name')
      .select('title description skillLevel totalLectures createdAt mentorId');
    
    res.json({ success: true, courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get course content for learner
router.get('/learn/:courseId', async (req, res) => {
  try {
    const course = await UdemyCourse.findById(req.params.courseId)
      .populate('mentorId', 'name');
    
    if (!UdemyCourse.isPublished) {
      return res.status(403).json({ 
        success: false, 
        message: 'Course is not published yet' 
      });
    }
    
    const sections = await Section.find({ courseId: req.params.courseId }).sort({ order: 1 });
    const lectures = await CourseLecture.find({ courseId: req.params.courseId }).sort({ order: 1 });
    
    const sectionsWithLectures = sections.map(section => ({
      ...section.toObject(),
      lectures: lectures.filter(lecture => 
        CourseLecture.sectionId.toString() === section._id.toString()
      )
    }));
    
    res.json({ 
      success: true, 
      course, 
      sections: sectionsWithLectures 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Enroll in course
router.post('/enroll', async (req, res) => {
  try {
    const { courseId, learnerId } = req.body;
    // Defensive: ensure learnerId present
    const learnerIdVal = learnerId || req.body.userId || req.body.studentId;

    // Prevent mentors from enrolling in their own course
    try {
      const course = await UdemyCourse.findById(courseId);
      if (course && course.mentorId && learnerIdVal && String(course.mentorId) === String(learnerIdVal)) {
        return res.status(403).json({ success: false, message: 'Mentors cannot enroll in their own course' });
      }
    } catch (err) {
      console.warn('Error checking mentor self-enroll prevention in udemy route:', err);
    }
    
    // Check if already enrolled
    const existingProgress = await StudentProgress.findOne({ courseId, learnerId });
    if (existingProgress) {
      return res.status(400).json({ 
        success: false, 
        message: 'Already enrolled in this course' 
      });
    }
    
    // Create progress record
    const progress = new Progress({
      courseId,
      learnerId,
      progressPercentage: 0
    });
    await StudentProgress.save();
    
    // Add to course enrolled students
    await UdemyCourse.findByIdAndUpdate(
      courseId,
      { $addToSet: { enrolledStudents: learnerId } }
    );
    
    res.json({ success: true, progress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get learner progress
router.get('/progress/:courseId/:learnerId', async (req, res) => {
  try {
    const progress = await StudentProgress.findOne({
      courseId: req.params.courseId,
      learnerId: req.params.learnerId
    });
    
    res.json({ success: true, progress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark lecture as completed
router.post('/complete-lecture', async (req, res) => {
  try {
    const { courseId, learnerId, lectureId } = req.body;
    
    const progress = await StudentProgress.findOne({ courseId, learnerId });
    if (!StudentProgress.completedLectures.includes(lectureId)) {
      StudentProgress.completedLectures.push(lectureId);
      StudentProgress.lastAccessedAt = new Date();
      
      // Calculate progress percentage
      const totalLectures = await CourseLecture.countDocuments({ courseId });
      StudentProgress.progressPercentage = (StudentProgress.completedLectures.length / totalLectures) * 100;
      
      await StudentProgress.save();
    }
    
    res.json({ success: true, progress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Submit assignment
router.post('/submit-assignment', async (req, res) => {
  try {
    const { learnerId, lectureId, courseId, submissionText, submissionUrl } = req.body;
    
    const submission = new Submission({
      learnerId,
      lectureId,
      courseId,
      submissionText,
      submissionUrl
    });
    
    await AssignmentSubmission.save();
    res.status(201).json({ success: true, submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== COMPREHENSIVE UPLOAD ENDPOINTS (Udemy-style) ====================

// Upload course thumbnail
router.post('/upload/thumbnail/:courseId', upload.single('thumbnail'), async (req, res) => {
  try {
    const thumbnailUrl = `/uploads/courses/thumbnails/${req.file.filename}`;
    const course = await UdemyCourse.findByIdAndUpdate(
      req.params.courseId,
      { thumbnail: thumbnailUrl },
      { new: true }
    );
    res.json({ success: true, thumbnailUrl, course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Upload promotional video
router.post('/upload/promo-video/:courseId', upload.single('promo_video'), async (req, res) => {
  try {
    const promoVideoUrl = `/uploads/courses/promos/${req.file.filename}`;
    const course = await UdemyCourse.findByIdAndUpdate(
      req.params.courseId,
      { promoVideo: promoVideoUrl },
      { new: true }
    );
    res.json({ success: true, promoVideoUrl, course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Upload lecture video with metadata
router.post('/upload/lecture-video/:lectureId', upload.single('lecture_video'), async (req, res) => {
  try {
    const { duration, description } = req.body;
    const videoUrl = `/uploads/courses/videos/${req.file.filename}`;
    
    const lecture = await CourseLecture.findByIdAndUpdate(
      req.params.lectureId,
      { 
        videoUrl,
        videoDuration: duration,
        description: description || lecture.description
      },
      { new: true }
    );
    
    res.json({ success: true, videoUrl, lecture });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Upload lecture resources (PDFs, documents, etc.)
router.post('/upload/lecture-resource/:lectureId', upload.single('resource'), async (req, res) => {
  try {
    const { description } = req.body;
    const resourceUrl = `/uploads/courses/resources/${req.file.filename}`;
    
    const lecture = await CourseLecture.findByIdAndUpdate(
      req.params.lectureId,
      { 
        resourceUrl,
        description: description || lecture.description
      },
      { new: true }
    );
    
    res.json({ success: true, resourceUrl, lecture });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bulk upload lectures with videos
router.post('/upload/bulk-lectures/:courseId', upload.array('lecture_videos', 20), async (req, res) => {
  try {
    const { lectureData } = req.body; // JSON array of lecture metadata
    const lectures = JSON.parse(lectureData);
    const createdLectures = [];
    
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const lectureInfo = lectures[i];
      
      const lecture = new CourseLecture({
        ...lectureInfo,
        courseId: req.params.courseId,
        videoUrl: `/uploads/courses/videos/${file.filename}`,
        type: 'video'
      });
      
      await lecture.save();
      createdLectures.push(lecture);
    }
    
    res.json({ success: true, lectures: createdLectures });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update course with complete data (Udemy-style full update)
router.put('/update-complete/:courseId', upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'promo_video', maxCount: 1 }
]), async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Handle file uploads if present
    if (req.files?.thumbnail) {
      updateData.thumbnail = `/uploads/courses/thumbnails/${req.files.thumbnail[0].filename}`;
    }
    if (req.files?.promo_video) {
      updateData.promoVideo = `/uploads/courses/promos/${req.files.promo_video[0].filename}`;
    }
    
    // Parse JSON fields
    if (updateData.learningOutcomes) {
      updateData.learningOutcomes = JSON.parse(updateData.learningOutcomes);
    }
    
    updateData.updatedAt = Date.now();
    
    const course = await UdemyCourse.findByIdAndUpdate(
      req.params.courseId,
      updateData,
      { new: true }
    );
    
    res.json({ success: true, course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Save course curriculum (sections and lectures)
router.post('/save-curriculum', async (req, res) => {
  try {
    const { courseId, courseName, sections } = req.body;
    
    // Validate input
    if (!sections || sections.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least one section is required' 
      });
    }

    let course;
    
    // If courseId is 'new' or doesn't exist, create a new course
    if (courseId === 'new' || !courseId) {
      course = new UdemyCourse({
        title: courseName,
        description: 'Course created via curriculum builder',
        mentorId: req.user?.id || req.body.mentorId, // Get from auth middleware or request
        status: 'draft'
      });
      await course.save();
    } else {
      course = await UdemyCourse.findById(courseId);
      if (!course) {
        return res.status(404).json({ 
          success: false, 
          message: 'Course not found' 
        });
      }
    }

    // Delete existing sections and lectures for this course
    await CourseLecture.deleteMany({ courseId: course._id });
    await CourseSection.deleteMany({ courseId: course._id });

    // Create new sections and lectures
    for (const sectionData of sections) {
      const section = new CourseSection({
        courseId: course._id,
        title: sectionData.title,
        order: sectionData.order,
        description: sectionData.description || ''
      });
      await section.save();

      // Create lectures for this section
      if (sectionData.lectures && sectionData.lectures.length > 0) {
        for (const lectureData of sectionData.lectures) {
          const lecture = new CourseLecture({
            courseId: course._id,
            sectionId: section._id,
            title: lectureData.title,
            type: lectureData.type,
            order: lectureData.order,
            duration: lectureData.duration,
            videoUrl: lectureData.videoUrl || '',
            content: lectureData.content || '',
            resources: lectureData.resources || [],
            isPreview: lectureData.isPreview || false
          });
          await lecture.save();
        }
      }
    }

    // Update course with section count
    const sectionCount = sections.length;
    const lectureCount = sections.reduce((acc, s) => acc + (s.lectures?.length || 0), 0);
    
    course.totalSections = sectionCount;
    course.totalLectures = lectureCount;
    course.updatedAt = Date.now();
    await course.save();

    res.json({ 
      success: true, 
      message: 'Curriculum saved successfully',
      courseId: course._id,
      course,
      stats: {
        sections: sectionCount,
        lectures: lectureCount
      }
    });

  } catch (error) {
    console.error('Curriculum save error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get course curriculum (sections and lectures)
router.get('/curriculum/:courseId', async (req, res) => {
  try {
    const course = await UdemyCourse.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found' 
      });
    }

    const sections = await CourseSection.find({ courseId: course._id })
      .sort({ order: 1 });

    const curriculum = [];
    
    for (const section of sections) {
      const lectures = await CourseLecture.find({ sectionId: section._id })
        .sort({ order: 1 });
      
      curriculum.push({
        id: section._id,
        title: section.title,
        description: section.description,
        order: section.order,
        lectures: lectures.map(lecture => ({
          id: lecture._id,
          title: lecture.title,
          type: lecture.type,
          order: lecture.order,
          duration: lecture.duration,
          videoUrl: lecture.videoUrl,
          content: lecture.content,
          resources: lecture.resources,
          isPreview: lecture.isPreview,
          isCompleted: false // Will be updated based on student progress
        }))
      });
    }

    res.json({ 
      success: true, 
      course: {
        id: course._id,
        title: course.title,
        description: course.description
      },
      curriculum 
    });

  } catch (error) {
    console.error('Get curriculum error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;
