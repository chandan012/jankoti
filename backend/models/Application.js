const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'interviewed', 'accepted', 'rejected'],
    default: 'pending'
  },
  coverLetter: {
    type: String
  },
  resumeUrl: {
    type: String
  },
  portfolioUrl: {
    type: String
  },
  profileUrl: {
    type: String
  },
  expectedSalary: {
    type: Number
  },
  availableFrom: {
    type: Date
  },
  notes: {
    type: String
  },
  employerNotes: {
    type: String
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
applicationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Application', applicationSchema);
