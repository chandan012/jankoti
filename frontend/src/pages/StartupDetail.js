import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || '/api';
const API_BASE_URL = API_URL.replace(/\/api\/?$/, '');

const StartupDetail = () => {
  const { id } = useParams();
  const { isAuthenticated, isCandidate } = useAuth();
  const [startup, setStartup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStartup();
  }, [id]);

  const fetchStartup = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/startup/${id}`);
      setStartup(response.data.startup);
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
    return size || 'Not specified';
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
          <Link to="/startup-view" className="btn btn-primary" style={{ marginTop: '20px' }}>
            Back to Startups
          </Link>
        </div>
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="job-detail-page">
        <div className="container" style={{ padding: '40px 20px', maxWidth: '900px' }}>
          <div className="alert alert-danger">Startup not found</div>
          <Link to="/startup-view" className="btn btn-primary" style={{ marginTop: '20px' }}>
            Back to Startups
          </Link>
        </div>
      </div>
    );
  }

  const aboutText = startup.aboutStartup || startup.description;
  const socialLinks = startup.socialLinks || {};
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
  const logoSrc = resolveImageUrl(startup.logoUrl);
  const founderImageSrc = resolveImageUrl(startup.founderImageUrl);
  const coFounderImageSrc = resolveImageUrl(startup.coFounderImageUrl);
  const sectionCardStyle = {
    background: '#ffffff',
    border: '1px solid rgba(148, 163, 184, 0.4)',
    padding: '18px',
    borderRadius: '12px'
  };
  const summaryCardStyle = {
    ...sectionCardStyle,
    background: 'linear-gradient(135deg, rgba(226, 232, 240, 0.8), rgba(248, 250, 252, 1))',
    border: '1px solid rgba(148, 163, 184, 0.45)'
  };
  const postedByCardStyle = {
    background: '#ffffff',
    border: '1px solid rgba(148, 163, 184, 0.45)',
    borderRadius: '12px',
    padding: '18px',
    boxShadow: '0 10px 24px rgba(15, 23, 42, 0.06)'
  };

  return (
    <div className="job-detail-page">
      <div className="container" style={{ padding: '40px 20px', maxWidth: '960px', margin: '0 auto' }}>
        <Link
          to="/startup-view"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            color: '#6d28d9',
            marginBottom: '20px',
            fontWeight: 600
          }}
        >
          ← Back to Startups
        </Link>

        <div className="job-detail-card" style={{ overflow: 'hidden' }}>
          <div
            style={{
              padding: '32px',
              background: 'linear-gradient(135deg, rgba(109,40,217,0.12), rgba(147,51,234,0.08))'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
              {logoSrc && (
                <div
                  style={{
                    width: '88px',
                    height: '88px',
                    borderRadius: '18px',
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(109, 40, 217, 0.12)',
                    boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)'
                  }}
                >
                  <img
                    src={logoSrc}
                    alt={`${startup.startupName} logo`}
                    style={{ width: '70px', height: '70px', objectFit: 'contain' }}
                  />
                </div>
              )}
              <div>
                <h1 className="job-detail-title" style={{ marginBottom: '6px', color: '#0f172a' }}>
                  {startup.startupName}
                </h1>
                <p className="job-card-company" style={{ fontSize: '1.1rem', color: '#4b5563' }}>
                  {startup.industry}
                </p>
                <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <span className="badge badge-primary">{getFundingStageLabel(startup.fundingStage)}</span>
                  <span className="badge badge-primary">Posted: {formatDate(startup.createdAt)}</span>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: '20px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '12px',
                color: '#4b5563'
              }}
            >
              <div><strong>Location:</strong> {startup.location || 'Remote'}</div>
              <div><strong>Team:</strong> {getTeamSizeLabel(startup.teamSize)} employees</div>
              <div><strong>Stage:</strong> {getFundingStageLabel(startup.fundingStage)}</div>
              <div><strong>Views:</strong> {startup.views}</div>
            </div>
          </div>

          <div className="job-detail-body" style={{ padding: '32px' }}>
            <div className="job-detail-section" style={{ marginBottom: '28px', ...sectionCardStyle }}>
              <h3 style={{ fontSize: '1.35rem' }}>About the Startup</h3>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.9', color: '#4b5563', fontSize: '1.05rem' }}>
                {aboutText}
              </div>
            </div>

            {startup.website && (
              <div className="job-detail-section" style={{ marginBottom: '24px', ...sectionCardStyle }}>
                <h3 style={{ fontSize: '1.25rem' }}>Website</h3>
                <a
                  href={startup.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#b18fec', fontWeight: 600 }}
                >
                  {startup.website}
                </a>
              </div>
            )}

            {(startup.founderName || startup.coFounderName || startup.founderImageUrl || startup.coFounderImageUrl) && (
              <div className="job-detail-section" style={{ marginBottom: '26px', ...sectionCardStyle }}>
                <h3 style={{ fontSize: '1.25rem' }}>Founders</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
                  {(founderImageSrc || startup.founderName) && (
                    <div
                      style={{
                        background: '#fff',
                        borderRadius: '16px',
                        border: '1px solid rgba(109, 40, 217, 0.12)',
                        padding: '14px',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center'
                      }}
                    >
                      <div
                        style={{
                          width: '110px',
                          height: '110px',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          background: 'rgba(109,40,217,0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          color: '#6d28d9',
                          border: '4px solid rgba(109, 40, 217, 0.18)'
                        }}
                      >
                        {founderImageSrc ? (
                          <img
                            src={founderImageSrc}
                            alt={startup.founderName || 'Founder'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <span>{startup.founderName?.charAt(0).toUpperCase() || 'F'}</span>
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{startup.founderName || 'Founder'}</div>
                        <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Founder</div>
                      </div>
                    </div>
                  )}

                  {(coFounderImageSrc || startup.coFounderName) && (
                    <div
                      style={{
                        background: '#fff',
                        borderRadius: '16px',
                        border: '1px solid rgba(109, 40, 217, 0.12)',
                        padding: '14px',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center'
                      }}
                    >
                      <div
                        style={{
                          width: '110px',
                          height: '110px',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          background: 'rgba(109,40,217,0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          color: '#6d28d9',
                          border: '4px solid rgba(109, 40, 217, 0.18)'
                        }}
                      >
                        {coFounderImageSrc ? (
                          <img
                            src={coFounderImageSrc}
                            alt={startup.coFounderName || 'Co-founder'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <span>{startup.coFounderName?.charAt(0).toUpperCase() || 'C'}</span>
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{startup.coFounderName || 'Co-founder'}</div>
                        <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Co-founder</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(socialLinks.linkedin || socialLinks.twitter || socialLinks.instagram || socialLinks.facebook) && (
              <div className="job-detail-section" style={{ marginBottom: '26px', ...sectionCardStyle }}>
                <h3 style={{ fontSize: '1.25rem' }}>Social Media</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {socialLinks.linkedin && (
                    <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                      LinkedIn
                    </a>
                  )}
                  {socialLinks.twitter && (
                    <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                      Twitter/X
                    </a>
                  )}
                  {socialLinks.instagram && (
                    <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                      Instagram
                    </a>
                  )}
                  {socialLinks.facebook && (
                    <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                      Facebook
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="job-detail-section" style={summaryCardStyle}>
              <h3 style={{ marginBottom: '15px', fontSize: '1.25rem' }}>Startup Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div><strong>Industry:</strong> {startup.industry}</div>
                <div><strong>Funding Stage:</strong> {getFundingStageLabel(startup.fundingStage)}</div>
                <div><strong>Team Size:</strong> {getTeamSizeLabel(startup.teamSize)}</div>
                <div><strong>Location:</strong> {startup.location || 'Remote'}</div>
                <div><strong>Startup Name:</strong> {startup.startupName}</div>
                {startup.founderName && <div><strong>Founder:</strong> {startup.founderName}</div>}
                {startup.coFounderName && <div><strong>Co-founder:</strong> {startup.coFounderName}</div>}
                <div><strong>Posted:</strong> {formatDate(startup.createdAt)}</div>
              </div>
            </div>

            <div style={{ marginTop: '28px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              {isAuthenticated ? (
                isCandidate ? (
                  <a href={`mailto:${startup.email}`} className="btn btn-primary btn-lg">
                    Contact Startup
                  </a>
                ) : null
              ) : (
                <Link to="/login" className="btn btn-primary btn-lg">
                  Login to Contact
                </Link>
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

            {startup.postedBy && (
              <div
                style={{
                  marginTop: '32px',
                  ...postedByCardStyle
                }}
              >
                <h4 style={{ marginBottom: '10px' }}>Posted by</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  {startup.postedBy.profilePicture ? (
                    <img
                      src={startup.postedBy.profilePicture}
                      alt={startup.postedBy.name}
                      style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      backgroundColor: '#ded6eb',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      fontWeight: 'bold'
                    }}>
                      {startup.postedBy.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p style={{ fontWeight: '600', marginBottom: '5px' }}>{startup.postedBy.name}</p>
                    <p style={{ color: '#4b5563', fontSize: '0.9rem' }}>{startup.postedBy.email}</p>
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

export default StartupDetail;
