const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  dob: {
    type: Date,
    required: true,
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female', 'Other'],
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  mobileNo: {
    type: String, // Changed to String for handling leading zeros and large numbers
    trim: true,
    validate: {
      validator: function (v) {
        return /^\d{10}$/.test(v); // 10-digit mobile number validation
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

  // New fields for Token and Reward System
  tokenBalance: {
    type: Number,
    default: 0, // Users start with 0 tokens
  },
  transactionHistory: [{
    transactionType: { type: String, enum: ['earn', 'spend'], required: true }, // 'earn' for earned tokens, 'spend' for spent tokens
    amount: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
    description: { type: String }, // Optional field to describe the transaction
  }],
  
  // Optional: For advanced user profiling
  skills: [{
    type: String, // List of skills the user has
  }],
  
  // Optional: To track the rewards earned by the user
  rewards: [{
    type: String, // This could be reward names like "Certification", "Course Completion", etc.
    description: { type: String },
    dateEarned: { type: Date, default: Date.now },
  }],
  
});

const userModel = mongoose.model('UsersLogins', userSchema);

module.exports = userModel;
