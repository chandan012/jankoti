import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import useSeo from '../hooks/useSeo';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const PodcastView = () => {
  const { isAuthenticated, isOrganization } = useAuth();
  const navigate = useNavigate();
  const [podcasts, setPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(null);
  const metaTitle = 'Startup Podcast & Founder Stories | Entrepreneur by Jankoti.com';
  const metaDescription = 'Listen to founder interviews, startup journeys and entrepreneur stories. Get real insights from startups, SMEs and business leaders on Entrepreneur by Jankoti.com.';
  const metaKeywords = 'startup podcast, entrepreneur podcast, founder interviews, business stories, startup journey, leadership podcast';

  useSeo({
    title: metaTitle,
    description: metaDescription,
    keywords: metaKeywords
  });

  useEffect(() => {
    if (isAuthenticated && isOrganization) {
      fetchMyPodcasts();
    } else {
      fetchPodcasts();
    }
  }, [isAuthenticated, isOrganization]);

  const fetchMyPodcasts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/podcast/my-podcasts`);
      setPodcasts(response.data.podcasts);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch podcast listings');
    } finally {
      setLoading(false);
    }
  };

  const fetchPodcasts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/podcast`, {
        params: { limit: 50 }
      });
      setPodcasts(response.data.podcasts || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch podcast listings');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePodcast = async (id) => {
    if (!window.confirm('Are you sure you want to delete this podcast listing?')) {
      return;
    }

    try {
      setDeleteLoading(id);
      await axios.delete(`${API_URL}/podcast/${id}`);
      setPodcasts(podcasts.filter(item => item._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete podcast');
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

  const getPlatformLabel = (platform) => {
    const labels = {
      'spotify': 'Spotify',
      'apple-podcast': 'Apple Podcasts',
      'google-podcast': 'Google Podcasts',
      'youtube': 'YouTube',
      'amazon-music': 'Amazon Music',
      'other': 'Other'
    };
    return labels[platform] || platform;
  };

  const showPostButton = isOrganization && !loading && podcasts.length > 0;

  return (
    <div className="job-view-page">
      <section className="hero" style={{ padding: '40px 20px' }}>
        <h1 className="hero-title" style={{ fontSize: '2rem' }}>
          Latest Startup Podcast Episodes
        </h1>
        <h2 className="hero-subtitle" style={{ fontSize: '1rem', marginBottom: '20px' }}>
          Startup Podcast & Founder Stories | Entrepreneur by Jankoti.com
        </h2>
        {showPostButton && (
          <button
            className="btn btn-primary"
            onClick={() => navigate('/post-podcast')}
            style={{ padding: '12px 30px' }}
          >
            + Post a New Podcast
          </button>
        )}
      </section>

      <div className="container" style={{ padding: '40px 20px' }}>
        {error && <div className="alert alert-danger">{error}</div>}

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : podcasts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎙️</div>
            <h3 className="empty-state-title">
              {isOrganization ? 'No Podcasts Posted Yet' : 'No Podcast Opportunities'}
            </h3>
            <p className="empty-state-text">
              {isOrganization
                ? "You haven't posted any podcast listings yet. Click the button below to create your first podcast guest opportunity."
                : 'Check back later for new opportunities.'}
            </p>
            {isOrganization && (
              <button
                className="btn btn-primary"
                onClick={() => navigate('/post-podcast')}
                style={{ marginTop: '20px' }}
              >
                Post Your First Podcast
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="job-list-header" style={{ marginBottom: '30px' }}>
              <h2 className="job-list-title">
                {podcasts.length} Podcast{podcasts.length !== 1 ? 's' : ''} {isOrganization ? 'Posted' : 'Available'}
              </h2>
            </div>

            <div className="job-list">
              {podcasts.map(item => (
                <div key={item._id} className="job-card">
                  {item.coverImageUrl && (
                    <div className="podcast-cover">
                      <img src={item.coverImageUrl} alt={`${item.podcastName} cover`} />
                    </div>
                  )}
                  <div className="job-card-header">
                    <div>
                      <Link to={`/podcast/${item._id}`}>
                        <h3 className="job-card-title">{item.title || item.podcastName}</h3>
                      </Link>
                      <p className="job-card-company">{item.podcastName}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span className={`badge ${getStatusBadge(item.status)}`}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                      <span className="badge badge-primary">
                        {getPlatformLabel(item.platform)}
                      </span>
                    </div>
                  </div>

                  <div className="job-card-location">
                    🎙️ {item.podcastName}
                  </div>

                  <div className="job-card-details">
                    {item.guestName && (
                      <span className="job-detail-item">
                        👥 Guest: {item.guestName}
                      </span>
                    )}
                    
                    <span className="job-detail-item">
                      {item.views} views
                    </span>
                    <span className="job-detail-item">
                      📅 {formatDate(item.createdAt)}
                    </span>
                  </div>

                  {item.episodeLink && (
                    <div style={{ marginTop: '10px' }}>
                      <a 
                        href={item.episodeLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#007bff', textDecoration: 'none' }}
                      >
                        🔗 Listen Here
                      </a>
                    </div>
                  )}

                  <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <Link to={`/podcast/${item._id}`} className="btn btn-primary btn-sm">
                      View Details
                    </Link>
                    {isOrganization && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeletePodcast(item._id)}
                        disabled={deleteLoading === item._id}
                      >
                        {deleteLoading === item._id ? 'Deleting...' : 'Delete'}
                      </button>
                    )}
                  </div>

                  {isOrganization && item.applications && item.applications.length > 0 && (
                    <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                      <span style={{ color: '#666', fontSize: '0.9rem' }}>
                        📋 {item.applications.length} inquiry{item.applications.length !== 1 ? 'ies' : ''} received
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

export default PodcastView;
