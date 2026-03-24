const mongoose = require('mongoose');

const classifiedEmailOtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  codeHash: {
    type: String
  },
  expiresAt: {
    type: Date
  },
  attempts: {
    type: Number,
    default: 0
  },
  lastSentAt: {
    type: Date
  },
  verifiedAt: {
    type: Date
  },
  verifiedUntil: {
    type: Date
  }
});

module.exports = mongoose.model('ClassifiedEmailOtp', classifiedEmailOtpSchema);
