import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const PostPodcast = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    description: '',
    podcastName: '',
    episodeLink: '',
    guestName: '',
    guestLinkedin: '',
    aboutGuest: ''
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
      if (!user?.email) {
        setError('Your account email is required to submit a podcast listing.');
        setLoading(false);
        return;
      }

      const resolvedTitle = formData.podcastName?.trim() || 'Podcast Listing';
      const resolvedEmail = user?.email || '';

      const payload = new FormData();
      payload.append('title', resolvedTitle);
      payload.append('description', formData.description);
      payload.append('podcastName', formData.podcastName);
      payload.append('email', resolvedEmail);
      payload.append('episodeLink', formData.episodeLink);
      payload.append('guestName', formData.guestName);
      payload.append('guestLinkedin', formData.guestLinkedin);
      payload.append('aboutGuest', formData.aboutGuest);

      const response = await axios.post(`${API_URL}/podcast`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.status === 201) {
        setSuccess('Podcast listed successfully!');
        setTimeout(() => {
          navigate('/podcast-view');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to list podcast. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2 className="auth-title">Please Login</h2>
          <p className="auth-subtitle">You need to be logged in to list a podcast.</p>
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
          <div className="job-detail-header" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
            <h1 className="job-detail-title">List Your Podcast</h1>
            <p style={{ opacity: 0.9 }}>Invite guests and promote your podcast</p>
          </div>

          <div className="job-detail-body">
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Podcast Summary *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., The Tech Startup Show focuses on founder stories"
                  name="podcastName"
                  value={formData.podcastName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Guest Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Jane Doe"
                  name="guestName"
                  value={formData.guestName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Guest LinkedIn ID</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="LinkedIn profile ID or URL"
                  name="guestLinkedin"
                  value={formData.guestLinkedin}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Podcast Link (YouTube preferred)</label>
                <input
                  type="url"
                  className="form-control"
                  placeholder="https://www.youtube.com/watch?v=..."
                  name="episodeLink"
                  value={formData.episodeLink}
                  onChange={handleChange}
                />
                
              </div>

              <div className="form-group">
                <label className="form-label">Podcast Description *</label>
                <textarea
                  className="form-control"
                  placeholder="Describe your podcast, what topics you cover, and what you're looking for in guests..."
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  style={{ minHeight: '120px' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">About Guest</label>
                <textarea
                  className="form-control"
                  placeholder="Tell us about the guest and what topics they will cover..."
                  name="aboutGuest"
                  value={formData.aboutGuest}
                  onChange={handleChange}
                  style={{ minHeight: '100px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/podcast-view')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ flex: 1 }}
                >
                  {loading ? 'Listing...' : 'Submit and List Podcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostPodcast;
