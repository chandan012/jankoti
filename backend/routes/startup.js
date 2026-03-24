const express = require('express');
const router = express.Router();
const Startup = require('../models/Startup');
const { auth, requireOrganization } = require('../middleware/auth');
const { createMultiImageUpload, deleteImage } = require('../config/cloudinary');
const { parseJson } = require('../utils/requestParser');

const uploadStartupImages = createMultiImageUpload('startups', [
  { name: 'logo', maxCount: 1 },
  { name: 'founderImage', maxCount: 1 },
  { name: 'coFounderImage', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]);

// Get all startup postings
router.get('/', async (req, res) => {
  try {
    const { status = 'active', page = 1, limit = 10, search } = req.query;
    
    const query = { status };
    if (search) {
      query.$text = { $search: search };
    }
    
    const startups = await Startup.find(query)
      .populate('postedBy', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
      
    const total = await Startup.countDocuments(query);
    
    res.json({
      startups,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user's own startup postings
router.get('/my-startups', auth, requireOrganization, async (req, res) => {
  try {
    const filter = req.isAdmin ? {} : { postedBy: req.userId };
    const startups = await Startup.find(filter)
      .populate('postedBy', 'name email profilePicture')
      .sort({ createdAt: -1 });
    
    res.json({ startups });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single startup by ID
router.get('/:id', async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id)
      .populate('postedBy', 'name email profilePicture company');
    
    if (!startup) {
      return res.status(404).json({ message: 'Startup posting not found' });
    }
    
    // Increment views
    startup.views += 1;
    await startup.save();
    
    res.json({ startup });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Startup posting not found' });
    }
    res.status(500).json({ message: err.message });
  }
});

// Create new startup posting
router.post('/', auth, requireOrganization, uploadStartupImages, async (req, res) => {
  try {
    const founderName = (req.body.founderName || '').trim();
    const contactNumberRaw = (req.body.contactNumber || '').trim();
    const contactNumber = contactNumberRaw.replace(/\D/g, '');

    if (!founderName) {
      return res.status(400).json({ message: 'Founder name is required.' });
    }

    if (!/^\d{10}$/.test(contactNumber)) {
      return res.status(400).json({ message: 'Contact number must be 10 digits.' });
    }

    const normalizedSocialLinks = parseJson(req.body.socialLinks);
    const logoFile = req.files?.logo?.[0] || req.files?.image?.[0];
    const founderFile = req.files?.founderImage?.[0];
    const coFounderFile = req.files?.coFounderImage?.[0];
    const startup = new Startup({
      ...req.body,
      founderName,
      contactNumber,
      logoUrl: logoFile?.path || req.body.logoUrl || '',
      logoPublicId: logoFile?.filename || '',
      founderImageUrl: founderFile?.path || req.body.founderImageUrl || '',
      founderImagePublicId: founderFile?.filename || '',
      coFounderImageUrl: coFounderFile?.path || req.body.coFounderImageUrl || '',
      coFounderImagePublicId: coFounderFile?.filename || '',
      socialLinks: normalizedSocialLinks && typeof normalizedSocialLinks === 'object'
        ? normalizedSocialLinks
        : req.body.socialLinks,
      postedBy: req.userId
    });
    
    const savedStartup = await startup.save();
    
    res.status(201).json({
      message: 'Startup posting created successfully',
      startup: savedStartup
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update startup posting
router.put('/:id', auth, requireOrganization, uploadStartupImages, async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id);
    
    if (!startup) {
      return res.status(404).json({ message: 'Startup posting not found' });
    }
    
    // Check ownership
    if (!req.isAdmin && startup.postedBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to update this posting' });
    }
    
    const updateData = { ...req.body, updatedAt: Date.now() };

    if (typeof req.body.founderName !== 'undefined') {
      const founderName = String(req.body.founderName || '').trim();
      if (!founderName) {
        return res.status(400).json({ message: 'Founder name is required.' });
      }
      updateData.founderName = founderName;
    }

    if (typeof req.body.contactNumber !== 'undefined') {
      const normalizedContact = String(req.body.contactNumber || '').trim().replace(/\D/g, '');
      if (!/^\d{10}$/.test(normalizedContact)) {
        return res.status(400).json({ message: 'Contact number must be 10 digits.' });
      }
      updateData.contactNumber = normalizedContact;
    }

    if (typeof req.body.socialLinks !== 'undefined') {
      const normalizedSocialLinks = parseJson(req.body.socialLinks);
      if (normalizedSocialLinks && typeof normalizedSocialLinks === 'object') {
        updateData.socialLinks = normalizedSocialLinks;
      }
    }

    const logoFile = req.files?.logo?.[0] || req.files?.image?.[0];
    const founderFile = req.files?.founderImage?.[0];
    const coFounderFile = req.files?.coFounderImage?.[0];

    const oldLogoPublicId = logoFile ? startup.logoPublicId : null;
    if (logoFile) {
      updateData.logoUrl = logoFile.path;
      updateData.logoPublicId = logoFile.filename;
    }

    const oldFounderPublicId = founderFile ? startup.founderImagePublicId : null;
    if (founderFile) {
      updateData.founderImageUrl = founderFile.path;
      updateData.founderImagePublicId = founderFile.filename;
    }

    const oldCoFounderPublicId = coFounderFile ? startup.coFounderImagePublicId : null;
    if (coFounderFile) {
      updateData.coFounderImageUrl = coFounderFile.path;
      updateData.coFounderImagePublicId = coFounderFile.filename;
    }

    const updatedStartup = await Startup.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (oldLogoPublicId) {
      await deleteImage(oldLogoPublicId);
    }
    if (oldFounderPublicId) {
      await deleteImage(oldFounderPublicId);
    }
    if (oldCoFounderPublicId) {
      await deleteImage(oldCoFounderPublicId);
    }
    
    res.json({
      message: 'Startup posting updated successfully',
      startup: updatedStartup
    });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Startup posting not found' });
    }
    res.status(400).json({ message: err.message });
  }
});

// Delete startup posting
router.delete('/:id', auth, requireOrganization, async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id);
    
    if (!startup) {
      return res.status(404).json({ message: 'Startup posting not found' });
    }
    
    // Check ownership
    if (!req.isAdmin && startup.postedBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this posting' });
    }
    
    await Startup.findByIdAndDelete(req.params.id);
    if (startup.logoPublicId) {
      await deleteImage(startup.logoPublicId);
    }
    if (startup.founderImagePublicId) {
      await deleteImage(startup.founderImagePublicId);
    }
    if (startup.coFounderImagePublicId) {
      await deleteImage(startup.coFounderImagePublicId);
    }
    
    res.json({ message: 'Startup posting deleted successfully' });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Startup posting not found' });
    }
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
