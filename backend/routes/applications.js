const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Job = require('../models/Job');
const { auth, requireCandidate, requireOrganization } = require('../middleware/auth');
const { sendApplicationNotification, sendAdminAlert, sendCandidateWelcomeEmail } = require('../services/emailService');

// @route   POST /api/applications
// @desc    Apply for a job
// @access  Private (Job seekers only)
router.post('/', auth, requireCandidate, async (req, res) => {
  try {
    const {
      jobId,
      coverLetter,
      resumeUrl,
      portfolioUrl,
      profileUrl,
      expectedSalary,
      availableFrom,
      notes
    } = req.body;
    
    // Check if job exists
    const job = await Job.findById(jobId).populate('postedBy', 'email name');
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Check if job is active
    if (job.status !== 'active') {
      return res.status(400).json({ message: 'This job is no longer accepting applications' });
    }
    
    // Check if user already applied
    const existingApplication = await Application.findOne({
      job: jobId,
      applicant: req.userId
    });
    
    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }
    
    // Check application deadline
    if (job.applicationDeadline && new Date() > new Date(job.applicationDeadline)) {
      return res.status(400).json({ message: 'Application deadline has passed' });
    }
    
    // Create application
    const application = await Application.create({
      job: jobId,
      applicant: req.userId,
      coverLetter,
      resumeUrl,
      portfolioUrl,
      profileUrl,
      expectedSalary,
      availableFrom,
      notes
    });
    
    // Add application to job
    job.applications.push(application._id);
    await job.save();

    const recipientEmail = job.email || job.postedBy?.email;
    if (recipientEmail) {
      sendApplicationNotification({
        to: recipientEmail,
        applicantName: req.user?.name,
        jobTitle: job.title,
        profileUrl
      }).catch((err) => console.warn('Application notification failed:', err.message));
    }

    if (req.user?.email) {
      sendCandidateWelcomeEmail({
        to: req.user.email,
        candidateName: req.user.name,
        opportunityTitle: job.title,
        posterName: job.company,
        opportunityType: 'Job'
      }).catch((err) => console.warn('Candidate welcome email failed:', err.message));
    }

    sendAdminAlert({
      subject: 'New job application submitted',
      text: `A new job application was submitted.\n\nJob: ${job.title}\nApplicant ID: ${req.userId}\nRecipient: ${recipientEmail || 'Not available'}\n`
    }).catch((err) => console.warn('Admin alert failed:', err.message));
    
    res.status(201).json({ application });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/applications/my-applications
// @desc    Get current user's applications
// @access  Private
router.get('/my-applications', auth, requireCandidate, async (req, res) => {
  try {
    const applications = await Application.find({ applicant: req.userId })
      .populate('job', 'title company location jobType status')
      .sort('-appliedAt');
    
    res.json({ applications });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/applications/:id
// @desc    Get single application
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('job', 'title company location description')
      .populate('applicant', 'name email profilePicture skills resume');
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    // Check authorization
    const isOwner = application.applicant._id.toString() === req.userId;
    const isJobOwner = application.job.postedBy?.toString() === req.userId;
    
    if (!isOwner && !isJobOwner) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json({ application });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/applications/:id
// @desc    Update application status (Employer only)
// @access  Private
router.put('/:id', auth, requireOrganization, async (req, res) => {
  try {
    const { status, employerNotes } = req.body;
    
    let application = await Application.findById(req.params.id).populate('job');
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    // Check if user is the job owner
    if (application.job.postedBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to update this application' });
    }
    
    application = await Application.findByIdAndUpdate(
      req.params.id,
      { 
        status, 
        employerNotes,
        updatedAt: Date.now()
      },
      { new: true }
    );
    
    res.json({ application });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/applications/:id
// @desc    Withdraw application
// @access  Private
router.delete('/:id', auth, requireCandidate, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    // Check if user is the applicant
    if (application.applicant.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this application' });
    }
    
    // Remove application from job
    await Job.findByIdAndUpdate(application.job, {
      $pull: { applications: application._id }
    });
    
    await Application.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Application withdrawn successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
