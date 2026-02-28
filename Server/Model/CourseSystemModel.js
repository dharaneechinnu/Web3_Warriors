const mongoose = require('mongoose');

// Udemy-style Course Schema (renamed to avoid conflict)
const UdemyCourseSchema = new mongoose.Schema({
  mentorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  title: { 
    type: String, 
    required: true,
    maxlength: 100
  },
  description: { 
    type: String, 
    required: true,
    maxlength: 1000
  },
  skillLevel: { 
    type: String, 
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    required: true
  },
  learningOutcomes: [{
    type: String,
    required: true
  }],
  thumbnail: String,
  promoVideo: String,
  price: {
    type: Number,
    default: 0
  },
  category: String,
  language: {
    type: String,
    default: 'English'
  },
  subtitle: String,
  requirements: [String],
  targetAudience: [String],
  isPublished: { 
    type: Boolean, 
    default: false 
  },
  enrolledCount: { 
    type: Number, 
    default: 0 
  },
  // Course curriculum structure
  curriculum: {
    sections: [{
      _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
      title: { type: String, required: true },
      description: String,
      order: { type: Number, required: true },
      lectures: [{
        _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
        title: { type: String, required: true },
        type: { 
          type: String, 
          enum: ['video', 'quiz', 'article', 'assignment', 'resource'],
          required: true 
        },
        content: String,
        description: String,
        order: { type: Number, required: true },
        duration: String,
        // Video specific fields
        videoUrl: String,
        // Quiz specific fields
        quizData: {
          instructions: String,
          passingScore: { type: Number, default: 70 },
          questions: [{
            _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
            question: String,
            type: { type: String, enum: ['multiple-choice', 'text'], default: 'multiple-choice' },
            options: [String],
            correctAnswer: String
          }]
        },
        // Article specific fields
        articleContent: String,
        readingTime: String,
        // Assignment specific fields
        assignmentDescription: String,
        assignmentInstructions: String,
        dueDate: Date,
        maxFileSize: String,
        allowedFileTypes: [String],
        // Resource specific fields
        resourceUrl: String,
        resourceType: String
      }]
    }]
  },

  // Quiz results
  quizResults: [{
    learnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lectureId: mongoose.Schema.Types.ObjectId,
    answers: mongoose.Schema.Types.Mixed,
    score: Number,
    totalQuestions: Number,
    percentage: Number,
    passed: Boolean,
    submittedAt: { type: Date, default: Date.now }
  }],
  // Assignment submissions
  assignmentSubmissions: [{
    learnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lectureId: mongoose.Schema.Types.ObjectId,
    fileName: String,
    filePath: String,
    fileSize: Number,
    description: String,
    submittedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['submitted', 'graded', 'returned'], default: 'submitted' },
    grade: Number,
    feedback: String,
    gradedAt: Date,
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],

  enrolledAt: { type: Date, default: Date.now },
  lastAccessed: { type: Date, default: Date.now },
  averageRating: { 
    type: Number, 
    default: 0 
  },
  totalDuration: String,
  totalSections: {
    type: Number,
    default: 0
  },
  totalLectures: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Course Section Schema
const CourseSectionSchema = new mongoose.Schema({
  courseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'UdemyCourse', 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  description: {
    type: String,
    default: ''
  },
  order: { 
    type: Number, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Course Lecture Schema
const CourseLectureSchema = new mongoose.Schema({
  sectionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'CourseSection', 
    required: true 
  },
  courseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'UdemyCourse', 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['video', 'assignment', 'quiz', 'article', 'resource'],
    required: true
  },
  description: String,
  order: { 
    type: Number, 
    required: true 
  },
  duration: String, // Human-readable duration like "10:30"
  content: String, // For article/text content
  resources: [String], // Array of resource URLs
  isPreview: {
    type: Boolean,
    default: false
  },
  
  // Video-specific fields
  videoUrl: String,
  videoDuration: Number, // in seconds
  
  // Assignment-specific fields
  assignmentDescription: String,
  submissionType: { 
    type: String, 
    enum: ['code', 'document', 'video'],
    default: 'document'
  },
  evaluationInstructions: String,
  isRequired: { 
    type: Boolean, 
    default: true 
  },
  
  // Resource-specific fields
  resourceUrl: String,
  downloadable: { 
    type: Boolean, 
    default: true 
  },
  
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});



// Assignment Submission Schema
const AssignmentSubmissionSchema = new mongoose.Schema({
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  lectureId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'CourseLecture', 
    required: true 
  },
  courseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'UdemyCourse', 
    required: true 
  },
  fileUrl: String,
  fileName: String,
  fileSize: Number,
  submissionUrl: String,
  description: String,
  submittedAt: { 
    type: Date, 
    default: Date.now 
  },
  status: { 
    type: String, 
    enum: ['submitted', 'graded', 'returned', 'needs_revision', 'evaluated'],
    default: 'submitted'
  },
  feedback: String,
  grade: Number,
  score: Number,
  gradedAt: Date,
  gradedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  evaluatedAt: Date,
  evaluatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  }
});

// Quiz Question Schema
const QuizQuestionSchema = new mongoose.Schema({
  lectureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseLecture'
  },
  question: { type: String, required: true },
  type: { type: String, enum: ['multiple_choice', 'short_answer'], default: 'multiple_choice' },
  // for multiple choice questions
  choices: [{ type: String }],
  // index of correct choice (for MCQ). For short_answer, leave undefined
  correctIndex: { type: Number },
  // optional sample answer for short answer
  sampleAnswer: { type: String },
  marks: { type: Number, default: 1 }
});

// Quiz Schema (attached to a lecture)
const QuizSchema = new mongoose.Schema({
  lectureId: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseLecture', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'UdemyCourse', required: true },
  title: { type: String, default: 'Quiz' },
  description: String,
  questions: [QuizQuestionSchema],
  timeLimitMinutes: Number,
  passingScore: Number,
  createdAt: { type: Date, default: Date.now }
});

// Course Enrollment Schema
const CourseEnrollmentSchema = new mongoose.Schema({
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  courseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'UdemyCourse', 
    required: true 
  },
  enrolledAt: { 
    type: Date, 
    default: Date.now 
  },
  completedAt: Date,

  certificateIssued: { 
    type: Boolean, 
    default: false 
  }
});

// Course Bookmarks Schema
const CourseBookmarkSchema = new mongoose.Schema({
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  courseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'UdemyCourse', 
    required: true 
  },
  bookmarkedAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = {
  UdemyCourse: mongoose.model('UdemyCourse', UdemyCourseSchema),
  CourseSection: mongoose.model('CourseSection', CourseSectionSchema),
  CourseLecture: mongoose.model('CourseLecture', CourseLectureSchema),
  AssignmentSubmission: mongoose.model('AssignmentSubmission', AssignmentSubmissionSchema),
  CourseEnrollment: mongoose.model('CourseEnrollment', CourseEnrollmentSchema),
  CourseBookmark: mongoose.model('CourseBookmark', CourseBookmarkSchema)
  ,Quiz: mongoose.model('Quiz', QuizSchema)
  ,QuizQuestion: mongoose.model('QuizQuestion', QuizQuestionSchema)
};