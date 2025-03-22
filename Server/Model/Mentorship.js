const mongoose = require('mongoose');

const MentorshipSchema = new mongoose.Schema({
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    token:{type:Number,required:true}
});

module.exports = mongoose.model("Mentorship", MentorshipSchema);
