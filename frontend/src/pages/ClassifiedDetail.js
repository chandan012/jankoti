import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const ClassifiedDetail = () => {
  const { id } = useParams();
  const { isAuthenticated, isCandidate } = useAuth();
  const [classified, setClassified] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClassified();
  }, [id]);

  const fetchClassified = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/classified/${id}`);
      setClassified(response.data.classified);
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

  const formatPrice = (price, currency = 'USD') => {
    if (!price) return 'Free';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
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
          <Link to="/classified-view" className="btn btn-primary" style={{ marginTop: '20px' }}>
            Back to Classifieds
          </Link>
        </div>
      </div>
    );
  }

  if (!classified) {
    return (
      <div className="job-detail-page">
        <div className="container" style={{ padding: '40px 20px', maxWidth: '900px' }}>
          <div className="alert alert-danger">Listing not found</div>
          <Link to="/classified-view" className="btn btn-primary" style={{ marginTop: '20px' }}>
            Back to Classifieds
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="job-detail-page">
      <div className="container" style={{ padding: '40px 20px', maxWidth: '900px', margin: '0 auto' }}>
        <Link to="/classified-view" style={{ display: 'inline-flex', alignItems: 'center', color: '#007bff', marginBottom: '20px' }}>
          ← Back to Classifieds
        </Link>

        <div className="job-detail-card">
          <div className="job-detail-header detail-header--light">
            <h1 className="job-detail-title">{classified.itemName}</h1>

            <div className="job-detail-meta">
              <span>{classified.location || 'Location not specified'}</span>
              <span className="job-salary">{formatPrice(classified.price, classified.currency)}</span>
              <span>{classified.views} views</span>
            </div>

            <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <span className="badge badge-primary">
                {getConditionLabel(classified.condition)}
              </span>
              <span className="badge badge-primary">
                Posted: {formatDate(classified.createdAt)}
              </span>
            </div>
          </div>

          <div className="job-detail-body">
            {classified.imageUrl && (
              <div className="job-detail-section">
                <img
                  src={classified.imageUrl}
                  alt={classified.itemName}
                  style={{
                    width: '100%',
                    height: '360px',
                    objectFit: 'contain',
                    borderRadius: '12px',
                    background: '#f3f4f6'
                  }}
                />
              </div>
            )}
            <div className="job-detail-section">
              <h3>Description</h3>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', color: '#555' }}>
                {classified.description}
              </div>
            </div>

            <div className="job-detail-section">
              <h3 style={{ marginBottom: '15px' }}>Listing Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div><strong>Item Name:</strong> {classified.itemName}</div>
                <div><strong>Condition:</strong> {getConditionLabel(classified.condition)}</div>
                <div><strong>Price:</strong> {formatPrice(classified.price, classified.currency)}</div>
                <div><strong>Location:</strong> {classified.location || 'Not specified'}</div>
                <div><strong>Posted:</strong> {formatDate(classified.createdAt)}</div>
              </div>
            </div>

            <div style={{ marginTop: '30px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              {isAuthenticated ? (
                isCandidate ? (
                  <>
                    {classified.sellerEmail && (
                      <a href={`mailto:${classified.sellerEmail}`} className="btn btn-primary btn-lg">
                        Contact Seller
                      </a>
                    )}
                    {classified.sellerContact && (
                      <a href={`tel:${classified.sellerContact}`} className="btn btn-outline btn-lg">
                        Call Seller
                      </a>
                    )}
                  </>
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

            {classified.postedBy && (
              <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <h4 style={{ marginBottom: '10px' }}>Posted by</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  {classified.postedBy.profilePicture ? (
                    <img
                      src={classified.postedBy.profilePicture}
                      alt={classified.postedBy.name}
                      style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      backgroundColor: '#a8edea',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      fontWeight: 'bold'
                    }}>
                      {classified.postedBy.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p style={{ fontWeight: '600', marginBottom: '5px' }}>{classified.postedBy.name || 'Anonymous'}</p>
                    {classified.postedBy.email && (
                      <p style={{ color: '#666', fontSize: '0.9rem' }}>{classified.postedBy.email}</p>
                    )}
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

export default ClassifiedDetail;
