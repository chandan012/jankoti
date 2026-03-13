const express = require('express');
const fs = require('fs');
const router = express.Router();
const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');
const { auth, optionalAuth, requireOrganization, requireCandidate } = require('../middleware/auth');
const { sendFreelancingContactEmail, sendCandidateWelcomeEmail } = require('../services/emailService');
const { generateJobBanner } = require('../services/bannerGenerator');
const { cloudinary, createImageUpload, createDocumentUpload, deleteImage } = require('../config/cloudinary');
const { parseArray, parseJson, parseDate, parseNumber } = require('../utils/requestParser');

const uploadJobImage = createImageUpload('jobs');
const uploadResume = createDocumentUpload('resume');
const bannerGenerationInFlight = new Set();

const buildBannerPayload = (job) => ({
  _id: job._id,
  id: job._id,
  title: job.title,
  company: job.company,
  companyName: job.companyName,
  openings: job.openings,
  experience: job.experience,
  location: job.location,
  jobType: job.jobType,
  email: job.email || job.contactEmail || job.postedBy?.email,
  phone: job.phone || job.contactPhone || job.postedBy?.phone
});

const uploadBannerToCloudinary = (localBannerPath, jobId) => {
  return cloudinary.uploader.upload(localBannerPath, {
    folder: 'job-banners',
    public_id: `job-banner-${jobId}`,
    overwrite: true,
    invalidate: true,
    resource_type: 'image'
  });
};

const queueBannerGenerationForJob = (jobId) => {
  const key = String(jobId);
  if (!key || bannerGenerationInFlight.has(key)) return false;

  bannerGenerationInFlight.add(key);
  setImmediate(async () => {
    let localBannerPath = null;
    try {
      const job = await Job.findById(key).populate('postedBy', 'email');
      if (!job) return;

      // Skip if another request already generated a banner.
      if (job.bannerImage || job.aiBannerUrl) return;

      localBannerPath = await generateJobBanner(buildBannerPayload(job));
      const uploadResult = await uploadBannerToCloudinary(localBannerPath, job._id);

      await Job.findByIdAndUpdate(key, {
        bannerImage: uploadResult.secure_url || uploadResult.url,
        aiBannerUrl: null,
        bannerPrompt: 'CANVAS_TEMPLATE',
        aiProvider: 'template',
        bannerGeneratedAt: new Date()
      });
    } catch (error) {
      console.warn(`Background banner generation failed for job ${key}:`, error.message);
    } finally {
      if (localBannerPath) {
        await fs.promises.unlink(localBannerPath).catch(() => {});
      }
      bannerGenerationInFlight.delete(key);
    }
  });

  return true;
};

// @route   GET /api/jobs
// @desc    Get all jobs with filtering and pagination
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      location,
      jobType,
      experience,
      salaryMin,
      salaryMax,
      skills,
      sort = '-createdAt'
    } = req.query;
    
    // Build query
    const query = { status: 'active' };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { skills: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by skills explicitly
    if (skills) {
      query.skills = { $regex: skills, $options: 'i' };
    }
    
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    if (jobType) {
      query.jobType = jobType;
    }
    
    if (experience) {
      query.experience = experience;
    }
    
    if (salaryMin || salaryMax) {
      query['salary.min'] = { $gte: parseInt(salaryMin) };
      query['salary.max'] = { $lte: parseInt(salaryMax) };
    }
    
    // Execute query with pagination
    const jobs = await Job.find(query)
      .populate('postedBy', 'name company profilePicture')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Job.countDocuments(query);
    
    res.json({
      jobs,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalJobs: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/jobs/my-jobs
// @desc    Get jobs posted by current user (employer)
// @access  Private
router.get('/my-jobs', auth, requireOrganization, async (req, res) => {
  try {
    const filter = req.isAdmin ? {} : { postedBy: req.userId };
    const jobs = await Job.find(filter)
      .populate('postedBy', 'name company email profilePicture')
      .sort('-createdAt');
    
    res.json({ jobs });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/jobs/:id
// @desc    Get single job by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'name company profilePicture email')
      .populate('applications', 'applicant status appliedAt');
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Increment views
    job.views += 1;
    await job.save();
    
    const hasApplied = Boolean(
      req.userId &&
      req.userRole === 'candidate' &&
      job.applications?.some((application) => application.applicant?.toString() === req.userId)
    );

    res.json({ job: { ...job.toObject(), hasApplied } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/jobs/:id/contact
// @desc    Send application email to job poster (Candidate only)
// @access  Private (Candidate only)
router.post('/:id/contact', auth, requireCandidate, uploadResume, async (req, res) => {
  try {
    const {
      fullName,
      contactEmail,
      phone,
      skills,
      linkedinUrl
    } = req.body;
    const job = await Job.findById(req.params.id).populate('postedBy', 'email name');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const existingApplication = await Application.findOne({ job: job._id, applicant: req.userId });
    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    const trimmedName = (fullName || '').trim();
    const trimmedEmail = (contactEmail || '').trim();
    const trimmedPhone = (phone || '').trim();
    const trimmedLinkedIn = (linkedinUrl || '').trim();

    if (!trimmedName || !trimmedEmail || !trimmedPhone || !trimmedLinkedIn) {
      return res.status(400).json({ message: 'Full name, contact email, phone, and LinkedIn URL are required.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Resume file is required.' });
    }

    const recipientEmail = job.email || job.postedBy?.email;
    if (!recipientEmail) {
      return res.status(400).json({ message: 'No contact email found for this job' });
    }

    const application = await Application.create({
      job: job._id,
      applicant: req.userId,
      status: 'pending'
    });

    job.applications.push(application._id);
    await job.save();

    const normalizedSkills = parseArray(skills) || [];
    const skillsLabel = normalizedSkills.length > 0 ? normalizedSkills.join(', ') : 'Not provided';
    const resumeLabel = req.file ? `Attached (${req.file.originalname})` : 'Not provided';

    const subject = `New candidate for your job post: ${job.title}`;
    const text = `Hello,\n\nThis email is from jankoti.com regarding the job post you recently published on our website.\n\nWe would like to inform you that a candidate has applied for this opportunity. The candidate details are shared below for your reference.\n\nOpportunity: ${job.title}\n\nApplicant Information:\n- Full Name: ${trimmedName}\n- Contact Email: ${trimmedEmail}\n- Phone: ${trimmedPhone}\n\nProfessional Details:\n- Skills: ${skillsLabel}\n- LinkedIn URL: ${trimmedLinkedIn}\n- Resume: ${resumeLabel}\n\nPlease feel free to review the profile and reach out if you are interested.\n\nLet us know if you need any further assistance.\n\nThank you for choosing jankoti.com.\n\nBest regards,\nTeam Jankoti\nwww.jankoti.com\n`;

    const attachments = req.file ? [{
      filename: req.file.originalname,
      content: req.file.buffer,
      contentType: req.file.mimetype
    }] : undefined;

    await sendFreelancingContactEmail({
      to: recipientEmail,
      subject,
      text,
      attachments,
      replyTo: trimmedEmail
    });

    if (req.user?.email) {
      sendCandidateWelcomeEmail({
        to: req.user.email,
        candidateName: req.user.name,
        opportunityTitle: job.title,
        posterName: job.company,
        opportunityType: 'Job'
      }).catch((err) => console.warn('Candidate welcome email failed:', err.message));
    }

    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send email', error: error.message });
  }
});

// @route   POST /api/jobs
// @desc    Create a new job
// @access  Private
router.post('/', auth, requireOrganization, uploadJobImage, async (req, res) => {
  try {
    const {
      title,
      description,
      requirements,
      responsibilities,
      company,
      companyName,
      email,
      contactEmail,
      phone,
      openings,
      location,
      jobType,
      experience,
      salary,
      skills,
      applicationDeadline
    } = req.body;

    const normalizedSkills = parseArray(skills) || [];
    const normalizedSalary = parseJson(salary);
    const normalizedDeadline = parseDate(applicationDeadline);
    const normalizedOpenings = parseNumber(openings);
    
    // Get user info
    const user = await User.findById(req.userId);
    const resolvedCompany = companyName || company || user.company;
    const resolvedEmail = contactEmail || email;
    
    // Create job
    const job = await Job.create({
      title,
      description,
      requirements,
      responsibilities,
      company: resolvedCompany,
      openings: normalizedOpenings,
      email: resolvedEmail,
      phone,
      location,
      jobType,
      experience,
      salary: normalizedSalary && typeof normalizedSalary === 'object' ? normalizedSalary : salary,
      skills: normalizedSkills,
      applicationDeadline: normalizedDeadline,
      imageUrl: req.file?.path || '',
      imagePublicId: req.file?.filename || '',
      postedBy: req.userId
    });

    if (!job.bannerImage) {
      generateJobBanner(buildBannerPayload(job))
        .then(async (localPath) => {
          if (!localPath) return;
          const uploadResult = await uploadBannerToCloudinary(localPath, job._id);
          await Job.findByIdAndUpdate(job._id, {
            bannerImage: uploadResult.secure_url || uploadResult.url,
            bannerPrompt: 'CANVAS_TEMPLATE',
            aiProvider: 'template',
            bannerGeneratedAt: new Date()
          });
          await fs.promises.unlink(localPath).catch((err) => {
            console.warn('Failed to clean up banner file:', err.message);
          });
        })
        .catch((bannerError) => {
          console.warn('Job banner generation failed:', bannerError.message);
        });
    }

    res.status(201).json({ job });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/jobs/:id
// @desc    Update a job
// @access  Private (Owner only)
router.put('/:id', auth, requireOrganization, uploadJobImage, async (req, res) => {
  try {
    let job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Check ownership
    if (!req.isAdmin && job.postedBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to update this job' });
    }
    
    const {
      title,
      description,
      requirements,
      responsibilities,
      company,
      companyName,
      email,
      contactEmail,
      phone,
      openings,
      location,
      jobType,
      experience,
      salary,
      skills,
      applicationDeadline,
      status
    } = req.body;
    
    // Update job fields
    const updateData = {
      title,
      description,
      requirements,
      responsibilities,
      company: companyName || company,
      email: contactEmail || email,
      phone,
      openings: parseNumber(openings),
      location,
      jobType,
      experience,
      salary,
      applicationDeadline,
      status
    };

    if (typeof req.body.skills !== 'undefined') {
      updateData.skills = parseArray(req.body.skills) || [];
    }

    if (typeof req.body.salary !== 'undefined') {
      const normalizedSalary = parseJson(req.body.salary);
      if (normalizedSalary && typeof normalizedSalary === 'object') {
        updateData.salary = normalizedSalary;
      }
    }

    if (typeof req.body.applicationDeadline !== 'undefined') {
      updateData.applicationDeadline = parseDate(req.body.applicationDeadline);
    }

    const oldImagePublicId = req.file ? job.imagePublicId : null;
    if (req.file) {
      updateData.imageUrl = req.file.path;
      updateData.imagePublicId = req.file.filename;
    }
    
    job = await Job.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (oldImagePublicId) {
      await deleteImage(oldImagePublicId);
    }
    
    res.json({ job });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/jobs/:id
// @desc    Delete a job
// @access  Private (Owner only)
router.delete('/:id', auth, requireOrganization, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Check ownership
    if (!req.isAdmin && job.postedBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this job' });
    }
    
    // Delete all applications for this job
    await Application.deleteMany({ job: job._id });
    
    await Job.findByIdAndDelete(req.params.id);
    if (job.imagePublicId) {
      await deleteImage(job.imagePublicId);
    }
    
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/jobs/:id/applications
// @desc    Get applications for a job
// @access  Private (Job owner only)
router.get('/:id/applications', auth, requireOrganization, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Check ownership
    if (!req.isAdmin && job.postedBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const applications = await Application.find({ job: req.params.id })
      .populate('applicant', 'name email profilePicture skills resume')
      .sort('-appliedAt');
    
    res.json({ applications });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/jobs/:id/generate-banner
// @desc    Generate AI banner for a job
// @access  Private (Job owner only)
router.post('/:id/generate-banner', auth, requireOrganization, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Check ownership
    if (!req.isAdmin && job.postedBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to generate banner for this job' });
    }
    
    let localBannerPath = null;

    try {
      // Prefer local template generator + Cloudinary upload for consistency
      // with newly created jobs and to avoid external API dependency.
      localBannerPath = await generateJobBanner(buildBannerPayload(job));
      const uploadResult = await uploadBannerToCloudinary(localBannerPath, job._id);

      job.bannerImage = uploadResult.secure_url || uploadResult.url;
      job.aiBannerUrl = null;
      job.bannerPrompt = 'CANVAS_TEMPLATE';
      job.aiProvider = 'template';
      job.bannerGeneratedAt = new Date();
      await job.save();

      res.json({
        message: 'Banner generated successfully',
        bannerUrl: job.bannerImage,
        provider: job.aiProvider,
        job: {
          _id: job._id,
          bannerImage: job.bannerImage,
          aiBannerUrl: job.aiBannerUrl,
          bannerGeneratedAt: job.bannerGeneratedAt,
          aiProvider: job.aiProvider
        }
      });
      return;
    } catch (templateError) {
      console.warn('Template banner generation failed, trying AI fallback:', templateError.message);
    } finally {
      if (localBannerPath) {
        await fs.promises.unlink(localBannerPath).catch((err) => {
          console.warn('Failed to clean up banner file:', err.message);
        });
      }
    }

    // Fallback to AI service if template or upload fails
    let generateAIBanner = null;
    try {
      ({ generateJobBanner: generateAIBanner } = require('../services/aiService'));
    } catch (requireError) {
      return res.status(500).json({
        message: 'AI banner service is not configured.',
        error: requireError.message
      });
    }

    const result = await generateAIBanner(job);

    if (result.needsApiKey) {
      return res.status(400).json({
        message: result.error,
        needsApiKey: true
      });
    }

    if (!result.success) {
      return res.status(500).json({
        message: 'Failed to generate banner',
        error: result.error
      });
    }

    const allowedProviders = new Set(['openai', 'huggingface', 'template']);
    job.aiBannerUrl = result.imageUrl;
    job.bannerPrompt = result.prompt;
    job.bannerGeneratedAt = new Date();
    job.aiProvider = allowedProviders.has(result.provider) ? result.provider : null;
    await job.save();

    res.json({
      message: 'Banner generated successfully',
      bannerUrl: result.imageUrl,
      provider: job.aiProvider,
      job: {
        _id: job._id,
        bannerImage: job.bannerImage,
        aiBannerUrl: job.aiBannerUrl,
        bannerGeneratedAt: job.bannerGeneratedAt,
        aiProvider: job.aiProvider
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/jobs/:id/banner-status
// @desc    Get banner status for a job
// @access  Public
router.get('/:id/banner-status', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .select('bannerImage aiBannerUrl bannerGeneratedAt bannerPrompt aiProvider');
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    const bannerUrl = job.bannerImage || job.aiBannerUrl || null;
    const generationQueued = !bannerUrl ? queueBannerGenerationForJob(job._id) : false;

    res.json({
      hasBanner: !!bannerUrl,
      bannerUrl,
      bannerImage: job.bannerImage || null,
      aiBannerUrl: job.aiBannerUrl || null,
      generatedAt: job.bannerGeneratedAt,
      aiProvider: job.aiProvider || null,
      generationQueued
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
