import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const JobDetail = () => {
  const { id } = useParams();
  const { isAuthenticated, isCandidate, isAdmin } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fullName, setFullName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [contactStatus, setContactStatus] = useState('');
  const [contactLoading, setContactLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [bannerPolling, setBannerPolling] = useState(false);
  const [bannerGenerating, setBannerGenerating] = useState(false);
  const [bannerGenerateError, setBannerGenerateError] = useState('');

  useEffect(() => {
    fetchJob();
  }, [id]);

  useEffect(() => {
    let timerId = null;
    let attempts = 0;
    let cancelled = false;

    if (job && !job.bannerImage && !job.aiBannerUrl) {
      setBannerPolling(true);
      timerId = setInterval(async () => {
        attempts += 1;
        try {
          const response = await axios.get(`${API_URL}/jobs/${id}/banner-status`);
          const { bannerImage, aiBannerUrl } = response.data || {};
          if (bannerImage || aiBannerUrl) {
            if (!cancelled) {
              setJob((prev) => ({
                ...prev,
                bannerImage: bannerImage || prev?.bannerImage || null,
                aiBannerUrl: aiBannerUrl || prev?.aiBannerUrl || null
              }));
            }
            clearInterval(timerId);
            timerId = null;
            if (!cancelled) {
              setBannerPolling(false);
            }
          }
        } catch (err) {
          // ignore polling errors
        }

        if (attempts >= 12) {
          clearInterval(timerId);
          timerId = null;
          if (!cancelled) {
            setBannerPolling(false);
          }
        }
      }, 5000);
    }

    return () => {
      cancelled = true;
      if (timerId) {
        clearInterval(timerId);
      }
    };
  }, [id, job?.bannerImage, job?.aiBannerUrl]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/jobs/${id}`);
      const jobData = response.data.job;
      setJob(jobData);
      setHasApplied(Boolean(jobData?.hasApplied));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch job details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatSalary = (salary) => {
    if (!salary?.min && !salary?.max) return 'Negotiable';
    if (salary.min && salary.max) {
      return `$${salary.min.toLocaleString()} - $${salary.max.toLocaleString()}`;
    }
    if (salary.min) return `$${salary.min.toLocaleString()}+`;
    return `Up to $${salary.max.toLocaleString()}`;
  };

  const getJobTypeLabel = (type) => {
    const labels = {
      'full-time': 'Full Time',
      'part-time': 'Part Time',
      'contract': 'Contract',
      'internship': 'Internship',
      'remote': 'Remote'
    };
    return labels[type] || type;
  };

  const getExperienceLabel = (exp) => {
    const labels = {
      'entry': 'Entry Level (0-1 years)',
      'mid': 'Mid Level (2-5 years)',
      'senior': 'Senior Level (5+ years)',
      'lead': 'Lead (7+ years)',
      'executive': 'Executive (10+ years)'
    };
    return labels[exp] || exp;
  };

  const parseSkillsInput = (value) => {
    if (!value) return [];
    return value
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean);
  };

  const handleRegenerateBanner = async () => {
    if (!job?._id) return;
    try {
      setBannerGenerating(true);
      setBannerGenerateError('');
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/jobs/${job._id}/generate-banner`,
        {},
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      const bannerUrl = response.data?.bannerUrl || response.data?.job?.bannerImage;
      if (bannerUrl) {
        setJob((prev) => ({
          ...prev,
          bannerImage: bannerUrl,
          aiBannerUrl: response.data?.job?.aiBannerUrl || prev?.aiBannerUrl || null
        }));
      }
    } catch (err) {
      setBannerGenerateError(err.response?.data?.message || 'Failed to regenerate banner');
    } finally {
      setBannerGenerating(false);
    }
  };

  const handleJobContact = async () => {
    setContactStatus('');

    if (!fullName.trim() || !contactEmail.trim() || !phone.trim() || !linkedinUrl.trim()) {
      setContactStatus('Please fill in all required fields.');
      return;
    }

    if (!resumeFile) {
      setContactStatus('Please upload your resume.');
      return;
    }

    try {
      setContactLoading(true);
      const skills = parseSkillsInput(skillsInput);
      const payload = new FormData();
      payload.append('fullName', fullName.trim());
      payload.append('contactEmail', contactEmail.trim());
      payload.append('phone', phone.trim());
      payload.append('linkedinUrl', linkedinUrl.trim());
      if (skills.length > 0) {
        payload.append('skills', JSON.stringify(skills));
      }
      payload.append('resume', resumeFile);

      await axios.post(`${API_URL}/jobs/${id}/contact`, payload);
      setContactStatus('Your request has been sent successfully.');
      setFullName('');
      setContactEmail('');
      setPhone('');
      setSkillsInput('');
      setLinkedinUrl('');
      setResumeFile(null);
      setShowModal(false);
      setHasApplied(true);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to send your request.';
      setContactStatus(message);
      if (message.toLowerCase().includes('already applied')) {
        setHasApplied(true);
      }
    } finally {
      setContactLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading" style={{ minHeight: '60vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="job-detail-page">
        <div className="container" style={{ padding: '40px 20px', maxWidth: '900px' }}>
          <div className="alert alert-danger">{error}</div>
          <Link to="/jobs" className="btn btn-primary" style={{ marginTop: '20px' }}>
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="job-detail-page">
        <div className="container" style={{ padding: '40px 20px', maxWidth: '900px' }}>
          <div className="alert alert-danger">Job not found</div>
          <Link to="/jobs" className="btn btn-primary" style={{ marginTop: '20px' }}>
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  const bannerUrl = job.bannerImage || job.aiBannerUrl || null;
  const bannerVersion = job.bannerGeneratedAt || job.updatedAt || null;
  const bannerDisplayUrl = bannerUrl
    ? `${bannerUrl}${bannerUrl.includes('?') ? '&' : '?'}v=${encodeURIComponent(bannerVersion || Date.now())}`
    : null;
  const buildCloudinaryTransformUrl = (url, transform) => {
    const marker = '/upload/';
    const index = url.indexOf(marker);
    if (index === -1) return url;
    const prefix = url.slice(0, index + marker.length);
    const rest = url.slice(index + marker.length);
    return `${prefix}${transform}/${rest}`;
  };
  const bannerDownloadUrl = bannerUrl
    ? buildCloudinaryTransformUrl(bannerUrl, 'c_pad,b_rgb:ffffff,w_1080,h_1080,f_auto,q_auto')
    : null;
  const titleStyle = { fontSize: '2.1rem', marginBottom: '6px' };
  const companyStyle = { fontSize: '1.25rem' };
  const metaStyle = { fontSize: '1.05rem' };
  const badgeStyle = { fontSize: '0.95rem', padding: '6px 12px' };
  const sectionTitleStyle = { fontSize: '1.35rem' };
  const bodyTextStyle = { fontSize: '1.05rem', lineHeight: '1.8', color: '#555' };
  const summaryTitleStyle = { marginBottom: '15px', fontSize: '1.25rem' };

  return (
    <div className="job-detail-page">
      <div className="container" style={{ padding: '32px 16px', maxWidth: '760px', margin: '0 auto' }}>
        {/* Back Button */}
        <Link to="/jobs" style={{ display: 'inline-flex', alignItems: 'center', color: '#007bff', marginBottom: '20px' }}>
          ← Back to Job News
        </Link>

        <div className="job-detail-card" style={{ fontSize: '1.05rem' }}>
          {bannerUrl ? (
            <div style={{ overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
              <img
                src={bannerDisplayUrl}
                alt={`${job.title} hiring banner`}
                style={{ width: '100%', display: 'block' }}
              />
              {isAdmin && bannerDownloadUrl && (
                <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(109, 40, 217, 0.12)', display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleRegenerateBanner}
                    disabled={bannerGenerating}
                  >
                    {bannerGenerating ? 'Regenerating...' : 'Regenerate Banner'}
                  </button>
                  <a
                    className="btn btn-outline btn-sm"
                    href={bannerDownloadUrl}
                    download={`job-banner-${job._id || job.title}.png`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download Banner (1080x1080)
                  </a>
                </div>
              )}
              {isAdmin && bannerGenerateError && (
                <div style={{ padding: '0 16px 16px' }}>
                  <div className="alert alert-warning" style={{ marginBottom: 0 }}>
                    {bannerGenerateError}
                  </div>
                </div>
              )}
            </div>
          ) : bannerPolling ? (
            <div style={{
              height: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '16px 16px 0 0',
              background: 'linear-gradient(120deg, #f3f4f6, #e5e7eb)',
              color: '#6b7280',
              fontWeight: 600
            }}>
              Generating banner...
            </div>
          ) : null}
          <div className="job-detail-header detail-header--light">
            <h1 className="job-detail-title" style={titleStyle}>{job.title}</h1>
            <p className="job-card-company" style={companyStyle}>
              {job.company}
            </p>

            <div className="job-detail-meta" style={metaStyle}>
              <span>{job.location}</span>
              <span>{getExperienceLabel(job.experience)}</span>
              <span>{formatSalary(job.salary)}</span>
              <span>{job.views} views</span>
            </div>

            <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <span className="badge badge-primary" style={badgeStyle}>
                {getJobTypeLabel(job.jobType)}
              </span>
              <span className="badge badge-primary" style={badgeStyle}>
                Posted: {formatDate(job.createdAt)}
              </span>
            </div>
          </div>

          <div className="job-detail-body">
            {/* Job Description Section */}
            <div className="job-detail-section">
              <h3 style={sectionTitleStyle}>Job Description</h3>
              <div style={{ ...bodyTextStyle, whiteSpace: 'pre-wrap' }}>
                {job.description}
              </div>
            </div>

            {/* Requirements Section */}
            {job.requirements && job.requirements.length > 0 && (
              <div className="job-detail-section">
                <h3 style={sectionTitleStyle}>Requirements</h3>
                <ul style={{ fontSize: '1.05rem' }}>
                  {job.requirements.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Responsibilities Section */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <div className="job-detail-section">
                <h3 style={sectionTitleStyle}>Responsibilities</h3>
                <ul style={{ fontSize: '1.05rem' }}>
                  {job.responsibilities.map((resp, index) => (
                    <li key={index}>{resp}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Skills Section */}
            {job.skills && job.skills.length > 0 && (
              <div className="job-detail-section">
                <h3 style={sectionTitleStyle}>Skills Required</h3>
                <div className="job-skills">
                  {job.skills.map((skill, index) => (
                    <span key={index} className="skill-tag">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Job Info Summary */}
            <div className="job-detail-section">
              <h3 style={summaryTitleStyle}>Job Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', fontSize: '1.05rem' }}>
                <div>
                  <strong>Job Type:</strong> {getJobTypeLabel(job.jobType)}
                </div>
                <div>
                  <strong>Experience:</strong> {getExperienceLabel(job.experience)}
                </div>
                <div>
                  <strong>Salary:</strong> {formatSalary(job.salary)}
                </div>
                <div>
                  <strong>Location:</strong> {job.location}
                </div>
                <div>
                  <strong>Company:</strong> {job.company}
                </div>
                <div>
                  <strong>Posted:</strong> {formatDate(job.createdAt)}
                </div>
              </div>
            </div>

            {isCandidate && (
              <div className="job-detail-section">
                <h3>Complete the application form below to apply</h3>
              </div>
            )}

            <div style={{ marginTop: '20px' }}>
              {isAuthenticated ? (
                isCandidate ? (
                  <>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-primary btn-lg"
                        onClick={() => setShowModal(true)}
                        disabled={hasApplied}
                      >
                        {hasApplied ? 'Applied' : 'Apply Now'}
                      </button>
                      <button
                        className="btn btn-outline btn-lg"
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          alert('Link copied to clipboard!');
                        }}
                      >
                        Share Job
                      </button>
                    </div>

                    <Modal
                      isOpen={showModal}
                      onClose={() => {
                        setShowModal(false);
                        setContactStatus('');
                        setFullName('');
                        setContactEmail('');
                        setPhone('');
                        setSkillsInput('');
                        setLinkedinUrl('');
                        setResumeFile(null);
                      }}
                      title="Submit Your Application"
                    >
                      <h4 style={{ marginBottom: '12px' }}>Applicant Information</h4>
                      <div className="form-group">
                        <label className="form-label">Full Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Your full name"
                          value={fullName}
                          onChange={(event) => setFullName(event.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Contact Email *</label>
                        <input
                          type="email"
                          className="form-control"
                          placeholder="you@example.com"
                          value={contactEmail}
                          onChange={(event) => setContactEmail(event.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Phone *</label>
                        <input
                          type="tel"
                          className="form-control"
                          placeholder="+1 555 123 4567"
                          value={phone}
                          onChange={(event) => setPhone(event.target.value)}
                        />
                      </div>

                      <h4 style={{ margin: '20px 0 12px' }}>Professional Details</h4>
                      <div className="form-group">
                        <label className="form-label">Skills (comma separated)</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="React, Node.js, UI/UX"
                          value={skillsInput}
                          onChange={(event) => setSkillsInput(event.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">LinkedIn URL *</label>
                        <input
                          type="url"
                          className="form-control"
                          placeholder="https://www.linkedin.com/in/your-profile"
                          value={linkedinUrl}
                          onChange={(event) => setLinkedinUrl(event.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Resume (PDF, DOC, DOCX) *</label>
                        <input
                          type="file"
                          className="form-control"
                          accept=".pdf,.doc,.docx"
                          onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
                        />
                      </div>
                      {contactStatus && (
                        <div
                          className={`alert ${contactStatus.includes('successfully') ? 'alert-success' : 'alert-danger'}`}
                          style={{ marginBottom: '15px' }}
                        >
                          {contactStatus}
                        </div>
                      )}
                      <button
                        className="btn btn-primary"
                        onClick={handleJobContact}
                        disabled={contactLoading}
                        style={{ width: '100%' }}
                      >
                        {contactLoading ? 'Sending...' : 'Submit'}
                      </button>
                    </Modal>
                  </>
                ) : (
                  <div style={{ color: '#6b7280', padding: '12px 0' }}>
                    
                  </div>
                )
              ) : (
                <Link to="/login" className="btn btn-primary btn-lg">
                  Login to Apply
                </Link>
              )}
            </div>

            {/* Posted By Info */}
            {job.postedBy && (
              <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <h4 style={{ marginBottom: '10px' }}>Posted by</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  {job.postedBy.profilePicture ? (
                    <img
                      src={job.postedBy.profilePicture}
                      alt={job.postedBy.name}
                      style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      backgroundColor: '#007bff',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      fontWeight: 'bold'
                    }}>
                      {job.postedBy.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p style={{ fontWeight: '600', marginBottom: '5px' }}>{job.postedBy.name}</p>
                    {job.postedBy.company && (
                      <p style={{ color: '#666', fontSize: '0.9rem' }}>{job.postedBy.company}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
