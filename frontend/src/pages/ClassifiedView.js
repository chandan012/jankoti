import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import useSeo from '../hooks/useSeo';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const ClassifiedView = () => {
  const { isAuthenticated, isOrganization } = useAuth();
  const navigate = useNavigate();
  const [classifieds, setClassifieds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(null);
  const metaTitle = 'Business Classifieds for Startups & SMEs | Entrepreneur by Jankoti.com';
  const metaDescription = 'Post and explore business classifieds for startups, SMEs and entrepreneurs. Find services, deals, business requirements and offers on Entrepreneur by Jankoti.com.';
  const metaKeywords = 'classified ads, business classifieds, startup deals, SME classifieds, service listing, buy sell business';

  useSeo({
    title: metaTitle,
    description: metaDescription,
    keywords: metaKeywords
  });

  useEffect(() => {
    if (isAuthenticated && isOrganization) {
      fetchMyClassifieds();
    } else {
      fetchClassifieds();
    }
  }, [isAuthenticated, isOrganization]);

  const fetchMyClassifieds = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/classified/my-classifieds`);
      setClassifieds(response.data.classifieds);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch classified listings');
    } finally {
      setLoading(false);
    }
  };

  const fetchClassifieds = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/classified`, {
        params: { limit: 50 }
      });
      setClassifieds(response.data.classifieds || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch classified listings');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClassified = async (id) => {
    if (!window.confirm('Are you sure you want to delete this classified listing?')) {
      return;
    }

    try {
      setDeleteLoading(id);
      await axios.delete(`${API_URL}/classified/${id}`);
      setClassifieds(classifieds.filter(item => item._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete classified');
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

  const formatPrice = (price, currency) => {
    if (!price) return 'Free';
    return `${currency || '$'}${price.toLocaleString()}`;
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'badge-success',
      closed: 'badge-danger',
      draft: 'badge-warning',
      sold: 'badge-sold'
    };
    return badges[status] || 'badge-primary';
  };

  const getConditionLabel = (condition) => {
    const labels = {
      'new': 'New',
      'like-new': 'Like New',
      'good': 'Good',
      'fair': 'Fair',
      'poor': 'Poor'
    };
    return labels[condition] || condition;
  };

  const showPostButton = isOrganization && !loading && classifieds.length > 0;

  return (
    <div className="job-view-page">
      <section className="hero" style={{ padding: '40px 20px' }}>
        <h1 className="hero-title" style={{ fontSize: '2rem' }}>
          Post Business Classifieds and Service Listings
        </h1>
        <h2 className="hero-subtitle" style={{ fontSize: '1rem', marginBottom: '20px' }}>
          Business Classifieds for Startups & SMEs | Entrepreneur by Jankoti.com
        </h2>
        {showPostButton && (
          <button
            className="btn btn-primary"
            onClick={() => navigate('/post-classified')}
            style={{ padding: '12px 30px' }}
          >
            + Post a New Classified
          </button>
        )}
      </section>

      <div className="container" style={{ padding: '40px 20px' }}>
        {error && <div className="alert alert-danger">{error}</div>}

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : classifieds.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3 className="empty-state-title">
              {isOrganization ? 'No Classifieds Posted Yet' : 'No Classifieds Available'}
            </h3>
            <p className="empty-state-text">
              {isOrganization
                ? "You haven't posted any classified listings yet. Click the button below to create your first classified ad."
                : 'Check back later for new listings.'}
            </p>
            {isOrganization && (
              <button
                className="btn btn-primary"
                onClick={() => navigate('/post-classified')}
                style={{ marginTop: '20px' }}
              >
                Post Your First Classified
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="job-list-header" style={{ marginBottom: '30px' }}>
              <h2 className="job-list-title">
                {classifieds.length} Classified{classifieds.length !== 1 ? 's' : ''} {isOrganization ? 'Posted' : 'Available'}
              </h2>
            </div>

            <div className="job-list">
              {classifieds.map(item => (
                <div key={item._id} className="job-card">
                  {item.imageUrl && (
                    <div style={{ marginBottom: '12px' }}>
                      <img
                        src={item.imageUrl}
                        alt={item.itemName}
                        style={{
                          width: '100%',
                          height: '220px',
                          objectFit: 'contain',
                          borderRadius: '12px',
                          background: '#f3f4f6'
                        }}
                      />
                    </div>
                  )}
                  <div className="job-card-header">
                    <div>
                      <Link to={`/classified/${item._id}`}>
                        <h3 className="job-card-title">{item.title}</h3>
                      </Link>
                      <p className="job-card-company">{item.itemName}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span className={`badge ${getStatusBadge(item.status)}`}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="job-card-location">
                    {item.location || 'Location not specified'}
                  </div>

                  <div className="job-card-details">
                    <span className="job-detail-item job-salary">
                      {formatPrice(item.price, item.currency)}
                    </span>
                    <span className="job-detail-item">
                      📦 {getConditionLabel(item.condition)}
                    </span>
                    <span className="job-detail-item">
                      {item.views} views
                    </span>
                    <span className="job-detail-item">
                      📅 {formatDate(item.createdAt)}
                    </span>
                  </div>

                  <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <Link to={`/classified/${item._id}`} className="btn btn-primary btn-sm">
                      View Details
                    </Link>
                    {isOrganization && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteClassified(item._id)}
                        disabled={deleteLoading === item._id}
                      >
                        {deleteLoading === item._id ? 'Deleting...' : 'Delete'}
                      </button>
                    )}
                  </div>

                  {isOrganization && item.inquiries && item.inquiries.length > 0 && (
                    <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                      <span style={{ color: '#666', fontSize: '0.9rem' }}>
                        📋 {item.inquiries.length} inquiry{item.inquiries.length !== 1 ? 'ies' : ''} received
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

export default ClassifiedView;
