const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Classified = require('../models/Classified');
const ClassifiedEmailOtp = require('../models/ClassifiedEmailOtp');
const { auth, requireOrganization } = require('../middleware/auth');
const { createImageUpload, deleteImage } = require('../config/cloudinary');
const { parseNumber } = require('../utils/requestParser');
const { sendClassifiedOtpEmail } = require('../services/emailService');

const uploadClassifiedImage = createImageUpload('classified');

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
const hashOtp = (otp) => crypto.createHash('sha256').update(String(otp)).digest('hex');
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_VERIFY_WINDOW_MS = 30 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

// Send OTP for classified email verification
router.post('/email-otp', auth, requireOrganization, async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email || req.user?.email);
    const userEmail = normalizeEmail(req.user?.email);

    if (!email) {
      return res.status(400).json({ message: 'Email is required for OTP verification.' });
    }
    if (userEmail && email !== userEmail) {
      return res.status(400).json({ message: 'Email must match your logged-in Gmail account.' });
    }

    const existing = await ClassifiedEmailOtp.findOne({ email });
    if (existing?.lastSentAt && Date.now() - new Date(existing.lastSentAt).getTime() < OTP_RESEND_COOLDOWN_MS) {
      return res.status(429).json({ message: 'Please wait before requesting another OTP.' });
    }

    const otp = generateOtp();
    const codeHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);
    const lastSentAt = new Date();

    await ClassifiedEmailOtp.findOneAndUpdate(
      { email },
      { codeHash, expiresAt, attempts: 0, lastSentAt },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendClassifiedOtpEmail({ to: email, code: otp });

    return res.json({ message: 'OTP sent to your email.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to send OTP.', error: error.message });
  }
});

// Verify OTP for classified email verification
router.post('/email-otp/verify', auth, requireOrganization, async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email || req.user?.email);
    const userEmail = normalizeEmail(req.user?.email);
    const otp = String(req.body.otp || '').trim();

    if (!email) {
      return res.status(400).json({ message: 'Email is required for OTP verification.' });
    }
    if (userEmail && email !== userEmail) {
      return res.status(400).json({ message: 'Email must match your logged-in Gmail account.' });
    }
    if (!otp) {
      return res.status(400).json({ message: 'OTP is required.' });
    }

    const record = await ClassifiedEmailOtp.findOne({ email });
    if (!record || !record.codeHash) {
      return res.status(400).json({ message: 'OTP not found. Please request a new OTP.' });
    }
    if (record.expiresAt && record.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    const providedHash = hashOtp(otp);
    if (providedHash !== record.codeHash) {
      record.attempts = (record.attempts || 0) + 1;
      await record.save();
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    record.verifiedAt = new Date();
    record.verifiedUntil = new Date(Date.now() + OTP_VERIFY_WINDOW_MS);
    record.codeHash = null;
    record.expiresAt = null;
    record.attempts = 0;
    await record.save();

    return res.json({ verified: true, verifiedUntil: record.verifiedUntil });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to verify OTP.', error: error.message });
  }
});

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
    const sellerName = (req.body.sellerName || '').trim();
    const sellerEmail = (req.body.sellerEmail || req.user?.email || '').trim();
    const sellerContactRaw = (req.body.sellerContact || '').trim();
    const sellerContact = sellerContactRaw.replace(/\D/g, '');
    const parsedPrice = parseNumber(req.body.price);

    if (!Number.isFinite(parsedPrice)) {
      return res.status(400).json({ message: 'Price is required.' });
    }

    if (!sellerName) {
      return res.status(400).json({ message: 'Seller name is required.' });
    }

    if (!sellerEmail) {
      return res.status(400).json({ message: 'Seller email is required.' });
    }

    if (!/^\d{10}$/.test(sellerContact)) {
      return res.status(400).json({ message: 'Mobile number must be 10 digits.' });
    }

    const verificationRecord = await ClassifiedEmailOtp.findOne({
      email: normalizeEmail(sellerEmail),
      verifiedUntil: { $gt: new Date() }
    });
    if (!verificationRecord) {
      return res.status(400).json({ message: 'Please verify your email with OTP before posting.' });
    }

    const classified = new Classified({
      ...req.body,
      price: parsedPrice,
      sellerName,
      sellerEmail,
      sellerContact,
      imageUrl: req.file?.path || req.body.imageUrl || '',
      imagePublicId: req.file?.filename || '',
      postedBy: req.userId,
      verification: {
        email: { status: 'verified', verifiedAt: verificationRecord.verifiedAt || new Date() },
        phone: { status: 'unverified' }
      }
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
      const parsedPrice = parseNumber(req.body.price);
      if (!Number.isFinite(parsedPrice)) {
        return res.status(400).json({ message: 'Price is required.' });
      }
      updateData.price = parsedPrice;
    }

    if (typeof req.body.sellerName !== 'undefined') {
      const sellerName = String(req.body.sellerName || '').trim();
      if (!sellerName) {
        return res.status(400).json({ message: 'Seller name is required.' });
      }
      updateData.sellerName = sellerName;
    }

    if (typeof req.body.sellerEmail !== 'undefined') {
      const sellerEmail = String(req.body.sellerEmail || '').trim();
      if (!sellerEmail) {
        return res.status(400).json({ message: 'Seller email is required.' });
      }
      updateData.sellerEmail = sellerEmail;
    }

    if (typeof req.body.sellerContact !== 'undefined') {
      const sellerContact = String(req.body.sellerContact || '').trim().replace(/\D/g, '');
      if (!/^\d{10}$/.test(sellerContact)) {
        return res.status(400).json({ message: 'Mobile number must be 10 digits.' });
      }
      updateData.sellerContact = sellerContact;
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
