import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const PodcastDetail = () => {
  const { id } = useParams();
  const [podcast, setPodcast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPodcast();
  }, [id]);

  const fetchPodcast = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/podcast/${id}`);
      setPodcast(response.data.podcast);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch details');
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
          <Link to="/podcast-view" className="btn btn-primary" style={{ marginTop: '20px' }}>
            Back to Podcasts
          </Link>
        </div>
      </div>
    );
  }

  if (!podcast) {
    return (
      <div className="job-detail-page">
        <div className="container" style={{ padding: '40px 20px', maxWidth: '900px' }}>
          <div className="alert alert-danger">Podcast not found</div>
          <Link to="/podcast-view" className="btn btn-primary" style={{ marginTop: '20px' }}>
            Back to Podcasts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="job-detail-page">
      <div className="container" style={{ padding: '40px 20px', maxWidth: '900px', margin: '0 auto' }}>
        <Link to="/podcast-view" style={{ display: 'inline-flex', alignItems: 'center', color: '#007bff', marginBottom: '20px' }}>
          ← Back to Podcasts
        </Link>

        <div className="job-detail-card">
          {podcast.coverImageUrl && (
            <div className="podcast-cover podcast-cover--detail">
              <img src={podcast.coverImageUrl} alt={`${podcast.podcastName} cover`} />
            </div>
          )}

          <div className="job-detail-body">
            <div className="podcast-detail-header">
              <h1 className="podcast-detail-title">{podcast.title || podcast.podcastName}</h1>
              <p className="podcast-detail-subtitle">
                Channel: {podcast.podcastName}
              </p>
              <div className="podcast-detail-meta">
                <span>🎙️ {getPlatformLabel(podcast.platform)}</span>
                <span>{podcast.views} views</span>
                <span>Posted: {formatDate(podcast.createdAt)}</span>
              </div>
            </div>
            <div className="job-detail-section">
              <h3>Podcast Description</h3>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', color: '#555' }}>
                {podcast.description}
              </div>
            </div>

            {podcast.guestName && (
              <div className="job-detail-section">
                <h3>Guest Name</h3>
                <p>{podcast.guestName}</p>
              </div>
            )}

            {podcast.aboutGuest && (
              <div className="job-detail-section">
                <h3>About Guest</h3>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', color: '#555' }}>
                  {podcast.aboutGuest}
                </div>
              </div>
            )}

            {podcast.episodeLink && (
              <div className="job-detail-section">
                <h3>Episode Link</h3>
                <p>
                  <a href={podcast.episodeLink} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff' }}>
                    🎧 Listen Now
                  </a>
                </p>
              </div>
            )}

            {podcast.ownerFirstName && (
              <div className="job-detail-section">
                <h3>Owner</h3>
                <p>{podcast.ownerFirstName}</p>
              </div>
            )}

            <div className="job-detail-section">
              <h3 style={{ marginBottom: '15px' }}>Podcast Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div><strong>Podcast Title:</strong> {podcast.title || podcast.podcastName}</div>
                <div><strong>Podcast Name:</strong> {podcast.podcastName}</div>
                <div><strong>Platform:</strong> {getPlatformLabel(podcast.platform)}</div>
                {podcast.guestName && <div><strong>Guest:</strong> {podcast.guestName}</div>}
                {podcast.ownerFirstName && <div><strong>Owner:</strong> {podcast.ownerFirstName}</div>}
                <div><strong>Posted:</strong> {formatDate(podcast.createdAt)}</div>
              </div>
            </div>

            <div style={{ marginTop: '30px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              {podcast.episodeLink && (
                <a href={podcast.episodeLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">
                  🎧 Listen Now
                </a>
              )}
              <button
                className="btn btn-outline btn-lg"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied to clipboard!');
                }}
              >
                Share
              </button>
            </div>

            {podcast.postedBy && (
              <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <h4 style={{ marginBottom: '10px' }}>Posted by</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  {podcast.postedBy.profilePicture ? (
                    <img
                      src={podcast.postedBy.profilePicture}
                      alt={podcast.postedBy.name}
                      style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      backgroundColor: '#fa709a',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      fontWeight: 'bold'
                    }}>
                      {podcast.postedBy.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p style={{ fontWeight: '600', marginBottom: '5px' }}>{podcast.postedBy.name}</p>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>{podcast.postedBy.email}</p>
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

export default PodcastDetail;
