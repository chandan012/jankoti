import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import useSeo from '../hooks/useSeo';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const FreelancingView = () => {
  const { isAuthenticated, isOrganization } = useAuth();
  const navigate = useNavigate();
  const [freelancing, setFreelancing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [skillQuery, setSkillQuery] = useState('');
  const [activeSkillQuery, setActiveSkillQuery] = useState('');
  const metaTitle = 'Hire Freelancers or Find Freelance Work | Entrepreneur by Jankoti.com';
  const metaDescription = 'Find freelance projects or hire freelancers for your startup. Connect with student freelancers, developers, designers and marketers on Entrepreneur by Jankoti.com.';
  const metaKeywords = 'freelancing platform, hire freelancers, freelance jobs, student freelancing, remote freelance work, freelancer marketplace';

  useSeo({
    title: metaTitle,
    description: metaDescription,
    keywords: metaKeywords
  });

  useEffect(() => {
    if (isAuthenticated && isOrganization) {
      fetchMyFreelancing();
    } else {
      fetchFreelancing();
    }
  }, [isAuthenticated, isOrganization]);

  const fetchMyFreelancing = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/freelancing/my-freelancing`);
      setFreelancing(response.data.freelancing);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch freelancing projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchFreelancing = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/freelancing`, {
        params: { limit: 50 }
      });
      setFreelancing(response.data.freelancing || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch freelancing projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFreelancing = async (id) => {
    if (!window.confirm('Are you sure you want to delete this freelancing project?')) {
      return;
    }

    try {
      setDeleteLoading(id);
      await axios.delete(`${API_URL}/freelancing/${id}`);
      setFreelancing(freelancing.filter(item => item._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete project');
    } finally {
      setDeleteLoading(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatRate = (rate) => {
    if (!rate?.min && !rate?.max) return 'Negotiable';
    if (rate.min && rate.max) {
      return `$${rate.min.toLocaleString()} - $${rate.max.toLocaleString()}`;
    }
    if (rate.min) return `$${rate.min.toLocaleString()}+`;
    return `Up to $${rate.max.toLocaleString()}`;
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'badge-success',
      closed: 'badge-danger',
      draft: 'badge-warning'
    };
    return badges[status] || 'badge-primary';
  };

  const getProjectTypeLabel = (type) => {
    const labels = {
      'one-time': 'One-time Project',
      'ongoing': 'Ongoing',
      'hourly': 'Hourly',
      'fixed-price': 'Fixed Price'
    };
    return labels[type] || type;
  };

  const getExperienceLabel = (exp) => {
    const labels = {
      'entry': 'Entry Level',
      'mid': 'Mid Level',
      'senior': 'Senior Level',
      'expert': 'Expert'
    };
    return labels[exp] || exp;
  };

  const handleSkillSearch = (event) => {
    event.preventDefault();
    setActiveSkillQuery(skillQuery.trim());
  };

  const normalizedQuery = activeSkillQuery.toLowerCase();
  const filteredFreelancing = normalizedQuery
    ? freelancing.filter(item =>
        (item.skills || []).some(skill => skill.toLowerCase().includes(normalizedQuery))
      )
    : freelancing;

  const showPostButton = isOrganization && !loading && freelancing.length > 0;

  return (
    <div className="job-view-page">
      <section className="hero hero--plain" style={{ padding: '40px 20px' }}>
        <h1 className="hero-title" style={{ fontSize: '2rem' }}>
          Hire Freelancers for Startup and Business Needs
        </h1>
        <h2 className="hero-subtitle" style={{ fontSize: '1rem', marginBottom: '20px' }}>
          Hire Freelancers or Find Freelance Work
        </h2>
        {showPostButton && (
          <button
            className="btn btn-primary"
            onClick={() => navigate('/post-freelancing')}
            style={{ padding: '12px 30px' }}
          >
            + Post a New Project
          </button>
        )}
      </section>

      <div className="container" style={{ padding: '40px 20px' }}>
        <form className="freelancing-search" onSubmit={handleSkillSearch}>
          <input
            type="text"
            placeholder="Search by skill (e.g., React, Figma, Python)"
            value={skillQuery}
            onChange={(event) => setSkillQuery(event.target.value)}
            aria-label="Search projects by skill"
          />
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>

        {error && <div className="alert alert-danger">{error}</div>}

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : freelancing.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💼</div>
            <h3 className="empty-state-title">
              {isOrganization ? 'No Projects Posted Yet' : 'No Projects Available'}
            </h3>
            <p className="empty-state-text">
              {isOrganization
                ? "You haven't posted any freelance projects yet. Click the button below to create your first project listing."
                : 'Check back later for new opportunities.'}
            </p>
            {isOrganization && (
              <button
                className="btn btn-primary"
                onClick={() => navigate('/post-freelancing')}
                style={{ marginTop: '20px' }}
              >
                Post Your First Project
              </button>
            )}
          </div>
        ) : filteredFreelancing.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔎</div>
            <h3 className="empty-state-title">No Matching Skills</h3>
            <p className="empty-state-text">
              We couldn't find projects matching "{activeSkillQuery}". Try a different skill keyword.
            </p>
            <button
              className="btn btn-outline"
              onClick={() => {
                setSkillQuery('');
                setActiveSkillQuery('');
              }}
              style={{ marginTop: '20px' }}
            >
              Clear Search
            </button>
          </div>
        ) : (
          <>
            <div className="job-list-header" style={{ marginBottom: '30px' }}>
              <h2 className="job-list-title">
                {filteredFreelancing.length} Project{filteredFreelancing.length !== 1 ? 's' : ''} {isOrganization ? 'Posted' : 'Available'}
              </h2>
            </div>

            <div className="job-list">
              {filteredFreelancing.map(item => (
                <div key={item._id} className="job-card">
                  <div className="job-card-header">
                    <div>
                      <Link to={`/freelancing/${item._id}`}>
                        <h3 className="job-card-title">{item.title}</h3>
                      </Link>
                      <p className="job-card-company">{item.companyName}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span className={`badge ${getStatusBadge(item.status)}`}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                      <span className="badge badge-primary">
                        {getProjectTypeLabel(item.projectType)}
                      </span>
                    </div>
                  </div>

                  <div className="job-card-location">
                    {item.location || 'Remote'}
                  </div>

                  <div className="job-card-details">
                    <span className="job-detail-item">
                      {getExperienceLabel(item.experience)}
                    </span>
                    <span className="job-detail-item job-salary">
                      {formatRate(item.rate)}
                    </span>
                    <span className="job-detail-item">
                      {item.views} views
                    </span>
                    <span className="job-detail-item">
                      📅 {formatDate(item.createdAt)}
                    </span>
                  </div>

                  {item.skills && item.skills.length > 0 && (
                    <div className="job-skills">
                      {item.skills.slice(0, 5).map((skill, index) => (
                        <span key={index} className="skill-tag">{skill}</span>
                      ))}
                      {item.skills.length > 5 && (
                        <span className="skill-tag">+{item.skills.length - 5} more</span>
                      )}
                    </div>
                  )}

                  <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <Link to={`/freelancing/${item._id}`} className="btn btn-primary btn-sm">
                      View Details
                    </Link>
                    {isOrganization && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteFreelancing(item._id)}
                        disabled={deleteLoading === item._id}
                      >
                        {deleteLoading === item._id ? 'Deleting...' : 'Delete'}
                      </button>
                    )}
                  </div>

                  {isOrganization && item.applications && item.applications.length > 0 && (
                    <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                      <span style={{ color: '#666', fontSize: '0.9rem' }}>
                        📋 {item.applications.length} application{item.applications.length !== 1 ? 's' : ''} received
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default FreelancingView;
