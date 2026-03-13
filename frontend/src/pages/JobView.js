import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import useSeo from '../hooks/useSeo';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const JobView = () => {
  const { isAuthenticated, isOrganization } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSkillQuery, setActiveSkillQuery] = useState('');
  const metaTitle = 'Startup Jobs & Internships in India | Entrepreneur by Jankoti.com';
  const metaDescription = 'Find startup jobs, internships and fresher opportunities for students across India. Apply for roles, explore hiring updates and grow your career with Entrepreneur by Jankoti.com.';
  const metaKeywords = 'startup jobs, fresher jobs, internships India, campus jobs, hiring platform, startup hiring, job posting portal';

  useSeo({
    title: metaTitle,
    description: metaDescription,
    keywords: metaKeywords
  });

  useEffect(() => {
    if (isAuthenticated && isOrganization) {
      fetchMyJobs();
    } else {
      fetchJobs();
    }
  }, [isAuthenticated, isOrganization]);

  const fetchMyJobs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/jobs/my-jobs`);
      setJobs(response.data.jobs);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async (skillFilter = null) => {
    try {
      setLoading(true);
      const params = { limit: 50 };
      if (skillFilter) {
        params.search = skillFilter;
      }
      const response = await axios.get(`${API_URL}/jobs`, { params });
      setJobs(response.data.jobs || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const trimmedQuery = searchQuery.trim();
    setActiveSkillQuery(trimmedQuery);
    if (isAuthenticated && isOrganization) {
      fetchMyJobs();
    } else {
      fetchJobs(trimmedQuery);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveSkillQuery('');
    if (isAuthenticated && isOrganization) {
      fetchMyJobs();
    } else {
      fetchJobs();
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) {
      return;
    }

    try {
      setDeleteLoading(jobId);
      await axios.delete(`${API_URL}/jobs/${jobId}`);
      setJobs(jobs.filter(job => job._id !== jobId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete job');
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

  const formatSalary = (salary) => {
    if (!salary?.min && !salary?.max) return 'Negotiable';
    if (salary.min && salary.max) {
      return `$${salary.min.toLocaleString()} - $${salary.max.toLocaleString()}`;
    }
    if (salary.min) return `$${salary.min.toLocaleString()}+`;
    return `Up to $${salary.max.toLocaleString()}`;
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'badge-success',
      closed: 'badge-danger',
      draft: 'badge-warning'
    };
    return badges[status] || 'badge-primary';
  };

  const getJobTypeLabel = (type) => {
    const labels = {
      'full-time': 'Full Time',
      'part-time': 'Part Time',
      'contract': 'Contract',
      'internship': 'Internship',
      'remote': 'Remote'
    };
    return labels[type] || type;
  };

  const getExperienceLabel = (exp) => {
    const labels = {
      'entry': 'Entry Level',
      'mid': 'Mid Level',
      'senior': 'Senior Level',
      'lead': 'Lead',
      'executive': 'Executive'
    };
    return labels[exp] || exp;
  };

  // Filter jobs by skills on client side
  const normalizedSkillQuery = activeSkillQuery.toLowerCase();
  const filteredJobs = normalizedSkillQuery
    ? jobs.filter(job =>
        (job.skills || []).some(skill => skill.toLowerCase().includes(normalizedSkillQuery)) ||
        (job.title && job.title.toLowerCase().includes(normalizedSkillQuery)) ||
        (job.company && job.company.toLowerCase().includes(normalizedSkillQuery))
      )
    : jobs;

  const showPostButton = isOrganization && !loading && jobs.length > 0;

  return (
    <div className="job-view-page">
      <section className="hero" style={{ padding: '40px 20px' }}>
        <h1 className="hero-title" style={{ fontSize: '2rem' }}>
          Startup Jobs & Internships for Students and Freshers
        </h1>
        <h2 className="hero-subtitle" style={{ fontSize: '1rem', marginBottom: '10px' }}>
          Find Jobs, Internships and Hiring Opportunities
        </h2>
        <p className="hero-subtitle" style={{ fontSize: '0.95rem', marginBottom: '20px' }}>
          Walk-in Drives and Hiring Updates
        </p>
        {showPostButton && (
          <button
            className="btn btn-primary"
            onClick={() => navigate('/post-job')}
            style={{ padding: '12px 30px' }}
          >
            + Post a New Job
          </button>
        )}
      </section>

      <div className="container" style={{ padding: '40px 20px' }}>
        {/* Search Bar */}
        <form className="job-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search by title, company, or skill..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            aria-label="Search jobs"
          />
          <button type="submit" className="btn btn-primary">
            Search
          </button>
          {(activeSkillQuery || searchQuery) && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleClearSearch}
            >
              Clear
            </button>
          )}
        </form>

        {error && <div className="alert alert-danger">{error}</div>}

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💼</div>
            <h3 className="empty-state-title">
              {isOrganization ? 'No Jobs Posted Yet' : 'No Jobs Available'}
            </h3>
            <p className="empty-state-text">
              {isOrganization
                ? "You haven't posted any jobs yet. Click the button below to create your first job posting."
                : 'Check back later for new opportunities.'}
            </p>
            {isOrganization && (
              <button
                className="btn btn-primary"
                onClick={() => navigate('/post-job')}
                style={{ marginTop: '20px' }}
              >
                Post Your First Job
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="job-list-header" style={{ marginBottom: '30px' }}>
              <h2 className="job-list-title">
                {filteredJobs.length} Job{filteredJobs.length !== 1 ? 's' : ''} {isOrganization ? 'Posted' : 'Available'}
                {activeSkillQuery && ` matching "${activeSkillQuery}"`}
              </h2>
            </div>

            <div className="job-list">
              {filteredJobs.map(job => (
                <div key={job._id} className="job-card">
                  <div className="job-card-header">
                    <div>
                      <Link to={`/jobs/${job._id}`}>
                        <h3 className="job-card-title">{job.title}</h3>
                      </Link>
                      <p className="job-card-company">{job.company}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span className={`badge ${getStatusBadge(job.status)}`}>
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </span>
                      <span className="badge badge-primary">
                        {getJobTypeLabel(job.jobType)}
                      </span>
                    </div>
                  </div>

                  <div className="job-card-location">
                    {job.location}
                  </div>

                  <div className="job-card-details">
                    <span className="job-detail-item">
                      {getExperienceLabel(job.experience)}
                    </span>
                    <span className="job-detail-item job-salary">
                      {formatSalary(job.salary)}
                    </span>
                    <span className="job-detail-item">
                      {job.views} views
                    </span>
                    <span className="job-detail-item">
                      📅 {formatDate(job.createdAt)}
                    </span>
                  </div>

                  <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <Link to={`/jobs/${job._id}`} className="btn btn-primary btn-sm">
                      View Details
                    </Link>
                    {isOrganization && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteJob(job._id)}
                        disabled={deleteLoading === job._id}
                      >
                        {deleteLoading === job._id ? 'Deleting...' : 'Delete'}
                      </button>
                    )}
                  </div>

                  {job.applications && job.applications.length > 0 && (
                    <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                      <span style={{ color: '#666', fontSize: '0.9rem' }}>
                        📋 {job.applications.length} application{job.applications.length !== 1 ? 's' : ''} received
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

export default JobView;
