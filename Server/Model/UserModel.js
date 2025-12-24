const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    
    trim: true,
  },
  email: {
    type: String,
 
    unique: true,
    lowercase: true,
    trim: true,
  },
  UserWalletAddress: {
    type: String,
    default:null
  },
  dob: {
    type: Date,
   
  },
  gender: {
    type: String,
   
    enum: ['male', 'female', 'Other'],
  },
  password: {
    type: String,
  
    minlength: 6,
  },
  mobileNo: {
    type: String,
    trim: true,
    validate: {
      validator: function (v) {
        return /^\d{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid mobile number!`,
    },
  },
  otpToken: {
    type: String,
    default: null,
  },
  otpExpire: {
    type: Date,
    default: null,
  },
  resetPwdToken: {
    type: String,
    default: null,
  },
  resetPwdExpire: {
    type: Date,
    default: null,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  coursesEnrolled: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
  tokenBalance: {
    type: Number,
    default: 0,
  },
  transactionHistory: [{
    transactionType: { type: String, enum: ['earn', 'spend'], required: true },
    amount: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
    description: { type: String },
  }],
  lectureProgress: [{
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    lectureId: { type: String, required: true },
    sectionId: { type: String, required: true },
    completed: { type: Boolean, default: false },
    progress: { type: Number, default: 0 }, // percentage 0-100 for lecture completion
    videoProgress: { type: Number, default: 0 }, // percentage 0-100 for video watched
    watchTime: { type: Number, default: 0 }, // seconds watched
    totalDuration: { type: Number, default: 0 }, // total video duration in seconds
    lastAccessed: { type: Date, default: Date.now }
  }],
  skills: [{
    type: String,
  }],
  coursesCompleted: { type: Number, default: 0 },
  coursesTaught: { type: Number, default: 0 },
  bio: { type: String, default: null },
  experience: { type: String, default: null },
  portfolio: { type: String, default: null },
  education: [{
    institution: { type: String, required: true },
    degree: { type: String, required: true },
    field: { type: String, required: true },
    startYear: { type: Number, required: true },
    endYear: { type: Number, required: true },
    description: { type: String, default: null }
  }],
  linkedin:{type:String,default:null},
  github:{type:String,default:null},
  rewards: [{
    type: String,
    description: { type: String },
    dateEarned: { type: Date, default: Date.now },
  }],

  ratings: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'UsersLogins' },
    userEmail: { type: String },
    rating: { type: Number, min: 1, max: 5, required: true }, 
    review: { type: String, trim: true }, 
    category: { type: String, enum: ['mentorship', 'course'], default: 'mentorship' },
    date: { type: Date, default: Date.now },
  }],
  averageRating: { type: Number, default: 0 },
  role: { type: String, enum: ['learner', 'mentor', 'admin', 'user'], default: 'learner' },
});



const userModel = mongoose.model('UsersLogins', userSchema);

module.exports = userModel;
