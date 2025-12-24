const mongoose = require('mongoose');

const certificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UsersLogins',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  courseName: {
    type: String,
    required: true
  },
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UsersLogins',
    required: true
  },
  mentorName: {
    type: String,
    required: true
  },
  completedDate: {
    type: Date,
    default: Date.now
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'Pass'],
    default: 'Pass'
  },
  certificateId: {
    type: String,
    unique: true
  }
}, {
  timestamps: true
});

// Generate unique certificate ID before saving
certificationSchema.pre('save', function(next) {
  if (!this.certificateId) {
    this.certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

const CertificationModel = mongoose.model('Certification', certificationSchema);

module.exports = CertificationModel;