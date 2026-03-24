const mongoose = require('mongoose');

const classifiedSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true
  },
  imagePublicId: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  condition: {
    type: String,
    enum: ['new', 'like-new', 'good', 'fair', 'poor'],
    default: 'good'
  },
  location: {
    type: String,
    trim: true
  },
  sellerName: {
    type: String,
    trim: true,
    required: true
  },
  sellerEmail: {
    type: String,
    trim: true,
    required: true
  },
  sellerContact: {
    type: String,
    trim: true,
    required: true
  },
  verification: {
    email: {
      status: {
        type: String,
        enum: ['unverified', 'pending', 'verified'],
        default: 'unverified'
      },
      verifiedAt: { type: Date }
    },
    phone: {
      status: {
        type: String,
        enum: ['unverified', 'pending', 'verified'],
        default: 'unverified'
      },
      verifiedAt: { type: Date }
    }
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'draft', 'sold'],
    default: 'active'
  },
  views: {
    type: Number,
    default: 0
  },
  inquiries: [{
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

classifiedSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

classifiedSchema.index({ title: 'text', description: 'text', itemName: 'text' });

module.exports = mongoose.model('Classified', classifiedSchema);
