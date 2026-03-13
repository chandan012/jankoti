import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const PostJob = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    experience: 'mid',
    companyName: '',
    openings: '',
    contactEmail: '',
    phone: '',
    skills: '',
    description: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s);
      
      // Construct description in the required format
      const formattedDescription = `Job Details    
Hiring | ${formData.title} - ${formData.location}
Description    
${formData.description}
Location: ${formData.location}
Exp - ${formData.experience}
Company: ${formData.companyName}
Openings: ${formData.openings}
Email ID : ${formData.contactEmail}
Phone: ${formData.phone}
Skills Required: ${skillsArray.join(', ')}`;

      const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('location', formData.location);
      payload.append('experience', formData.experience);
      payload.append('companyName', formData.companyName);
      payload.append('company', formData.companyName);
      payload.append('openings', formData.openings);
      payload.append('contactEmail', formData.contactEmail);
      payload.append('email', formData.contactEmail);
      payload.append('phone', formData.phone);
      payload.append('description', formattedDescription);
      payload.append('jobType', 'full-time');
      payload.append('skills', JSON.stringify(skillsArray));

      const response = await axios.post(`${API_URL}/jobs`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.status === 201) {
        setSuccess('Job posted successfully!');
        setTimeout(() => {
          navigate('/jobs');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2 className="auth-title">Please Login</h2>
          <p className="auth-subtitle">You need to be logged in to post a job.</p>
          <p style={{ textAlign: 'center', marginTop: '20px' }}>
            <Link to="/login" className="btn btn-primary" style={{ marginRight: '10px' }}>Login</Link>
            <Link to="/register" className="btn btn-outline">Sign Up</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="post-job-page">
      <div className="container" style={{ padding: '40px 20px', maxWidth: '800px' }}>
        <div className="job-detail-card">
          <div className="job-detail-header" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <h1 className="job-detail-title">Post a New Job</h1>
            <p style={{ opacity: 0.9 }}>Fill in the details below to create your job posting</p>
          </div>

          <div className="job-detail-body">
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Job Title *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Data Center Technician"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Location *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Hyderabad (WFO)"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Experience Required *</label>
                <select
                  className="form-control"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  required
                >
                  <option value="entry">Entry Level (0-1 years)</option>
                  <option value="mid">Mid Level (2-5 years)</option>
                  <option value="senior">Senior Level (5+ years)</option>
                  <option value="lead">Lead (7+ years)</option>
                  <option value="executive">Executive (10+ years)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Company Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Akiko Sherman Infotech Pvt. Ltd."
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Openings *</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g., 4"
                  name="openings"
                  value={formData.openings}
                  onChange={handleChange}
                  required
                  min="1"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Email *</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="e.g., hr@company.com"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone *</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="e.g., +1 555 123 4567"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Skills Required (comma separated) *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., JavaScript, React, Node.js, MongoDB"
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Job Description *</label>
                <textarea
                  className="form-control"
                  placeholder="Describe the job responsibilities, requirements, and what makes this opportunity great..."
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  style={{ minHeight: '150px' }}
                />
                <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
                  Provide details about the role, responsibilities, and what you are looking for in a candidate.
                </small>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/jobs')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ flex: 1 }}
                >
                  {loading ? 'Posting...' : 'Submit and Post Job'}
                </button>
              </div>

            </form>

            {/* Preview Section */}
            {formData.title && formData.description && (
              <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '15px', color: '#333' }}>Preview</h3>
                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
                  <h4 style={{ color: '#667eea', marginBottom: '10px' }}>
                    Hiring | {formData.title} - {formData.location}
                  </h4>
                  <p style={{ whiteSpace: 'pre-wrap', color: '#555', marginBottom: '15px' }}>
                    {formData.description}
                  </p>
                  <p style={{ color: '#666', fontSize: '0.9rem' }}>
                    <strong>Location:</strong> {formData.location}<br />
                    <strong>Exp:</strong> {formData.experience}<br />
                    <strong>Company:</strong> {formData.companyName}<br />
                    <strong>Openings:</strong> {formData.openings}<br />
                    <strong>Email ID:</strong> {formData.contactEmail}<br />
                    <strong>Phone:</strong> {formData.phone}<br />
                    <strong>Skills:</strong> {formData.skills}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostJob;
