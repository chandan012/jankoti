import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import useSeo from '../hooks/useSeo';

const API_URL = process.env.REACT_APP_API_URL || '/api';
const API_BASE_URL = API_URL.replace(/\/api\/?$/, '');

const StartupView = () => {
  const { isAuthenticated, isOrganization } = useAuth();
  const navigate = useNavigate();
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(null);
  const metaTitle = 'Startup Directory India | List Your Startup on Entrepreneur by Jankoti.com';
  const metaDescription = 'Showcase your startup, SME or student business on Entrepreneur by Jankoti.com. Create your startup profile, promote your brand and connect with the startup ecosystem.';
  const metaKeywords = 'startup directory, business listing, SME directory, student startup, startup registration, entrepreneur platform';

  useSeo({
    title: metaTitle,
    description: metaDescription,
    keywords: metaKeywords
  });

  useEffect(() => {
    if (isAuthenticated && isOrganization) {
      fetchMyStartups();
    } else {
      fetchStartups();
    }
  }, [isAuthenticated, isOrganization]);

  const fetchMyStartups = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/startup/my-startups`);
      setStartups(response.data.startups);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch startup opportunities');
    } finally {
      setLoading(false);
    }
  };

  const fetchStartups = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/startup`, {
        params: { limit: 50 }
      });
      setStartups(response.data.startups || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch startup opportunities');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStartup = async (id) => {
    if (!window.confirm('Are you sure you want to delete this startup opportunity?')) {
      return;
    }

    try {
      setDeleteLoading(id);
      await axios.delete(`${API_URL}/startup/${id}`);
      setStartups(startups.filter(item => item._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete startup');
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

  const getStatusBadge = (status) => {
    const badges = {
      active: 'badge-success',
      closed: 'badge-danger',
      draft: 'badge-warning'
    };
    return badges[status] || 'badge-primary';
  };

  const getFundingStageLabel = (stage) => {
    const labels = {
      'pre-seed': 'Pre-Seed',
      'seed': 'Seed',
      'series-a': 'Series A',
      'series-b': 'Series B',
      'profitable': 'Profitable',
      'bootstrapped': 'Bootstrapped'
    };
    return labels[stage] || stage;
  };

  const getTeamSizeLabel = (size) => {
    const labels = {
      '1-10': '1-10 employees',
      '11-50': '11-50 employees',
      '51-200': '51-200 employees',
      '201-500': '201-500 employees',
      '500+': '500+ employees'
    };
    return labels[size] || size;
  };

  const resolveImageUrl = (url) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('data:')) {
      return trimmed;
    }
    const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${API_BASE_URL}${normalizedPath}`;
  };

  const showPostButton = isOrganization && !loading && startups.length > 0;

  return (
    <div className="job-view-page">
      <section className="hero" style={{ padding: '40px 20px' }}>
        <h1 className="hero-title" style={{ fontSize: '2rem' }}>
          List Your Startup or Business Profile
        </h1>
        <h2 className="hero-subtitle" style={{ fontSize: '1rem', marginBottom: '20px' }}>
          Startup Directory India | List Your Startup on Entrepreneur by Jankoti.com
        </h2>
        {showPostButton && (
          <button
            className="btn btn-primary"
            onClick={() => navigate('/post-startup')}
            style={{ padding: '12px 30px' }}
          >
            + Post a New Opportunity
          </button>
        )}
      </section>

      <div className="container" style={{ padding: '40px 20px' }}>
        {error && <div className="alert alert-danger">{error}</div>}

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : startups.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🚀</div>
            <h3 className="empty-state-title">
              {isOrganization ? 'No Startups Posted Yet' : 'No Opportunities Available'}
            </h3>
            <p className="empty-state-text">
              {isOrganization
                ? "You haven't posted any startup opportunities yet. Click the button below to create your first listing."
                : 'Check back later for new opportunities.'}
            </p>
            {isOrganization && (
              <button
                className="btn btn-primary"
                onClick={() => navigate('/post-startup')}
                style={{ marginTop: '20px' }}
              >
                Post Your First Startup
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="job-list-header" style={{ marginBottom: '30px' }}>
              <h2 className="job-list-title">
                {startups.length} Startup{startups.length !== 1 ? 's' : ''} {isOrganization ? 'Posted' : 'Available'}
              </h2>
            </div>

            <div className="job-list">
              {startups.map(item => {
                const logoSrc = resolveImageUrl(item.logoUrl);
                return (
                <div key={item._id} className="job-card">
                  <div className="job-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {logoSrc && (
                        <img
                          src={logoSrc}
                          alt={`${item.startupName} logo`}
                          style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '12px',
                            objectFit: 'contain',
                            background: '#f3f4f6',
                            padding: '6px'
                          }}
                        />
                      )}
                      <div>
                        <Link to={`/startup/${item._id}`}>
                          <h3 className="job-card-title">{item.startupName}</h3>
                        </Link>
                        <p className="job-card-company">{item.startupName}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span className={`badge ${getStatusBadge(item.status)}`}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="job-card-location">
                    {item.location || 'Remote'}
                  </div>

                  <div className="job-card-details">
                    <span className="job-detail-item">
                      🏢 {item.industry}
                    </span>
                    <span className="job-detail-item job-salary">
                      💵 {getFundingStageLabel(item.fundingStage)}
                    </span>
                    <span className="job-detail-item">
                      👥 {getTeamSizeLabel(item.teamSize)}
                    </span>
                    {item.founderName && (
                      <span className="job-detail-item">
                        👤 {item.founderName}
                      </span>
                    )}
                    <span className="job-detail-item">
                      {item.views} views
                    </span>
                    <span className="job-detail-item">
                      📅 {formatDate(item.createdAt)}
                    </span>
                  </div>

                  <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <Link to={`/startup/${item._id}`} className="btn btn-primary btn-sm">
                      View Details
                    </Link>
                    {isOrganization && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteStartup(item._id)}
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
                );
              })}
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default StartupView;
