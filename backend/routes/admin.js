const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const FreelancingApplication = require('../models/FreelancingApplication');
const Classified = require('../models/Classified');
const { auth } = require('../middleware/auth');

const requireAdmin = (req, res, next) => {
  if (!req.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  return next();
};

// @route   GET /api/admin/candidate-data
// @desc    Get candidate-facing data for admin dashboard
// @access  Private (Admin only)
router.get('/candidate-data', auth, requireAdmin, async (req, res) => {
  try {
    const [jobApplications, freelancingApplications, classifieds] = await Promise.all([
      Application.find()
        .populate('job', 'title')
        .populate('applicant', 'name email')
        .sort('-appliedAt')
        .lean(),
      FreelancingApplication.find()
        .populate('freelancing', 'title')
        .populate('applicant', 'name email')
        .sort('-appliedAt')
        .lean(),
      Classified.find()
        .select('sellerName sellerEmail sellerContact itemName createdAt')
        .sort('-createdAt')
        .lean()
    ]);

    res.json({
      jobApplications,
      freelancingApplications,
      classifieds
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load admin data', error: error.message });
  }
});

module.exports = router;
