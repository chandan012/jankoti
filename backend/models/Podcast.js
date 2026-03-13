const mongoose = require('mongoose');

const podcastSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  podcastName: {
    type: String,
    required: true,
    trim: true
  },
  guestName: {
    type: String,
    trim: true
  },
  aboutGuest: {
    type: String
  },
  ownerFirstName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true
  },
  contact: {
    type: String,
    trim: true
  },
  episodeLink: {
    type: String,
    trim: true
  },
  coverImageUrl: {
    type: String,
    trim: true,
    default: ''
  },
  coverImagePublicId: {
    type: String,
    default: ''
  },
  platform: {
    type: String,
    enum: ['spotify', 'apple-podcast', 'google-podcast', 'youtube', 'amazon-music', 'other'],
    default: 'other'
  },
  details: {
    type: String
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
    enum: ['openai', 'huggingface', 'template', null]
  }
});

podcastSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

podcastSchema.index({ title: 'text', description: 'text', podcastName: 'text', hostFirstName: 'text', guestName: 'text', aboutGuest: 'text' });

module.exports = mongoose.model('Podcast', podcastSchema);
