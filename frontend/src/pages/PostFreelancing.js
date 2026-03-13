import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const PostFreelancing = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    companyName: '',
    email: '',
    projectType: 'fixed-price',
    skills: '',
    projectScope: 'medium',
    projectDuration: '',
    weeklyHours: '',
    startDate: '',
    experience: 'mid',
    rateMin: '',
    rateMax: '',
    rateType: 'hourly',
    location: '',
    deliverables: '',
    deadline: ''
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
      
      const formattedDescription = `Freelance Project: ${formData.title}
${formData.description}

Project Details:
- Type: ${formData.projectType}
- Scope: ${formData.projectScope}
- Experience Level: ${formData.experience}
- ${formData.rateMin || formData.rateMax ? `Rate: ${formData.rateMin ? '$' + formData.rateMin : ''} ${formData.rateMax ? '- $' + formData.rateMax : ''} ${formData.rateType}` : 'Negotiable'}
- Location: ${formData.location || 'Remote'}
${formData.projectDuration ? `- Duration: ${formData.projectDuration}` : ''}
${formData.weeklyHours ? `- Weekly Hours: ${formData.weeklyHours}` : ''}
${formData.startDate ? `- Start Date: ${formData.startDate}` : ''}
${formData.deadline ? `- Deadline: ${formData.deadline}` : ''}

${formData.deliverables ? `Deliverables:\n${formData.deliverables}` : ''}

Interested? Contact: ${formData.email}`;

      const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('description', formattedDescription);
      payload.append('companyName', formData.companyName);
      payload.append('email', formData.email);
      payload.append('projectType', formData.projectType);
      payload.append('skills', JSON.stringify(skillsArray));
      payload.append('projectScope', formData.projectScope);
      payload.append('projectDuration', formData.projectDuration);
      payload.append('weeklyHours', formData.weeklyHours);
      payload.append('startDate', formData.startDate);
      payload.append('experience', formData.experience);
      payload.append('rate', JSON.stringify({
        min: formData.rateMin ? parseFloat(formData.rateMin) : undefined,
        max: formData.rateMax ? parseFloat(formData.rateMax) : undefined,
        rateType: formData.rateType
      }));
      payload.append('location', formData.location);
      payload.append('deliverables', formData.deliverables);
      payload.append('deadline', formData.deadline);

      const response = await axios.post(`${API_URL}/freelancing`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.status === 201) {
        setSuccess('Freelancing project posted successfully!');
        setTimeout(() => {
          navigate('/freelancing-view');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2 className="auth-title">Please Login</h2>
          <p className="auth-subtitle">You need to be logged in to post a freelancing project.</p>
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
          <div className="job-detail-header" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <h1 className="job-detail-title">Post a Freelance Project</h1>
            <p style={{ opacity: 0.9 }}>Fill in the details below to create your project posting</p>
          </div>

          <div className="job-detail-body">
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Project Title *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Build a React E-commerce Website"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Company/Client Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Acme Corp"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Email *</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="e.g., contact@company.com"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Project Type *</label>
                  <select
                    className="form-control"
                    name="projectType"
                    value={formData.projectType}
                    onChange={handleChange}
                    required
                  >
                    <option value="one-time">One-time Project</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="hourly">Hourly Rate</option>
                    <option value="fixed-price">Fixed Price</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Experience Level *</label>
                  <select
                    className="form-control"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    required
                  >
                    <option value="entry">Entry Level</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior Level</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Project Scope</label>
                  <select
                    className="form-control"
                    name="projectScope"
                    value={formData.projectScope}
                    onChange={handleChange}
                  >
                    <option value="small">Small (quick task)</option>
                    <option value="medium">Medium (multi-week)</option>
                    <option value="large">Large (multi-month)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Project Duration</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., 4-6 weeks"
                    name="projectDuration"
                    value={formData.projectDuration}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Budget/Rate</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Min"
                    name="rateMin"
                    value={formData.rateMin}
                    onChange={handleChange}
                    style={{ flex: 1 }}
                  />
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Max"
                    name="rateMax"
                    value={formData.rateMax}
                    onChange={handleChange}
                    style={{ flex: 1 }}
                  />
                  <select
                    className="form-control"
                    name="rateType"
                    value={formData.rateType}
                    onChange={handleChange}
                    style={{ width: '120px' }}
                  >
                    <option value="hourly">/hour</option>
                    <option value="monthly">/month</option>
                    <option value="total">total</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Remote, NYC, etc."
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Deadline</label>
                  <input
                    type="date"
                    className="form-control"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Weekly Hours</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., 10-20 hrs/week"
                    name="weeklyHours"
                    value={formData.weeklyHours}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Required Skills (comma separated)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., React, Node.js, MongoDB, TypeScript"
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Expected Deliverables</label>
                <textarea
                  className="form-control"
                  placeholder="List the expected outcomes or milestones..."
                  name="deliverables"
                  value={formData.deliverables}
                  onChange={handleChange}
                  style={{ minHeight: '90px' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Project Description *</label>
                <textarea
                  className="form-control"
                  placeholder="Describe the project requirements, deliverables, and expectations..."
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  style={{ minHeight: '120px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/freelancing-view')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ flex: 1 }}
                >
                  {loading ? 'Posting...' : 'Submit and Post Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostFreelancing;
