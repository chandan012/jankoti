import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const PostClassified = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imageFile, setImageFile] = useState(null);

  const [formData, setFormData] = useState({
    description: '',
    itemName: '',
    price: '',
    currency: 'USD',
    condition: 'good',
    location: '',
    sellerName: '',
    sellerEmail: '',
    sellerContact: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    setImageFile(file || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const formattedDescription = `Item: ${formData.itemName}
${formData.description}

Item Details:
- Condition: ${formData.condition}
${formData.price ? `- Price: $${formData.price} ${formData.currency}` : '- Price: Free'}
- Location: ${formData.location || 'Not specified'}
${formData.sellerName ? `- Seller: ${formData.sellerName}` : ''}
${formData.sellerContact ? `- Contact: ${formData.sellerContact}` : ''}`;

      const resolvedTitle = formData.itemName?.trim() || 'Classified Listing';

      const payload = new FormData();
      payload.append('title', resolvedTitle);
      payload.append('description', formattedDescription);
      payload.append('itemName', formData.itemName);
      payload.append('price', formData.price ? parseFloat(formData.price).toString() : '');
      payload.append('currency', formData.currency);
      payload.append('condition', formData.condition);
      payload.append('location', formData.location);
      payload.append('sellerName', formData.sellerName);
      payload.append('sellerEmail', formData.sellerEmail);
      payload.append('sellerContact', formData.sellerContact);
      if (imageFile) {
        payload.append('image', imageFile);
      }

      const response = await axios.post(`${API_URL}/classified`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.status === 201) {
        setSuccess('Classified listed successfully!');
        setTimeout(() => {
          navigate('/classified-view');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to list classified. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2 className="auth-title">Please Login</h2>
          <p className="auth-subtitle">You need to be logged in to post a classified.</p>
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
          <div className="job-detail-header" style={{ background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }}>
            <h1 className="job-detail-title">Post a Classified</h1>
            <p style={{ opacity: 0.9 }}>Sell items, offer services, or find what you need</p>
          </div>

          <div className="job-detail-body">
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Item Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., monitors"
                  name="itemName"
                  value={formData.itemName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Price</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Enter price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Condition *</label>
                  <select
                    className="form-control"
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    required
                  >
                    <option value="new">New</option>
                    <option value="like-new">Like New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., New York, NY"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Picture</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleImageChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Seller Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Your name"
                    name="sellerName"
                    value={formData.sellerName}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Seller Email</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="your@email.com"
                    name="sellerEmail"
                    value={formData.sellerEmail}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Seller Contact</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Phone number"
                  name="sellerContact"
                  value={formData.sellerContact}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Item Description *</label>
                <textarea
                  className="form-control"
                  placeholder="Describe your item, its features, specifications, etc..."
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  style={{ minHeight: '100px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/classified-view')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ flex: 1 }}
                >
                  {loading ? 'Listing...' : 'Submit and Post Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostClassified;
