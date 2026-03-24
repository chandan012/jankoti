const mongoose = require('mongoose');

const startupSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  startupName: {
    type: String,
    required: true,
    trim: true
  },
  founderName: {
    type: String,
    trim: true,
    required: true
  },
  coFounderName: {
    type: String,
    trim: true
  },
  coFounderImageUrl: {
    type: String,
    trim: true
  },
  founderImageUrl: {
    type: String,
    trim: true
  },
  founderImagePublicId: {
    type: String,
    default: ''
  },
  coFounderImagePublicId: {
    type: String,
    default: ''
  },
  logoUrl: {
    type: String,
    trim: true
  },
  logoPublicId: {
    type: String,
    default: ''
  },
  aboutStartup: {
    type: String
  },
  companyName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true
  },
  contactNumber: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    required: true,
    trim: true
  },
  fundingStage: {
    type: String,
    enum: ['pre-seed', 'seed', 'series-a', 'series-b', 'profitable', 'bootstrapped'],
    default: 'bootstrapped'
  },
  teamSize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '500+'],
    default: '1-10'
  },
  website: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  equity: {
    type: String,
    trim: true
  },
  socialLinks: {
    website: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    twitter: { type: String, trim: true },
    instagram: { type: String, trim: true },
    facebook: { type: String, trim: true }
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'draft'],
    default: 'active'
  },
  views: {
    type: Number,
    default: 0
  },
  applications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  aiBannerUrl: {
    type: String,
    default: null
  },
  bannerPrompt: {
    type: String,
    default: null
  },
  bannerGeneratedAt: {
    type: Date,
    default: null
  },
  aiProvider: {
    type: String,
    default: null,
    enum: ['openai', 'huggingface', null]
  }
});

startupSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

startupSchema.index({ title: 'text', description: 'text', aboutStartup: 'text', startupName: 'text', industry: 'text', founderName: 'text', coFounderName: 'text' });

module.exports = mongoose.model('Startup', startupSchema);
