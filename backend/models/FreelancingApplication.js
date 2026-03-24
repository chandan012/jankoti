const mongoose = require('mongoose');

const freelancingApplicationSchema = new mongoose.Schema({
  freelancing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Freelancing',
    required: true
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fullName: {
    type: String,
    trim: true
  },
  contactEmail: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  linkedinUrl: {
    type: String,
    trim: true
  },
  proposedBudget: {
    type: String,
    trim: true
  },
  proposedTimeline: {
    type: String,
    trim: true
  },
  skills: [{
    type: String
  }],
  portfolioUrl: {
    type: String,
    trim: true
  },
  githubUrl: {
    type: String,
    trim: true
  },
  appliedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('FreelancingApplication', freelancingApplicationSchema);
