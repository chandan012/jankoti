const express = require('express');
const router = express.Router();
const Freelancing = require('../models/Freelancing');
const { auth, optionalAuth, requireOrganization, requireCandidate } = require('../middleware/auth');
const { sendFreelancingContactEmail, sendCandidateWelcomeEmail } = require('../services/emailService');
const { createImageUpload, deleteImage } = require('../config/cloudinary');
const { parseArray, parseJson, parseDate } = require('../utils/requestParser');

const uploadFreelancingImage = createImageUpload('freelancing');

// Get all freelancing postings
router.get('/', async (req, res) => {
  try {
    const { status = 'active', page = 1, limit = 10, search } = req.query;
    
    const query = { status };
    if (search) {
      query.$text = { $search: search };
    }
    
    const freelancing = await Freelancing.find(query)
      .populate('postedBy', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
      
    const total = await Freelancing.countDocuments(query);
    
    res.json({
      freelancing,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user's own freelancing postings
router.get('/my-freelancing', auth, requireOrganization, async (req, res) => {
  try {
    const filter = req.isAdmin ? {} : { postedBy: req.userId };
    const freelancing = await Freelancing.find(filter)
      .populate('postedBy', 'name email profilePicture')
      .sort({ createdAt: -1 });
    
    res.json({ freelancing });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single freelancing by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const freelancing = await Freelancing.findById(req.params.id)
      .populate('postedBy', 'name email profilePicture company');
    
    if (!freelancing) {
      return res.status(404).json({ message: 'Freelancing posting not found' });
    }
    
    // Increment views
    freelancing.views += 1;
    await freelancing.save();
    
    const hasApplied = Boolean(
      req.userId &&
      req.userRole === 'candidate' &&
      freelancing.applications?.some((applicantId) => applicantId.toString() === req.userId)
    );

    const freelancingData = freelancing.toObject();
    delete freelancingData.applications;

    res.json({ freelancing: { ...freelancingData, hasApplied } });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Freelancing posting not found' });
    }
    res.status(500).json({ message: err.message });
  }
});

// Get applications for a freelancing post
router.get('/:id/applications', auth, requireOrganization, async (req, res) => {
  try {
    const freelancing = await Freelancing.findById(req.params.id)
      .populate('applications', 'name email profilePicture');

    if (!freelancing) {
      return res.status(404).json({ message: 'Freelancing posting not found' });
    }

    if (!req.isAdmin && freelancing.postedBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ applications: freelancing.applications || [] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Contact freelancing poster (candidate only)
router.post('/:id/contact', auth, requireCandidate, async (req, res) => {
  try {
    const {
      fullName,
      contactEmail,
      phone,
      skills,
      portfolioUrl,
      linkedinUrl,
      githubUrl,
      proposedBudget,
      proposedTimeline
    } = req.body;
    const freelancing = await Freelancing.findById(req.params.id)
      .populate('postedBy', 'name email');

    if (!freelancing) {
      return res.status(404).json({ message: 'Freelancing posting not found' });
    }

    if (freelancing.applications?.some((applicantId) => applicantId.toString() === req.userId)) {
      return res.status(400).json({ message: 'You have already applied for this freelancing opportunity' });
    }

    const trimmedName = (fullName || '').trim();
    const trimmedEmail = (contactEmail || '').trim();
    const trimmedPhone = (phone || '').trim();
    const trimmedLinkedIn = (linkedinUrl || '').trim();
    const trimmedBudget = (proposedBudget || '').trim();
    const trimmedTimeline = (proposedTimeline || '').trim();

    if (!trimmedName || !trimmedEmail || !trimmedPhone || !trimmedLinkedIn || !trimmedBudget || !trimmedTimeline) {
      return res.status(400).json({
        message: 'Full name, contact email, phone, LinkedIn URL, proposed budget, and proposed timeline are required.'
      });
    }

    if (!freelancing.email) {
      return res.status(400).json({ message: 'No contact email found for this post' });
    }

    const normalizedSkills = parseArray(skills) || [];
    const skillsLabel = normalizedSkills.length > 0 ? normalizedSkills.join(', ') : 'Not provided';
    const resolvedPortfolio = (portfolioUrl || '').trim() || 'Not provided';
    const resolvedGitHub = (githubUrl || '').trim() || 'Not provided';

    const subject = `New candidate for your freelancing post: ${freelancing.title}`;
    const text = `Hello,\n\nThis email is from jankoti.com regarding the freelancing post you recently published on our website.\n\nWe would like to inform you that a candidate has applied for this opportunity. The candidate details are shared below for your reference.\n\nOpportunity: ${freelancing.title}\n\nApplicant Information:\n- Full Name: ${trimmedName}\n- Contact Email: ${trimmedEmail}\n- Phone: ${trimmedPhone}\n\nProfessional Details:\n- Skills: ${skillsLabel}\n- Portfolio URL: ${resolvedPortfolio}\n- LinkedIn URL: ${trimmedLinkedIn}\n- GitHub URL: ${resolvedGitHub}\n\nProposal Details:\n- Proposed Budget: ${trimmedBudget}\n- Proposed Timeline: ${trimmedTimeline}\n\nPlease feel free to review the profile and reach out if you are interested.\n\nLet us know if you need any further assistance.\n\nThank you for choosing jankoti.com.\n\nBest regards,\nTeam Jankoti\nwww.jankoti.com\n`;

    await sendFreelancingContactEmail({
      to: freelancing.email,
      subject,
      text,
      replyTo: trimmedEmail
    });

    freelancing.applications = freelancing.applications || [];
    freelancing.applications.push(req.userId);
    await freelancing.save();

    if (req.user?.email) {
      sendCandidateWelcomeEmail({
        to: req.user.email,
        candidateName: req.user.name,
        opportunityTitle: freelancing.title,
        posterName: freelancing.companyName,
        opportunityType: 'Freelancing'
      }).catch((err) => console.warn('Candidate welcome email failed:', err.message));
    }

    res.json({ message: 'Email sent successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send email', error: err.message });
  }
});

// Create new freelancing posting
router.post('/', auth, requireOrganization, uploadFreelancingImage, async (req, res) => {
  try {
    const normalizedSkills = parseArray(req.body.skills) || [];
    const normalizedRate = parseJson(req.body.rate);
    const normalizedStartDate = parseDate(req.body.startDate);
    const normalizedDeadline = parseDate(req.body.deadline);

    const freelancing = new Freelancing({
      ...req.body,
      skills: normalizedSkills,
      rate: normalizedRate && typeof normalizedRate === 'object' ? normalizedRate : req.body.rate,
      startDate: normalizedStartDate,
      deadline: normalizedDeadline,
      imageUrl: req.file?.path || '',
      imagePublicId: req.file?.filename || '',
      postedBy: req.userId
    });
    
    const savedFreelancing = await freelancing.save();
    
    res.status(201).json({
      message: 'Freelancing posting created successfully',
      freelancing: savedFreelancing
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update freelancing posting
router.put('/:id', auth, requireOrganization, uploadFreelancingImage, async (req, res) => {
  try {
    const freelancing = await Freelancing.findById(req.params.id);
    
    if (!freelancing) {
      return res.status(404).json({ message: 'Freelancing posting not found' });
    }
    
    // Check ownership
    if (!req.isAdmin && freelancing.postedBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to update this posting' });
    }
    
    const updateData = { ...req.body, updatedAt: Date.now() };

    if (typeof req.body.skills !== 'undefined') {
      updateData.skills = parseArray(req.body.skills) || [];
    }

    if (typeof req.body.rate !== 'undefined') {
      const normalizedRate = parseJson(req.body.rate);
      if (normalizedRate && typeof normalizedRate === 'object') {
        updateData.rate = normalizedRate;
      }
    }

    if (typeof req.body.startDate !== 'undefined') {
      updateData.startDate = parseDate(req.body.startDate);
    }

    if (typeof req.body.deadline !== 'undefined') {
      updateData.deadline = parseDate(req.body.deadline);
    }

    const oldImagePublicId = req.file ? freelancing.imagePublicId : null;
    if (req.file) {
      updateData.imageUrl = req.file.path;
      updateData.imagePublicId = req.file.filename;
    }

    const updatedFreelancing = await Freelancing.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (oldImagePublicId) {
      await deleteImage(oldImagePublicId);
    }
    
    res.json({
      message: 'Freelancing posting updated successfully',
      freelancing: updatedFreelancing
    });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Freelancing posting not found' });
    }
    res.status(400).json({ message: err.message });
  }
});

// Delete freelancing posting
router.delete('/:id', auth, requireOrganization, async (req, res) => {
  try {
    const freelancing = await Freelancing.findById(req.params.id);
    
    if (!freelancing) {
      return res.status(404).json({ message: 'Freelancing posting not found' });
    }
    
    // Check ownership
    if (!req.isAdmin && freelancing.postedBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this posting' });
    }
    
    await Freelancing.findByIdAndDelete(req.params.id);
    if (freelancing.imagePublicId) {
      await deleteImage(freelancing.imagePublicId);
    }
    
    res.json({ message: 'Freelancing posting deleted successfully' });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Freelancing posting not found' });
    }
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
