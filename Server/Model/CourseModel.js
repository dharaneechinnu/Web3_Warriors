const mongoose = require('mongoose');

// Question Schema for Quiz
const QuestionSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
    question: { type: String, required: true },
    type: {
        type: String,
        enum: ['single_correct', 'multiple_correct', 'short_answer'],
        required: true,
        default: 'single_correct'
    },
    choices: [{ type: String }],
    correctIndex: { type: Number },
    correctIndices: [{ type: Number }],
    marks: { type: Number, default: 1, min: 0 },
    sampleAnswer: { type: String },
    explanation: { type: String, default: '' }
}, { _id: false });

// Quiz Schema
const QuizSchema = new mongoose.Schema({
    title: { type: String, default: 'Quiz' },
    description: { type: String, default: '' },
    timeLimitMinutes: { type: Number, default: 30, min: 1, max: 300 },
    passingScore: { type: Number, default: 70, min: 0, max: 100 },
    attemptsAllowed: { type: Number, default: 3, min: -1 }, // -1 means unlimited
    tokenReward: { type: Number, default: 5, min: 0 },
    shuffleQuestions: { type: Boolean, default: false },
    showCorrectAnswers: { type: Boolean, default: true },
    questions: [QuestionSchema]
}, { _id: false });

// Assignment Schema
const AssignmentSchema = new mongoose.Schema({
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    instructions: { type: String, default: '' },
    submissionType: { type: String, enum: ['file', 'text', 'both', 'link'], default: 'file' },
    maxFileSize: { type: String, default: '10MB' },
    maxScore: { type: Number, default: 100, min: 0 },
    dueDate: { type: Date },
    allowedFileTypes: { type: [String], default: ['pdf', 'doc', 'docx', 'txt', 'zip', 'rar', 'js', 'py', 'java'] },
    rubric: { type: String, default: '' }
}, { _id: false });

// Article Schema
const ArticleSchema = new mongoose.Schema({
    content: { type: String, default: '' },
    contentType: { type: String, enum: ['html', 'markdown', 'text'], default: 'html' },
    readingTime: { type: String, default: '5 min' },
    wordCount: { type: Number, default: 0 },
    summary: { type: String, default: '' }
}, { _id: false });

// Video Schema
const VideoSchema = new mongoose.Schema({
    videoUrl: { type: String, default: '' },
    duration: { type: String, default: '' },
    durationSeconds: { type: Number, default: 0 },
    fileName: { type: String, default: '' },
    fileSize: { type: Number, default: 0 },
    thumbnail: { type: String, default: '' },
    transcript: { type: String, default: '' }
}, { _id: false });

// Resource Schema
const ResourceSchema = new mongoose.Schema({
    name: { type: String, default: '' },
    type: { type: String, enum: ['file', 'link', 'code'], default: 'file' },
    url: { type: String, default: '' },
    size: { type: Number, default: 0 },
    description: { type: String, default: '' }
}, { _id: false });

// Lecture Schema - Unified structure for all content types
const LectureSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
    order: { type: Number, required: true },
    title: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['video', 'quiz', 'assignment', 'article'], 
        required: true 
    },
    description: { type: String, default: '' },
    isPreview: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
    
    // Content based on type - NEW structured approach
    video: VideoSchema,
    quiz: QuizSchema,
    assignment: AssignmentSchema,
    article: ArticleSchema,
    
    // Legacy fields for backward compatibility
    duration: { type: String },
    videoUrl: { type: String },
    fileName: { type: String },
    fileSize: { type: Number },
    content: { type: String },
    readingTime: { type: String, default: '5 min' },
    
    // Resources attached to any lecture type
    resources: [ResourceSchema],
    
    // Metadata
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { _id: false });

// Section Schema
const SectionSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
    order: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    isPublished: { type: Boolean, default: true },
    lectures: [LectureSchema],
    
    // Computed stats
    totalDuration: { type: String, default: '' },
    lectureCount: { type: Number, default: 0 }
}, { _id: false });

// Main Course Schema
const CourseSchema = new mongoose.Schema({
    // Mentor Information
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: "UsersLogins", required: true },
    mentorName: { type: String, required: true },
    mentorEmail: { type: String, required: true },
    
    // Basic Course Information
    title: { type: String, required: true },
    description: { type: String, required: true },
    shortDescription: { type: String, default: '' },
    
    // Pricing
    price: { type: Number, default: 0 },
    currency: { type: String, default: 'tokens' },
    
    // Course Details
    duration: { type: String, default: '1 hour' },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    category: { type: String, required: true },
    subcategory: { type: String, default: '' },
    language: { type: String, default: 'english' },
    
    // Learning Outcomes
    learningOutcomes: { type: String },
    requirements: [{ type: String }],
    targetAudience: [{ type: String }],
    
    // Media
    image: { type: String },
    thumbnail: { type: String },
    video: { type: String },
    promoVideo: { type: String },
    
    // Curriculum - The main content structure
    curriculum: {
        sections: [SectionSchema],
        lastUpdated: { type: Date, default: Date.now }
    },
    
    // Course Statistics (computed on save)
    stats: {
        totalSections: { type: Number, default: 0 },
        totalLectures: { type: Number, default: 0 },
        totalVideos: { type: Number, default: 0 },
        totalQuizzes: { type: Number, default: 0 },
        totalAssignments: { type: Number, default: 0 },
        totalArticles: { type: Number, default: 0 },
        totalDuration: { type: String, default: '0 min' },
        totalQuestions: { type: Number, default: 0 }
    },
    
    // Status
    isActive: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },
    
    // Enrollment
    enrolledLearners: [{ type: mongoose.Schema.Types.ObjectId, ref: "UsersLogins" }],
    enrollmentCount: { type: Number, default: 0 },
    
    // Ratings
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Pre-save middleware to automatically update statistics
CourseSchema.pre('save', function(next) {
    if (this.curriculum && this.curriculum.sections) {
        let totalLectures = 0;
        let totalVideos = 0;
        let totalQuizzes = 0;
        let totalAssignments = 0;
        let totalArticles = 0;
        let totalQuestions = 0;
        
        this.curriculum.sections.forEach(section => {
            if (section.lectures) {
                section.lectureCount = section.lectures.length;
                totalLectures += section.lectures.length;
                
                section.lectures.forEach(lecture => {
                    switch (lecture.type) {
                        case 'video':
                            totalVideos++;
                            break;
                        case 'quiz':
                            totalQuizzes++;
                            if (lecture.quiz && lecture.quiz.questions) {
                                totalQuestions += lecture.quiz.questions.length;
                            }
                            break;
                        case 'assignment':
                            totalAssignments++;
                            break;
                        case 'article':
                            totalArticles++;
                            break;
                    }
                });
            }
        });
        
        this.stats = {
            totalSections: this.curriculum.sections.length,
            totalLectures,
            totalVideos,
            totalQuizzes,
            totalAssignments,
            totalArticles,
            totalQuestions,
            totalDuration: this.duration || '0 min'
        };
        
        this.curriculum.lastUpdated = new Date();
    }
    
    this.updatedAt = new Date();
    next();
});

// Index for efficient queries
CourseSchema.index({ mentorId: 1 });
CourseSchema.index({ category: 1 });
CourseSchema.index({ isActive: 1, isPublished: 1 });
CourseSchema.index({ enrolledLearners: 1 });

module.exports = mongoose.model("OriginalCourse", CourseSchema);
