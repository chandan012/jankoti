const mongoose = require('mongoose');

const freelancingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true
  },
  projectType: {
    type: String,
    enum: ['one-time', 'ongoing', 'hourly', 'fixed-price'],
    default: 'fixed-price'
  },
  skills: [{
    type: String
  }],
  projectScope: {
    type: String,
    enum: ['small', 'medium', 'large'],
    default: 'medium'
  },
  projectDuration: {
    type: String,
    trim: true
  },
  weeklyHours: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date
  },
  deliverables: {
    type: String
  },
  experience: {
    type: String,
    enum: ['entry', 'mid', 'senior', 'expert'],
    default: 'mid'
  },
  rate: {
    min: {
      type: Number
    },
    max: {
      type: Number
    },
    currency: {
      type: String,
      default: 'USD'
    },
    rateType: {
      type: String,
      enum: ['hourly', 'monthly', 'total'],
      default: 'hourly'
    }
  },
  location: {
    type: String,
    trim: true
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
  deadline: {
    type: Date
  },
  views: {
    type: Number,
    default: 0
  },
  applications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  imageUrl: {
    type: String,
    default: ''
  },
  imagePublicId: {
    type: String,
    default: ''
  },
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

freelancingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

freelancingSchema.index({ title: 'text', description: 'text', companyName: 'text', skills: 'text' });

module.exports = mongoose.model('Freelancing', freelancingSchema);
