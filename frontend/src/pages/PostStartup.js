import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const PostStartup = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [founderImageFile, setFounderImageFile] = useState(null);
  const [coFounderImageFile, setCoFounderImageFile] = useState(null);

  const [formData, setFormData] = useState({
    startupName: '',
    companyName: '',
    email: '',
    industry: '',
    fundingStage: 'bootstrapped',
    teamSize: '1-10',
    website: '',
    location: '',
    contactNumber: '',
    founderName: '',
    coFounderName: '',
    aboutStartup: '',
    socialLinkedin: '',
    socialTwitter: '',
    socialInstagram: '',
    socialFacebook: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files && e.target.files[0];
    setLogoFile(file || null);
  };

  const handleFounderImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    setFounderImageFile(file || null);
  };

  const handleCoFounderImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    setCoFounderImageFile(file || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const normalizedContact = formData.contactNumber.replace(/\D/g, '');
      if (!/^\d{10}$/.test(normalizedContact)) {
        setError('Contact number must be 10 digits.');
        setLoading(false);
        return;
      }
      if (!formData.founderName.trim()) {
        setError('Founder name is required.');
        setLoading(false);
        return;
      }

      const payload = new FormData();
      payload.append('description', formData.aboutStartup);
      payload.append('startupName', formData.startupName);
      payload.append('companyName', formData.companyName);
      payload.append('email', formData.email);
      payload.append('contactNumber', normalizedContact);
      payload.append('industry', formData.industry);
      payload.append('fundingStage', formData.fundingStage);
      payload.append('teamSize', formData.teamSize);
      payload.append('website', formData.website);
      payload.append('location', formData.location);
      payload.append('founderName', formData.founderName);
      payload.append('coFounderName', formData.coFounderName);
      payload.append('socialLinks', JSON.stringify({
        website: formData.website,
        linkedin: formData.socialLinkedin,
        twitter: formData.socialTwitter,
        instagram: formData.socialInstagram,
        facebook: formData.socialFacebook
      }));
      if (founderImageFile) {
        payload.append('founderImage', founderImageFile);
      }
      if (coFounderImageFile) {
        payload.append('coFounderImage', coFounderImageFile);
      }
      if (logoFile) {
        payload.append('logo', logoFile);
      }

      const response = await axios.post(`${API_URL}/startup`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.status === 201) {
        setSuccess('Startup listed successfully!');
        setTimeout(() => {
          navigate('/startup-view');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to list startup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2 className="auth-title">Please Login</h2>
          <p className="auth-subtitle">You need to be logged in to list a startup.</p>
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
          <div className="job-detail-header" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <h1 className="job-detail-title">List your Startup!!</h1>
            <p style={{ opacity: 0.9 }}>Showcase your startup to potential investors and talent</p>
          </div>

          <div className="job-detail-body">
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Startup Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., TechVenture Inc."
                    name="startupName"
                    value={formData.startupName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Legal company name"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Founder Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Priya Sharma"
                    name="founderName"
                    value={formData.founderName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Co-founder Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Alex Carter"
                    name="coFounderName"
                    value={formData.coFounderName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Contact Email *</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="e.g., founder@startup.com"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Industry *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Fintech, HealthTech, AI/ML"
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Number *</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="10-digit mobile number"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={(event) => {
                      const digitsOnly = event.target.value.replace(/\D/g, '').slice(0, 10);
                      setFormData(prev => ({ ...prev, contactNumber: digitsOnly }));
                    }}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Founder Image</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handleFounderImageChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Co-founder Image</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handleCoFounderImageChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Startup Logo</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handleLogoChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Funding Stage *</label>
                  <select
                    className="form-control"
                    name="fundingStage"
                    value={formData.fundingStage}
                    onChange={handleChange}
                    required
                  >
                    <option value="bootstrapped">Bootstrapped</option>
                    <option value="pre-seed">Pre-Seed</option>
                    <option value="seed">Seed</option>
                    <option value="series-a">Series A</option>
                    <option value="series-b">Series B</option>
                    <option value="profitable">Profitable</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Team Size *</label>
                  <select
                    className="form-control"
                    name="teamSize"
                    value={formData.teamSize}
                    onChange={handleChange}
                    required
                  >
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="500+">500+ employees</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Website</label>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://yourstartup.com"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., San Francisco, Remote"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">About the Startup *</label>
                <textarea
                  className="form-control"
                  placeholder="Tell us about the startup, mission, product, and vision..."
                  name="aboutStartup"
                  value={formData.aboutStartup}
                  onChange={handleChange}
                  required
                  style={{ minHeight: '120px' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Social Media Links</label>
                <div className="form-row">
                  <div className="form-group">
                    <input
                      type="url"
                      className="form-control"
                      placeholder="LinkedIn URL"
                      name="socialLinkedin"
                      value={formData.socialLinkedin}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="url"
                      className="form-control"
                      placeholder="Twitter/X URL"
                      name="socialTwitter"
                      value={formData.socialTwitter}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <input
                      type="url"
                      className="form-control"
                      placeholder="Instagram URL"
                      name="socialInstagram"
                      value={formData.socialInstagram}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="url"
                      className="form-control"
                      placeholder="Facebook URL"
                      name="socialFacebook"
                      value={formData.socialFacebook}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/startup-view')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ flex: 1 }}
                >
                  {loading ? 'Listing...' : 'Submit and List Startup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostStartup;
