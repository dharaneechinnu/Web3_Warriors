const CourseModel = require('../Model/CourseModel');
const { UdemyCourse, StudentProgress } = require('../Model/CourseSystemModel');
const UserModel = require('../Model/UserModel');
const mongoose = require('mongoose');

// Get user progress for a specific course
exports.getUserProgress = async (req, res) => {
  try {
    const { userId, courseId } = req.params;
    
    console.log('Fetching progress for user:', userId, 'course:', courseId);
    
    // Find existing progress using StudentProgress model
    const progressRecords = await StudentProgress.find({
      studentId: userId,
      courseId: courseId
    });
    
    // Format progress data
    const lectureProgress = progressRecords.map(record => ({
      lectureId: record.lectureId,
      videoProgress: record.videoProgress,
      completed: record.completed,
      lastAccessed: record.lastAccessed,
      completedAt: record.completedAt
    }));
    
    // Calculate overall progress
    const completedLectures = progressRecords.filter(p => p.completed).length;
    const totalLectures = await getTotalLecturesForCourse(courseId);
    const overallProgress = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;
    
    res.json({
      success: true,
      progress: {
        lectureProgress,
        overallProgress,
        lastAccessed: new Date(),
        enrolledAt: progressRecords[0]?.createdAt || new Date()
      }
    });
  } catch (error) {
    console.error('Error fetching user progress:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user progress',
      error: error.message
    });
  }
};

// Update lecture progress
exports.updateLectureProgress = async (req, res) => {
  try {
    const {
      learnerId,
      courseId,
      lectureId,
      sectionId,
      completed,
      videoProgress = 0,
      contentType = 'video',
      completedAt,
      watchTime = 0,
      totalDuration = 0
    } = req.body;
    
    console.log('Updating lecture progress:', {
      learnerId,
      courseId,
      lectureId,
      completed,
      contentType
    });
    
    // Find or create progress record
    let progress = await StudentProgress.findOne({
      studentId: learnerId,
      courseId,
      lectureId
    });
    
    if (!progress) {
      progress = new StudentProgress({
        studentId: learnerId,
        courseId,
        lectureId,
        completed: false,
        videoProgress: 0,
        lastAccessed: new Date()
      });
    }
    
    // Update progress fields
    progress.completed = completed;
    progress.videoProgress = videoProgress;
    progress.lastAccessed = new Date();
    if (completed && !progress.completedAt) {
      progress.completedAt = completedAt || new Date();
    }
    
    await progress.save();
    
    // Calculate overall progress
    const totalLectures = await getTotalLecturesForCourse(courseId);
    const completedLectures = await StudentProgress.countDocuments({
      studentId: learnerId,
      courseId,
      completed: true
    });
    const overallProgress = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;
    
    res.json({
      success: true,
      message: 'Lecture progress updated successfully',
      progress: {
        lectureProgress: [progress],
        overallProgress,
        completedLectures,
        totalLectures
      }
    });
  } catch (error) {
    console.error('Error updating lecture progress:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating lecture progress',
      error: error.message
    });
  }
};

// Get quiz by lecture ID
exports.getQuiz = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;
    
    // Find the course and extract quiz from curriculum
    const course = await UdemyCourse.findById(courseId);
    if (!course || !course.curriculum) {
      return res.status(404).json({
        success: false,
        message: 'Course or curriculum not found'
      });
    }
    
    // Find quiz in curriculum
    let quiz = null;
    for (const section of course.curriculum.sections) {
      const lecture = section.lectures.find(l => l._id.toString() === lectureId && l.type === 'quiz');
      if (lecture && lecture.quizData) {
        quiz = lecture.quizData;
        break;
      }
    }
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }
    
    res.json({
      success: true,
      quiz
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching quiz',
      error: error.message
    });
  }
};
// Submit quiz
exports.submitQuiz = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;
    const { learnerId, answers, submittedAt } = req.body;
    
    // Get quiz data
    const course = await UdemyCourse.findById(courseId);
    let quiz = null;
    for (const section of course.curriculum.sections) {
      const lecture = section.lectures.find(l => l._id.toString() === lectureId && l.type === 'quiz');
      if (lecture) {
        quiz = lecture.quizData;
        break;
      }
    }
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }
    
    // Calculate score
    let score = 0;
    const totalQuestions = quiz.questions.length;
    
    quiz.questions.forEach((question, index) => {
      const userAnswer = answers[question._id] || answers[index];
      if (userAnswer === question.correctAnswer) {
        score++;
      }
    });
    
    const percentage = (score / totalQuestions) * 100;
    const passed = percentage >= (quiz.passingScore || 70);
    
    res.json({
      success: true,
      result: {
        score,
        totalQuestions,
        percentage,
        passed,
        feedback: passed ? 'Congratulations! You passed the quiz.' : 'You need to score at least ' + (quiz.passingScore || 70) + '% to pass.'
      }
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting quiz',
      error: error.message
    });
  }
};

// Get article by lecture ID
exports.getArticle = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;
    
    // Find the course and extract article from curriculum
    const course = await UdemyCourse.findById(courseId);
    if (!course || !course.curriculum) {
      return res.status(404).json({
        success: false,
        message: 'Course or curriculum not found'
      });
    }
    
    // Find article in curriculum
    let article = null;
    for (const section of course.curriculum.sections) {
      const lecture = section.lectures.find(l => l._id.toString() === lectureId && l.type === 'article');
      if (lecture) {
        article = {
          title: lecture.title,
          content: lecture.articleContent || lecture.content,
          readingTime: lecture.readingTime || '5 min'
        };
        break;
      }
    }
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    res.json({
      success: true,
      article
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching article',
      error: error.message
    });
  }
};

// Get assignment by lecture ID
exports.getAssignment = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;
    
    // Find the course and extract assignment from curriculum
    const course = await UdemyCourse.findById(courseId);
    if (!course || !course.curriculum) {
      return res.status(404).json({
        success: false,
        message: 'Course or curriculum not found'
      });
    }
    
    // Find assignment in curriculum
    let assignment = null;
    for (const section of course.curriculum.sections) {
      const lecture = section.lectures.find(l => l._id.toString() === lectureId && l.type === 'assignment');
      if (lecture) {
        assignment = {
          title: lecture.title,
          description: lecture.assignmentDescription || lecture.description,
          instructions: lecture.assignmentInstructions,
          dueDate: lecture.dueDate,
          maxFileSize: lecture.maxFileSize || '10MB',
          allowedFileTypes: lecture.allowedFileTypes || ['.pdf', '.doc', '.docx', '.zip']
        };
        break;
      }
    }
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }
    
    res.json({
      success: true,
      assignment
    });
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assignment',
      error: error.message
    });
  }
};

// Submit assignment
exports.submitAssignment = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;
    const { learnerId, description, submittedAt } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const submission = {
      lectureId,
      learnerId,
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      description,
      submittedAt: submittedAt || new Date(),
      status: 'submitted' // submitted, graded, returned
    };
    
    res.json({
      success: true,
      message: 'Assignment submitted successfully',
      submission: {
        ...submission,
        filePath: undefined // Don't send file path to client
      }
    });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting assignment',
      error: error.message
    });
  }
};

// Helper function to get total lectures in a course
async function getTotalLecturesForCourse(courseId) {
  try {
    const course = await UdemyCourse.findById(courseId);
    if (!course || !course.curriculum) return 0;
    
    let totalLectures = 0;
    course.curriculum.sections.forEach(section => {
      totalLectures += section.lectures ? section.lectures.length : 0;
    });
    
    return totalLectures;
  } catch (error) {
    console.error('Error getting total lectures:', error);
    return 0;
  }
}