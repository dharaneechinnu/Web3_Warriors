const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mentorName: { type: String, required: true },
    mentorEmail: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, default: 0 },
    duration: { type: String, default: '1 hour' },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    category: { type: String, required: true },
    language: { type: String, default: 'english' },
    learningOutcomes: { type: String },
    image: { type: String },
    thumbnail: { type: String },
    video: { type: String },
    curriculum: {
        sections: [{
            order: { type: Number, required: true },
            title: { type: String, required: true },
            description: { type: String, default: '' },
            lectures: [{
                order: { type: Number, required: true },
                title: { type: String, required: true },
                type: { 
                    type: String, 
                    enum: ['video', 'quiz', 'assignment', 'article'], 
                    required: true 
                },
                duration: { type: String },
                videoUrl: { type: String },
                fileName: { type: String },
                fileSize: { type: Number },
                content: { type: String },
                resources: [{ type: String }],
                quiz: {
                    title: String,
                    description: String,
                    timeLimitMinutes: Number,
                    passingScore: Number,
                    attemptsAllowed: mongoose.Schema.Types.Mixed,
                    tokenReward: Number,
                    questions: [{
                        question: String,
                        type: {
                            type: String,
                            enum: ['single_correct', 'multiple_correct', 'short_answer']
                        },
                        choices: [String],
                        correctIndex: Number,
                        correctIndices: [Number],
                        marks: Number,
                        sampleAnswer: String
                    }]
                },
                assignment: {
                    submissionType: String,
                    maxFileSize: String,
                    maxScore: Number,
                    description: String,
                    instructions: String
                }
            }]
        }]
    },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    enrolledLearners: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    progress: [{
        courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
        progress: { type: Number, default: 0 } ,
        completed: { type: Boolean, default: false } // Mark if the course is completed
    }],
});

module.exports = mongoose.model("OriginalCourse", CourseSchema);
