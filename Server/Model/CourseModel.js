const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    thumbnail: { type: String, required: true },
    video: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    enrolledLearners: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    progress: [{
        courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
        progress: { type: Number, default: 0 }  // 0-100% progress
    }],
});

module.exports = mongoose.model("Course", CourseSchema);
