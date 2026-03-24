import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const FreelancingDetail = () => {
  const { id } = useParams();
  const { isAuthenticated, isCandidate } = useAuth();
  const [freelancing, setFreelancing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fullName, setFullName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [proposedBudget, setProposedBudget] = useState('');
  const [proposedTimeline, setProposedTimeline] = useState('');
  const [contactStatus, setContactStatus] = useState('');
  const [contactLoading, setContactLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  useEffect(() => {
    const fetchFreelancing = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/freelancing/${id}`);
        const freelancingData = response.data.freelancing;
        setFreelancing(freelancingData);
        setHasApplied(Boolean(freelancingData?.hasApplied));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch details');
      } finally {
        setLoading(false);
      }
    };

    fetchFreelancing();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatRate = (rate) => {
    if (!rate || (!rate.min && !rate.max)) return 'Negotiable';

    const type =
      rate.rateType === 'hourly'
        ? '/hr'
        : rate.rateType === 'monthly'
        ? '/mo'
        : '';

    if (rate.min && rate.max) {
      return `$${rate.min.toLocaleString()} - $${rate.max.toLocaleString()}${type}`;
    }
    if (rate.min) return `$${rate.min.toLocaleString()}${type}+`;
    return `Up to $${rate.max.toLocaleString()}${type}`;
  };

  const getExperienceLabel = (exp) => {
    const labels = {
      entry: 'Entry Level (0-1 years)',
      mid: 'Mid Level (2-5 years)',
      senior: 'Senior Level (5+ years)',
      expert: 'Expert (8+ years)'
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

  const handleContact = async () => {
    setContactStatus('');

    if (!fullName.trim() || !contactEmail.trim() || !phone.trim() || !linkedinUrl.trim()) {
      setContactStatus('Please fill in all required fields.');
      return;
    }

    if (!proposedBudget.trim() || !proposedTimeline.trim()) {
      setContactStatus('Please provide your proposed budget and timeline.');
      return;
    }

    try {
      setContactLoading(true);
      const skills = parseSkillsInput(skillsInput);
      await axios.post(`${API_URL}/freelancing/${id}/contact`, {
        fullName: fullName.trim(),
        contactEmail: contactEmail.trim(),
        phone: phone.trim(),
        skills,
        portfolioUrl: portfolioUrl.trim(),
        linkedinUrl: linkedinUrl.trim(),
        githubUrl: githubUrl.trim(),
        proposedBudget: proposedBudget.trim(),
        proposedTimeline: proposedTimeline.trim()
      });
      setContactStatus('Your request has been sent successfully.');
      setFullName('');
      setContactEmail('');
      setPhone('');
      setSkillsInput('');
      setPortfolioUrl('');
      setLinkedinUrl('');
      setGithubUrl('');
      setProposedBudget('');
      setProposedTimeline('');
      setShowModal(false);
      setHasApplied(true);
      setShowWhatsAppModal(true);
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
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="job-detail-page">
        <div className="container" style={{ padding: '40px 20px' }}>
          <div className="alert alert-danger">{error}</div>
          <Link to="/freelancing-view" className="btn btn-primary">
            Back to Freelancing
          </Link>
        </div>
      </div>
    );
  }

  if (!freelancing) {
    return (
      <div className="job-detail-page">
        <div className="container" style={{ padding: '40px 20px' }}>
          <div className="alert alert-danger">Project not found</div>
          <Link to="/freelancing-view" className="btn btn-primary">
            Back to Freelancing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="job-detail-page">
      <div
        className="container"
        style={{ padding: '40px 20px', maxWidth: '900px' }}
      >
        <Link
          to="/freelancing-view"
          style={{ display: 'inline-block', marginBottom: '20px' }}
        >
          ← Back to Freelancing Projects
        </Link>

        <div className="job-detail-card">
          <div className="job-detail-header detail-header--light">
            <h1 className="job-detail-title">{freelancing.title}</h1>
            <p className="job-card-company" style={{ fontSize: '1.1rem' }}>
              {freelancing.companyName}
            </p>

            <div className="job-detail-meta">
              <span>{freelancing.location || 'Remote'}</span>
              <span>{getExperienceLabel(freelancing.experience)}</span>
              <span>{formatRate(freelancing.rate)}</span>
              <span>{freelancing.views} views</span>
            </div>
          </div>

          <div className="job-detail-body">
            <h3>Project Description</h3>
            <p style={{ whiteSpace: 'pre-wrap' }}>
              {freelancing.description}
            </p>

            {freelancing.skills?.length > 0 && (
              <>
                <h3>Required Skills</h3>
                <div className="job-skills">
                  {freelancing.skills.map((skill, index) => (
                    <span key={index} className="skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>
              </>
            )}

            {(freelancing.projectScope || freelancing.projectDuration || freelancing.weeklyHours || freelancing.startDate) && (
              <div className="job-detail-section" style={{ marginTop: '20px' }}>
                <h3>Project Overview</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  {freelancing.projectScope && <div><strong>Scope:</strong> {freelancing.projectScope}</div>}
                  {freelancing.projectDuration && <div><strong>Duration:</strong> {freelancing.projectDuration}</div>}
                  {freelancing.weeklyHours && <div><strong>Weekly Hours:</strong> {freelancing.weeklyHours}</div>}
                  {freelancing.startDate && <div><strong>Start Date:</strong> {formatDate(freelancing.startDate)}</div>}
                </div>
              </div>
            )}

            {freelancing.deliverables && (
              <div className="job-detail-section">
                <h3>Expected Deliverables</h3>
                <p style={{ whiteSpace: 'pre-wrap' }}>{freelancing.deliverables}</p>
              </div>
            )}

            <div style={{ marginTop: '30px' }}>
              {isAuthenticated ? (
                isCandidate ? (
                  <>
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowModal(true)}
                      disabled={hasApplied}
                    >
                      {hasApplied ? 'Applied' : 'Submit Proposal'}
                    </button>
                    
                    <Modal
                      isOpen={showModal}
                      onClose={() => {
                        setShowModal(false);
                        setContactStatus('');
                        setFullName('');
                        setContactEmail('');
                        setPhone('');
                        setSkillsInput('');
                        setPortfolioUrl('');
                        setLinkedinUrl('');
                        setGithubUrl('');
                        setProposedBudget('');
                        setProposedTimeline('');
                      }}
                      title="Submit Your Profile"
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
                        <label className="form-label">Portfolio URL</label>
                        <input
                          type="url"
                          className="form-control"
                          placeholder="https://your-portfolio.com"
                          value={portfolioUrl}
                          onChange={(event) => setPortfolioUrl(event.target.value)}
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
                        <label className="form-label">GitHub URL</label>
                        <input
                          type="url"
                          className="form-control"
                          placeholder="https://github.com/your-handle"
                          value={githubUrl}
                          onChange={(event) => setGithubUrl(event.target.value)}
                        />
                      </div>

                      <h4 style={{ margin: '20px 0 12px' }}>Proposal Details</h4>
                      <div className="form-group">
                        <label className="form-label">Proposed Budget *</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g., $1,200 or $40/hr"
                          value={proposedBudget}
                          onChange={(event) => setProposedBudget(event.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Proposed Timeline *</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g., 4 weeks"
                          value={proposedTimeline}
                          onChange={(event) => setProposedTimeline(event.target.value)}
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
                        onClick={handleContact}
                        disabled={contactLoading}
                        style={{ width: '100%' }}
                      >
                        {contactLoading ? 'Sending...' : 'Submit'}
                      </button>
                    </Modal>
                  </>
                ) : (
                  <span style={{ color: '#6b7280' }}>
                    
                  </span>
                )
              ) : (
                <Link to="/login" className="btn btn-primary">
                  Login to Contact
                </Link>
              )}
            </div>

            <Modal
              isOpen={showWhatsAppModal}
              onClose={() => setShowWhatsAppModal(false)}
              title="Stay Updated on WhatsApp"
            >
              <p style={{ marginBottom: '16px', color: '#4b5563' }}>
                Join our WhatsApp channel to get the latest updates and announcements.
              </p>
              <a
                className="btn btn-success"
                href="https://whatsapp.com/channel/0029VbC0L1Z8F2pI4oZSFV0z"
                target="_blank"
                rel="noopener noreferrer"
                style={{ width: '100%', textAlign: 'center' }}
              >
                Join WhatsApp Channel
              </a>
            </Modal>

            {freelancing.postedBy && (
              <div
                style={{
                  marginTop: '40px',
                  padding: '20px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px'
                }}
              >
                <h4>Posted by</h4>
                <p>{freelancing.postedBy.name}</p>
                <p>{freelancing.postedBy.email}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreelancingDetail;
