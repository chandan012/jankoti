const express = require('express');
const router = express.Router();
const Classified = require('../models/Classified');
const { auth, requireOrganization } = require('../middleware/auth');
const { createImageUpload, deleteImage } = require('../config/cloudinary');
const { parseNumber } = require('../utils/requestParser');

const uploadClassifiedImage = createImageUpload('classified');

// Get all classified postings
router.get('/', async (req, res) => {
  try {
    const { status = 'active', page = 1, limit = 10, search, minPrice, maxPrice } = req.query;
    
    const query = { status };
    if (search) query.$text = { $search: search };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    const classifieds = await Classified.find(query)
      .populate('postedBy', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
      
    const total = await Classified.countDocuments(query);
    
    res.json({
      classifieds,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user's own classified postings
router.get('/my-classifieds', auth, requireOrganization, async (req, res) => {
  try {
    const filter = req.isAdmin ? {} : { postedBy: req.userId };
    const classifieds = await Classified.find(filter)
      .populate('postedBy', 'name email profilePicture')
      .sort({ createdAt: -1 });
    
    res.json({ classifieds });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single classified by ID
router.get('/:id', async (req, res) => {
  try {
    const classified = await Classified.findById(req.params.id)
      .populate('postedBy', 'name email profilePicture');
    
    if (!classified) {
      return res.status(404).json({ message: 'Classified posting not found' });
    }
    
    // Increment views
    classified.views += 1;
    await classified.save();
    
    res.json({ classified });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Classified posting not found' });
    }
    res.status(500).json({ message: err.message });
  }
});

// Create new classified posting
router.post('/', auth, requireOrganization, uploadClassifiedImage, async (req, res) => {
  try {
    const classified = new Classified({
      ...req.body,
      price: parseNumber(req.body.price),
      imageUrl: req.file?.path || req.body.imageUrl || '',
      imagePublicId: req.file?.filename || '',
      postedBy: req.userId
    });
    
    const savedClassified = await classified.save();
    
    res.status(201).json({
      message: 'Classified posting created successfully',
      classified: savedClassified
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update classified posting
router.put('/:id', auth, requireOrganization, uploadClassifiedImage, async (req, res) => {
  try {
    const classified = await Classified.findById(req.params.id);
    
    if (!classified) {
      return res.status(404).json({ message: 'Classified posting not found' });
    }
    
    // Check ownership
    if (!req.isAdmin && classified.postedBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to update this posting' });
    }
    
    const updateData = { ...req.body, updatedAt: Date.now() };
    if (typeof req.body.price !== 'undefined') {
      updateData.price = parseNumber(req.body.price);
    }

    const oldImagePublicId = req.file ? classified.imagePublicId : null;
    if (req.file) {
      updateData.imageUrl = req.file.path;
      updateData.imagePublicId = req.file.filename;
    }

    const updatedClassified = await Classified.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (oldImagePublicId) {
      await deleteImage(oldImagePublicId);
    }
    
    res.json({
      message: 'Classified posting updated successfully',
      classified: updatedClassified
    });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Classified posting not found' });
    }
    res.status(400).json({ message: err.message });
  }
});

// Delete classified posting
router.delete('/:id', auth, requireOrganization, async (req, res) => {
  try {
    const classified = await Classified.findById(req.params.id);
    
    if (!classified) {
      return res.status(404).json({ message: 'Classified posting not found' });
    }
    
    // Check ownership
    if (!req.isAdmin && classified.postedBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this posting' });
    }
    
    await Classified.findByIdAndDelete(req.params.id);
    if (classified.imagePublicId) {
      await deleteImage(classified.imagePublicId);
    }
    
    res.json({ message: 'Classified posting deleted successfully' });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Classified posting not found' });
    }
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
