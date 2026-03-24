import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import useSeo from '../hooks/useSeo';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const Home = () => {
  const { isOrganization } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [freelancing, setFreelancing] = useState([]);
  const [startups, setStartups] = useState([]);
  const [podcasts, setPodcasts] = useState([]);
  const [classifieds, setClassifieds] = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [sectionsError, setSectionsError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    jobType: '',
    experience: ''
  });
  const [page, setPage] = useState(1);
  const [, setTotalPages] = useState(1);
  const HOME_SECTION_LIMIT = 4;
  const metaTitle = 'Entrepreneur by Jankoti.com | Startup Directory | Jobs Posting | News | Freelancing | Podcast | Classifieds';
  const metaDescription = 'Entrepreneur.Jankoti.com is a startup ecosystem platform for students, startups, SMEs and enterprises. Showcase your business, post jobs, share startup news, publish blogs, podcasts, classifieds and hire freelancers.';
  const heroTitle = 'Entrepreneur by Jankoti.com | Startup Directory | Jobs Posting | News | Freelancing | Podcast | Classifieds';
  const heroSubtitle = 'Entrepreneur.Jankoti.com is a startup ecosystem platform for students, startups, SMEs and enterprises. Showcase your business, post jobs, share startup news, publish blogs, podcasts, classifieds and hire freelancers.';

  useSeo({
    title: metaTitle,
    description: metaDescription
  });

  useEffect(() => {
    fetchJobs();
  }, [page, filters.jobType, filters.experience]);

  useEffect(() => {
    fetchHomeSections();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 10,
        ...(filters.search && { search: filters.search }),
        ...(filters.location && { location: filters.location }),
        ...(filters.jobType && { jobType: filters.jobType }),
        ...(filters.experience && { experience: filters.experience })
      });

      const response = await axios.get(`${API_URL}/jobs?${params}`);
      setJobs(response.data.jobs);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHomeSections = async () => {
    try {
      setSectionsLoading(true);
      setSectionsError('');
      const limit = HOME_SECTION_LIMIT;

      const [
        freelancingResponse,
        startupResponse,
        podcastResponse,
        classifiedResponse
      ] = await Promise.all([
        axios.get(`${API_URL}/freelancing?limit=${limit}`),
        axios.get(`${API_URL}/startup?limit=${limit}`),
        axios.get(`${API_URL}/podcast?limit=${limit}`),
        axios.get(`${API_URL}/classified?limit=${limit}`)
      ]);

      setFreelancing(freelancingResponse.data.freelancing || []);
      setStartups(startupResponse.data.startups || []);
      setPodcasts(podcastResponse.data.podcasts || []);
      setClassifieds(classifiedResponse.data.classifieds || []);
    } catch (error) {
      console.error('Error fetching home sections:', error);
      setSectionsError('Failed to load additional listings.');
    } finally {
      setSectionsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const formatSalary = (salary) => {
    if (!salary?.min && !salary?.max) return 'Negotiable';
    if (salary.min && salary.max) {
      return `$${salary.min.toLocaleString()} - $${salary.max.toLocaleString()}`;
    }
    if (salary.min) return `$${salary.min.toLocaleString()}+`;
    return `Up to $${salary.max.toLocaleString()}`;
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

  const formatDateShort = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatRate = (rate) => {
    if (!rate?.min && !rate?.max) return 'Negotiable';
    const type = rate.rateType === 'hourly' ? '/hr' : rate.rateType === 'monthly' ? '/mo' : '';
    if (rate.min && rate.max) {
      return `$${rate.min.toLocaleString()} - $${rate.max.toLocaleString()}${type}`;
    }
    if (rate.min) return `$${rate.min.toLocaleString()}${type}+`;
    return `Up to $${rate.max.toLocaleString()}${type}`;
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

  const getFreelanceExperienceLabel = (exp) => {
    const labels = {
      'entry': 'Entry Level',
      'mid': 'Mid Level',
      'senior': 'Senior Level',
      'expert': 'Expert'
    };
    return labels[exp] || exp;
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

  const formatPrice = (price, currency) => {
    if (!price) return 'Free';
    return `${currency || '$'}${price.toLocaleString()}`;
  };

  const getCategoryLabel = (category) => {
    const labels = {
      'electronics': 'Electronics',
      'vehicles': 'Vehicles',
      'real-estate': 'Real Estate',
      'furniture': 'Furniture',
      'clothing': 'Clothing',
      'books': 'Books',
      'services': 'Services',
      'jobs': 'Jobs',
      'other': 'Other'
    };
    return labels[category] || category;
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

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-inner">
          <h1 className="hero-title">{heroTitle}</h1>
          <h2 className="hero-subtitle" style={{ fontSize: '1.1rem' }}>
            {heroSubtitle}
          </h2>
          <form className="hero-searchbar" onSubmit={handleSearch}>
            <div className="hero-search-field">
              <input
                type="text"
                placeholder="Search by skills, designation, or company"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            <div className="hero-search-field">
              <select
                name="experience"
                value={filters.experience}
                onChange={handleFilterChange}
              >
                <option value="">Experience Level</option>
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior Level</option>
                <option value="lead">Lead</option>
                <option value="executive">Executive</option>
              </select>
            </div>
            <div className="hero-search-field">
              <input
                type="text"
                placeholder="Location"
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
            <button className="hero-search-button" type="submit">
              Search for Jobs
            </button>
          </form>
        </div>
      </section>

      <section className="container" style={{ padding: '40px 20px' }}>
        <div className="job-list-header">
          <h2 className="job-list-title">
            {loading ? 'Loading...' : 'Top Job Postings'}
          </h2>
          <Link to="/jobs" className="btn btn-outline btn-sm view-all-button">
            View All
          </Link>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="empty-state">
            <h3 className="empty-state-title">No Jobs Found</h3>
            <p className="empty-state-text">
              Try adjusting your search filters or check back later
            </p>
          </div>
        ) : (
          <div className="job-list">
            {jobs.slice(0, 3).map(job => (
              <div key={job._id} className="job-card">
                <div className="job-card-header">
                  <div>
                    <Link to={`/jobs/${job._id}`}>
                      <h3 className="job-card-title">{job.title}</h3>
                    </Link>
                    <p className="job-card-company">{job.company}</p>
                  </div>
                  <span className="badge badge-primary">
                    {getJobTypeLabel(job.jobType)}
                  </span>
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
                </div>

                {job.skills && job.skills.length > 0 && (
                  <div className="job-skills">
                    {job.skills.slice(0, 5).map((skill, index) => (
                      <span key={index} className="skill-tag">{skill}</span>
                    ))}
                    {job.skills.length > 5 && (
                      <span className="skill-tag">+{job.skills.length - 5} more</span>
                    )}
                  </div>
                )}

                <div style={{ marginTop: '15px' }}>
                  <Link to={`/jobs/${job._id}`} className="btn btn-primary btn-sm">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination intentionally hidden on Home; full list is on /jobs */}

        {sectionsError && (
          <div className="alert alert-danger" style={{ marginTop: '30px' }}>
            {sectionsError}
          </div>
        )}

        {sectionsLoading ? (
          <div className="loading" style={{ marginTop: '40px' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            <div style={{ marginTop: '60px' }}>
              <div className="job-list-header">
                <h2 className="job-list-title">Freelancing Projects</h2>
                <Link to="/freelancing-view" className="btn btn-outline btn-sm view-all-button">
                  View All
                </Link>
              </div>
              {freelancing.length === 0 ? (
                <div className="empty-state">
                  <h3 className="empty-state-title">No Freelancing Projects Yet</h3>
                  <p className="empty-state-text">
                    {isOrganization ? 'Be the first to post a project.' : 'Check back soon for new projects.'}
                  </p>
                  {isOrganization && (
                    <Link to="/post-freelancing" className="btn btn-primary btn-sm">
                      Post a Freelancing Project
                    </Link>
                  )}
                </div>
              ) : (
                <div className="job-list">
                  {freelancing.map(item => (
                    <div key={item._id} className="job-card">
                      <div className="job-card-header">
                        <div>
                          <Link to={`/freelancing/${item._id}`}>
                            <h3 className="job-card-title">{item.title}</h3>
                          </Link>
                          <p className="job-card-company">{item.companyName}</p>
                        </div>
                        <span className="badge badge-primary">
                          {getProjectTypeLabel(item.projectType)}
                        </span>
                      </div>

                      <div className="job-card-location">
                        {item.location || 'Remote'}
                      </div>

                      <div className="job-card-details">
                        <span className="job-detail-item">
                          {getFreelanceExperienceLabel(item.experience)}
                        </span>
                        <span className="job-detail-item job-salary">
                          {formatRate(item.rate)}
                        </span>
                        <span className="job-detail-item">
                          📅 {formatDateShort(item.createdAt)}
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

                      <div style={{ marginTop: '15px' }}>
                        <Link to={`/freelancing/${item._id}`} className="btn btn-primary btn-sm">
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: '60px' }}>
              <div className="job-list-header">
                <h2 className="job-list-title">Startup Opportunities</h2>
                <Link to="/startup-view" className="btn btn-outline btn-sm view-all-button">
                  View All
                </Link>
              </div>
              {startups.length === 0 ? (
                <div className="empty-state">
                  <h3 className="empty-state-title">No Startups Yet</h3>
                  <p className="empty-state-text">
                    {isOrganization ? 'Share your startup opportunity.' : 'Check back soon for new opportunities.'}
                  </p>
                  {isOrganization && (
                    <Link to="/post-startup" className="btn btn-primary btn-sm">
                      Post a Startup
                    </Link>
                  )}
                </div>
              ) : (
                <div className="job-list">
                  {startups.map(item => (
                    <div key={item._id} className="job-card">
                      <div className="job-card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {item.logoUrl && (
                            <img
                              src={item.logoUrl}
                              alt={`${item.startupName} logo`}
                              style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover' }}
                            />
                          )}
                          <div>
                            <Link to={`/startup/${item._id}`}>
                              <h3 className="job-card-title">{item.title}</h3>
                            </Link>
                            <p className="job-card-company">{item.startupName}</p>
                          </div>
                        </div>
                        <span className="badge badge-primary">
                          {getFundingStageLabel(item.fundingStage)}
                        </span>
                      </div>

                      <div className="job-card-location">
                        {item.location || 'Remote'}
                      </div>

                      <div className="job-card-details">
                        <span className="job-detail-item">
                          🏢 {item.industry}
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
                          📅 {formatDateShort(item.createdAt)}
                        </span>
                      </div>

                      <div style={{ marginTop: '15px' }}>
                        <Link to={`/startup/${item._id}`} className="btn btn-primary btn-sm">
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: '60px' }}>
              <div className="job-list-header">
                <h2 className="job-list-title">Podcast Listings</h2>
                <Link to="/podcast-view" className="btn btn-outline btn-sm view-all-button">
                  View All
                </Link>
              </div>
              {podcasts.length === 0 ? (
                <div className="empty-state">
                  <h3 className="empty-state-title">No Podcasts Yet</h3>
                  <p className="empty-state-text">
                    {isOrganization ? 'Post a podcast guest opportunity.' : 'Check back soon for new listings.'}
                  </p>
                  {isOrganization && (
                    <Link to="/post-podcast" className="btn btn-primary btn-sm">
                      Post a Podcast
                    </Link>
                  )}
                </div>
              ) : (
                <div className="job-list">
                  {podcasts.map(item => (
                    <div key={item._id} className="job-card">
                      <div className="job-card-header">
                        <div>
                          <Link to={`/podcast/${item._id}`}>
                            <h3 className="job-card-title">{item.title || item.podcastName}</h3>
                          </Link>
                          <p className="job-card-company">{item.podcastName}</p>
                        </div>
                        <span className="badge badge-primary">
                          {getPlatformLabel(item.platform)}
                        </span>
                      </div>

                      <div className="job-card-location">
                        🎙️ Host: {item.hostFirstName || 'Host'}
                      </div>

                      <div className="job-card-details">
                        <span className="job-detail-item">
                          👤 Owner: {item.ownerFirstName || item.hostFirstName || 'N/A'}
                        </span>
                        {item.guestName && (
                          <span className="job-detail-item">
                            👥 Guest: {item.guestName}
                          </span>
                        )}
                        <span className="job-detail-item">
                          📧 {item.email}
                        </span>
                        <span className="job-detail-item">
                          📅 {formatDateShort(item.createdAt)}
                        </span>
                      </div>

                      <div style={{ marginTop: '15px' }}>
                        <Link to={`/podcast/${item._id}`} className="btn btn-primary btn-sm">
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: '60px' }}>
              <div className="job-list-header">
                <h2 className="job-list-title">Classified Listings</h2>
                <Link to="/classified-view" className="btn btn-outline btn-sm view-all-button">
                  View All
                </Link>
              </div>
              {classifieds.length === 0 ? (
                <div className="empty-state">
                  <h3 className="empty-state-title">No Classifieds Yet</h3>
                  <p className="empty-state-text">
                    {isOrganization ? 'List an item for the community.' : 'Check back soon for new listings.'}
                  </p>
                  {isOrganization && (
                    <Link to="/post-classified" className="btn btn-primary btn-sm">
                      Post a Classified
                    </Link>
                  )}
                </div>
              ) : (
                <div className="job-list">
                  {classifieds.map(item => (
                    <div key={item._id} className="job-card">
                      {item.imageUrl && (
                        <div style={{ marginBottom: '12px' }}>
                          <img
                            src={item.imageUrl}
                            alt={item.itemName}
                            style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '10px' }}
                          />
                        </div>
                      )}
                      <div className="job-card-header">
                        <div>
                          <Link to={`/classified/${item._id}`}>
                            <h3 className="job-card-title">{item.title || item.itemName}</h3>
                          </Link>
                          <p className="job-card-company">{item.itemName}</p>
                        </div>
                        <span className="badge badge-primary">
                          {getCategoryLabel(item.category)}
                        </span>
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
                          📅 {formatDateShort(item.createdAt)}
                        </span>
                      </div>

                      <div style={{ marginTop: '15px' }}>
                        <Link to={`/classified/${item._id}`} className="btn btn-primary btn-sm">
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default Home;
