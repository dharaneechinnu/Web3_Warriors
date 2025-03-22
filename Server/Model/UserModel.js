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
  skills: [{
    type: String,
  }],
  coursesCompleted: { type: Number, default: 0 },
  coursesTaught: { type: Number, default: 0 },
  rewards: [{
    type: String,
    description: { type: String },
    dateEarned: { type: Date, default: Date.now },
  }],

  ratings: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'UsersLogins' },
    rating: { type: Number, min: 1, max: 5, required: true }, 
    review: { type: String, trim: true }, 
    date: { type: Date, default: Date.now },
  }],
  averageRating: { type: Number, default: 0 },
});



const userModel = mongoose.model('UsersLogins', userSchema);

module.exports = userModel;
