import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import useSeo from '../hooks/useSeo';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('candidate');
  const [activeOrgTab, setActiveOrgTab] = useState('jobs');

  const [jobApplications, setJobApplications] = useState([]);
  const [freelancingApplications, setFreelancingApplications] = useState([]);
  const [classifiedApplications, setClassifiedApplications] = useState([]);
  const [candidateLoading, setCandidateLoading] = useState(true);
  const [candidateError, setCandidateError] = useState('');
  const [candidateLastUpdated, setCandidateLastUpdated] = useState(null);

  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState('');
  const [expandedJobId, setExpandedJobId] = useState(null);
  const [applicationsByJob, setApplicationsByJob] = useState({});
  const [appsLoading, setAppsLoading] = useState({});
  const [appsError, setAppsError] = useState({});
  const [jobsLastUpdated, setJobsLastUpdated] = useState(null);

  const [freelancing, setFreelancing] = useState([]);
  const [freelancingLoading, setFreelancingLoading] = useState(true);
  const [freelancingError, setFreelancingError] = useState('');
  const [expandedFreelancingId, setExpandedFreelancingId] = useState(null);
  const [applicationsByFreelancing, setApplicationsByFreelancing] = useState({});
  const [freelancingAppsLoading, setFreelancingAppsLoading] = useState({});
  const [freelancingAppsError, setFreelancingAppsError] = useState({});
  const [freelancingLastUpdated, setFreelancingLastUpdated] = useState(null);

  useSeo({
    title: 'Admin Dashboard | Jankoti.com',
    description: 'Admin insights for jobs and freelancing on Jankoti.com.'
  });

  useEffect(() => {
    fetchJobs();
    fetchFreelancing();
    fetchCandidateData();
  }, []);

  const fetchCandidateData = async () => {
    try {
      setCandidateLoading(true);
      setCandidateError('');
      const response = await axios.get(`${API_URL}/admin/candidate-data`);
      setJobApplications(response.data.jobApplications || []);
      setFreelancingApplications(response.data.freelancingApplications || []);
      setClassifiedApplications(response.data.classifieds || []);
      setCandidateLastUpdated(new Date());
    } catch (err) {
      setCandidateError(err.response?.data?.message || 'Failed to load candidate data');
    } finally {
      setCandidateLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      setJobsLoading(true);
      setJobsError('');
      const response = await axios.get(`${API_URL}/jobs/my-jobs`);
      setJobs(response.data.jobs || []);
      setJobsLastUpdated(new Date());
    } catch (err) {
      setJobsError(err.response?.data?.message || 'Failed to load jobs');
    } finally {
      setJobsLoading(false);
    }
  };

  const fetchFreelancing = async () => {
    try {
      setFreelancingLoading(true);
      setFreelancingError('');
      const response = await axios.get(`${API_URL}/freelancing/my-freelancing`);
      setFreelancing(response.data.freelancing || []);
      setFreelancingLastUpdated(new Date());
    } catch (err) {
      setFreelancingError(err.response?.data?.message || 'Failed to load freelancing posts');
    } finally {
      setFreelancingLoading(false);
    }
  };

  const totalJobs = jobs.length;
  const totalApplications = useMemo(
    () => jobs.reduce((sum, job) => sum + (job.applications?.length || 0), 0),
    [jobs]
  );
  const avgApplications = totalJobs ? (totalApplications / totalJobs) : 0;
  const statusCounts = useMemo(() => {
    return jobs.reduce(
      (acc, job) => {
        const status = job.status || 'active';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      { active: 0, closed: 0, draft: 0 }
    );
  }, [jobs]);
  const uniquePosters = useMemo(() => {
    const set = new Set();
    jobs.forEach((job) => {
      const posterId = job.postedBy?._id || job.postedBy;
      if (posterId) set.add(String(posterId));
    });
    return set.size;
  }, [jobs]);
  const topJobs = useMemo(() => {
    return [...jobs]
      .sort((a, b) => (b.applications?.length || 0) - (a.applications?.length || 0))
      .slice(0, 5);
  }, [jobs]);

  const totalFreelancing = freelancing.length;
  const totalFreelancingApplications = useMemo(
    () => freelancing.reduce((sum, item) => sum + (item.applications?.length || 0), 0),
    [freelancing]
  );
  const avgFreelancingApplications = totalFreelancing
    ? (totalFreelancingApplications / totalFreelancing)
    : 0;
  const freelancingStatusCounts = useMemo(() => {
    return freelancing.reduce(
      (acc, item) => {
        const status = item.status || 'active';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      { active: 0, closed: 0, draft: 0 }
    );
  }, [freelancing]);
  const freelancingUniquePosters = useMemo(() => {
    const set = new Set();
    freelancing.forEach((item) => {
      const posterId = item.postedBy?._id || item.postedBy;
      if (posterId) set.add(String(posterId));
    });
    return set.size;
  }, [freelancing]);
  const topFreelancing = useMemo(() => {
    return [...freelancing]
      .sort((a, b) => (b.applications?.length || 0) - (a.applications?.length || 0))
      .slice(0, 5);
  }, [freelancing]);

  const formatDateShort = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '—';
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

  const getJobStatusBadge = (status) => {
    const badges = {
      active: 'badge-success',
      closed: 'badge-danger',
      draft: 'badge-warning'
    };
    return badges[status] || 'badge-primary';
  };

  const downloadCsv = (rows, headers, filename) => {
    if (!rows || rows.length === 0) return;
    const escapeValue = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csvLines = [
      headers.join(','),
      ...rows.map((row) => headers.map((header) => escapeValue(row[header])).join(','))
    ];
    const csvBlob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(csvBlob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getProjectTypeLabel = (type) => {
    const labels = {
      'one-time': 'One-time Project',
      'ongoing': 'Ongoing',
      'hourly': 'Hourly',
      'fixed-price': 'Fixed Price'
    };
    return labels[type] || type || 'Not specified';
  };

  const fetchJobApplications = async (jobId) => {
    if (applicationsByJob[jobId]) {
      return applicationsByJob[jobId];
    }

    try {
      setAppsLoading((prev) => ({ ...prev, [jobId]: true }));
      setAppsError((prev) => ({ ...prev, [jobId]: '' }));
      const response = await axios.get(`${API_URL}/jobs/${jobId}/applications`);
      const apps = response.data.applications || [];
      setApplicationsByJob((prev) => ({
        ...prev,
        [jobId]: apps
      }));
      return apps;
    } catch (err) {
      setAppsError((prev) => ({
        ...prev,
        [jobId]: err.response?.data?.message || 'Failed to load applications'
      }));
      return [];
    } finally {
      setAppsLoading((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  const handleDownloadJobApplicants = async (job) => {
    const apps = await fetchJobApplications(job._id);
    if (!apps || apps.length === 0) return;
    const rows = apps.map((application) => ({
      Name: application.fullName || application.applicant?.name || '—',
      'Job Name': job.title || '—',
      'Mobile Number': application.phone || '—',
      Email: application.contactEmail || application.applicant?.email || '—',
      'LinkedIn ID': application.linkedinUrl || application.profileUrl || '—',
      Skills: application.skills?.length ? application.skills.join(', ') : '—',
      'Applied Date': formatDateShort(application.appliedAt)
    }));
    const safeTitle = String(job.title || 'job')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-_]/g, '');
    downloadCsv(
      rows,
      ['Name', 'Job Name', 'Mobile Number', 'Email', 'LinkedIn ID', 'Skills', 'Applied Date'],
      `${safeTitle || 'job'}-applicants.csv`
    );
  };

  const toggleApplications = async (jobId) => {
    if (expandedJobId === jobId) {
      setExpandedJobId(null);
      return;
    }

    setExpandedJobId(jobId);

    if (applicationsByJob[jobId]) {
      return;
    }

    try {
      setAppsLoading((prev) => ({ ...prev, [jobId]: true }));
      setAppsError((prev) => ({ ...prev, [jobId]: '' }));
      const response = await axios.get(`${API_URL}/jobs/${jobId}/applications`);
      setApplicationsByJob((prev) => ({
        ...prev,
        [jobId]: response.data.applications || []
      }));
    } catch (err) {
      setAppsError((prev) => ({
        ...prev,
        [jobId]: err.response?.data?.message || 'Failed to load applications'
      }));
    } finally {
      setAppsLoading((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  const toggleFreelancingApplications = async (freelancingId) => {
    if (expandedFreelancingId === freelancingId) {
      setExpandedFreelancingId(null);
      return;
    }

    setExpandedFreelancingId(freelancingId);

    if (applicationsByFreelancing[freelancingId]) {
      return;
    }

    try {
      setFreelancingAppsLoading((prev) => ({ ...prev, [freelancingId]: true }));
      setFreelancingAppsError((prev) => ({ ...prev, [freelancingId]: '' }));
      const response = await axios.get(`${API_URL}/freelancing/${freelancingId}/applications`);
      setApplicationsByFreelancing((prev) => ({
        ...prev,
        [freelancingId]: response.data.applications || []
      }));
    } catch (err) {
      setFreelancingAppsError((prev) => ({
        ...prev,
        [freelancingId]: err.response?.data?.message || 'Failed to load applications'
      }));
    } finally {
      setFreelancingAppsLoading((prev) => ({ ...prev, [freelancingId]: false }));
    }
  };

  const refreshActiveSection = () => {
    if (activeSection === 'candidate') {
      fetchCandidateData();
      return;
    }
    if (activeOrgTab === 'jobs') {
      fetchJobs();
      return;
    }
    fetchFreelancing();
  };

  const activeLoading = activeSection === 'candidate'
    ? candidateLoading
    : (activeOrgTab === 'jobs' ? jobsLoading : freelancingLoading);
  const activeError = activeSection === 'candidate'
    ? candidateError
    : (activeOrgTab === 'jobs' ? jobsError : freelancingError);
  const activeLastUpdated = activeSection === 'candidate'
    ? candidateLastUpdated
    : (activeOrgTab === 'jobs' ? jobsLastUpdated : freelancingLastUpdated);

  const jobApplicationRows = jobApplications.map((application) => ({
    Name: application.fullName || application.applicant?.name || '—',
    'Job Name': application.job?.title || '—',
    'Mobile Number': application.phone || '—',
    Email: application.contactEmail || application.applicant?.email || '—',
    'LinkedIn ID': application.linkedinUrl || application.profileUrl || '—',
    Skills: application.skills?.length ? application.skills.join(', ') : '—',
    'Applied Date': formatDateShort(application.appliedAt)
  }));

  const freelancingApplicationRows = freelancingApplications.map((application) => ({
    Name: application.fullName || application.applicant?.name || '—',
    Project: application.freelancing?.title || '—',
    Mobile: application.phone || '—',
    Email: application.contactEmail || application.applicant?.email || '—',
    'LinkedIn ID': application.linkedinUrl || '—',
    Budget: application.proposedBudget || '—',
    'Applied Date': formatDateShort(application.appliedAt)
  }));

  const classifiedRows = classifiedApplications.map((item) => ({
    Name: item.sellerName || '—',
    Item: item.itemName || '—',
    Mobile: item.sellerContact || '—',
    'Seller Email': item.sellerEmail || '—',
    'Applied Date': formatDateShort(item.createdAt)
  }));

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Admin Dashboard</h1>
            <p className="dashboard-subtitle">
              {activeSection === 'candidate'
                ? 'Candidate activity across job, freelancing, and classified submissions.'
                : (activeOrgTab === 'jobs'
                  ? 'Job insights, application activity, and posting ownership.'
                  : 'Freelancing insights, applicant activity, and posting ownership.')}
            </p>
            {activeLastUpdated && (
              <p className="dashboard-meta">Last updated: {activeLastUpdated.toLocaleString()}</p>
            )}
          </div>
          <button
            className="btn btn-outline btn-sm"
            onClick={refreshActiveSection}
            disabled={activeLoading}
          >
            {activeLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="admin-tabs">
          <button
            type="button"
            className={`admin-tab ${activeSection === 'candidate' ? 'active' : ''}`}
            onClick={() => setActiveSection('candidate')}
          >
            Candidate Data
          </button>
          <button
            type="button"
            className={`admin-tab ${activeSection === 'organization' ? 'active' : ''}`}
            onClick={() => setActiveSection('organization')}
          >
            Organization Data
          </button>
        </div>

        {activeSection === 'organization' && (
          <div className="admin-tabs admin-subtabs">
            <button
              type="button"
              className={`admin-tab ${activeOrgTab === 'jobs' ? 'active' : ''}`}
              onClick={() => setActiveOrgTab('jobs')}
            >
              Jobs
            </button>
            <button
              type="button"
              className={`admin-tab ${activeOrgTab === 'freelancing' ? 'active' : ''}`}
              onClick={() => setActiveOrgTab('freelancing')}
            >
              Freelancing
            </button>
          </div>
        )}

        {activeError && <div className="alert alert-danger">{activeError}</div>}

        {activeSection === 'candidate' && (
          <>
            <div className="job-list-header">
              <h2 className="job-list-title">Job Applications</h2>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => downloadCsv(
                  jobApplicationRows,
                  ['Name', 'Job Name', 'Mobile Number', 'Email', 'LinkedIn ID', 'Skills', 'Applied Date'],
                  'job-applications.csv'
                )}
                disabled={candidateLoading || jobApplicationRows.length === 0}
              >
                Download CSV
              </button>
            </div>

            {candidateLoading ? (
              <div className="loading" style={{ minHeight: '160px' }}>
                <div className="spinner"></div>
              </div>
            ) : jobApplicationRows.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">No Data</div>
                <h3 className="empty-state-title">No job applications found</h3>
                <p className="empty-state-text">Applications will appear here as candidates apply.</p>
              </div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Job Name</th>
                      <th>Mobile Number</th>
                      <th>Email</th>
                      <th>LinkedIn ID</th>
                      <th>Skills</th>
                      <th>Applied Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobApplicationRows.map((row, index) => (
                      <tr key={`job-app-${index}`}>
                        <td>{row['Name']}</td>
                        <td>{row['Job Name']}</td>
                        <td>{row['Mobile Number']}</td>
                        <td>{row['Email']}</td>
                        <td>{row['LinkedIn ID']}</td>
                        <td>{row['Skills']}</td>
                        <td>{row['Applied Date']}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="job-list-header" style={{ marginTop: '32px' }}>
              <h2 className="job-list-title">Freelancing Applications</h2>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => downloadCsv(
                  freelancingApplicationRows,
                  ['Name', 'Project', 'Mobile', 'Email', 'LinkedIn ID', 'Budget', 'Applied Date'],
                  'freelancing-applications.csv'
                )}
                disabled={candidateLoading || freelancingApplicationRows.length === 0}
              >
                Download CSV
              </button>
            </div>

            {candidateLoading ? (
              <div className="loading" style={{ minHeight: '160px' }}>
                <div className="spinner"></div>
              </div>
            ) : freelancingApplicationRows.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">No Data</div>
                <h3 className="empty-state-title">No freelancing applications found</h3>
                <p className="empty-state-text">Applications will appear here as candidates apply.</p>
              </div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Project</th>
                      <th>Mobile</th>
                      <th>Email</th>
                      <th>LinkedIn ID</th>
                      <th>Budget</th>
                      <th>Applied Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {freelancingApplicationRows.map((row, index) => (
                      <tr key={`freelance-app-${index}`}>
                        <td>{row['Name']}</td>
                        <td>{row['Project']}</td>
                        <td>{row['Mobile']}</td>
                        <td>{row['Email']}</td>
                        <td>{row['LinkedIn ID']}</td>
                        <td>{row['Budget']}</td>
                        <td>{row['Applied Date']}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="job-list-header" style={{ marginTop: '32px' }}>
              <h2 className="job-list-title">Classified</h2>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => downloadCsv(
                  classifiedRows,
                  ['Name', 'Item', 'Mobile', 'Seller Email', 'Applied Date'],
                  'classified.csv'
                )}
                disabled={candidateLoading || classifiedRows.length === 0}
              >
                Download CSV
              </button>
            </div>

            {candidateLoading ? (
              <div className="loading" style={{ minHeight: '160px' }}>
                <div className="spinner"></div>
              </div>
            ) : classifiedRows.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">No Data</div>
                <h3 className="empty-state-title">No classifieds found</h3>
                <p className="empty-state-text">Listings will appear here as they are posted.</p>
              </div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Item</th>
                      <th>Mobile</th>
                      <th>Seller Email</th>
                      <th>Applied Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classifiedRows.map((row, index) => (
                      <tr key={`classified-${index}`}>
                        <td>{row['Name']}</td>
                        <td>{row['Item']}</td>
                        <td>{row['Mobile']}</td>
                        <td>{row['Seller Email']}</td>
                        <td>{row['Applied Date']}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeSection === 'organization' && activeOrgTab === 'jobs' && (
          <>
            <div className="dashboard-stats">
              <div className="stat-card">
                <div className="stat-number">{totalJobs}</div>
                <div className="stat-label">Total Jobs</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{totalApplications}</div>
                <div className="stat-label">Total Applications</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{avgApplications.toFixed(1)}</div>
                <div className="stat-label">Avg Applications / Job</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{uniquePosters}</div>
                <div className="stat-label">Unique Posters</div>
              </div>
            </div>

            <div className="admin-insights">
              <div className="insight-card">
                <h3 className="insight-title">Job Status Mix</h3>
                <div className="insight-list">
                  <div className="insight-row">
                    <span className="badge badge-success">Active</span>
                    <span>{statusCounts.active}</span>
                  </div>
                  <div className="insight-row">
                    <span className="badge badge-danger">Closed</span>
                    <span>{statusCounts.closed}</span>
                  </div>
                  <div className="insight-row">
                    <span className="badge badge-warning">Draft</span>
                    <span>{statusCounts.draft}</span>
                  </div>
                </div>
              </div>
              <div className="insight-card">
                <h3 className="insight-title">Top Jobs by Applications</h3>
                {topJobs.length === 0 ? (
                  <p className="dashboard-meta">No jobs yet.</p>
                ) : (
                  <div className="insight-list">
                    {topJobs.map((job) => (
                      <div key={job._id} className="insight-row">
                        <span className="insight-job">{job.title}</span>
                        <span>{job.applications?.length || 0}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="job-list-header">
              <h2 className="job-list-title">Jobs Overview</h2>
              <span className="dashboard-meta">{totalJobs} jobs</span>
            </div>

            {jobsLoading && (
              <div className="loading" style={{ minHeight: '180px' }}>
                <div className="spinner"></div>
              </div>
            )}

            {!jobsLoading && totalJobs === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">No Data</div>
                <h3 className="empty-state-title">No jobs found</h3>
                <p className="empty-state-text">Create or import jobs to see insights here.</p>
              </div>
            )}

            <div className="admin-job-grid">
              {jobs.map((job) => {
                const applications = applicationsByJob[job._id] || [];
                const applicantCount = job.applications?.length || 0;
                const postedByName = job.postedBy?.name || 'Unknown';
                const postedByEmail = job.postedBy?.email || '—';
                const postedByCompany = job.postedBy?.company || job.company || '—';

                return (
                  <div key={job._id} className="admin-job-card">
                    <div className="admin-job-header">
                      <div>
                        <div className="admin-job-title">{job.title}</div>
                        <div className="admin-job-meta">{job.company} • {job.location || 'Location not set'}</div>
                        <div className="admin-job-meta">Posted on {formatDateShort(job.createdAt)}</div>
                      </div>
                      <div className="admin-job-status">
                        <span className={`badge ${getJobStatusBadge(job.status)}`}>{job.status || 'active'}</span>
                      </div>
                    </div>

                    <div className="admin-job-tags">
                      <span className="admin-tag">Applications: <strong>{applicantCount}</strong></span>
                      <span className="admin-tag">Views: <strong>{job.views || 0}</strong></span>
                      <span className="admin-tag">Openings: <strong>{job.openings || '—'}</strong></span>
                    </div>

                    <div className="admin-job-footer">
                      <div className="admin-job-meta">
                        Posted by <strong>{postedByName}</strong> ({postedByCompany}) • {postedByEmail}
                      </div>
                      <div className="admin-job-actions">
                        <Link className="btn btn-outline btn-sm" to={`/jobs/${job._id}`}>View Job</Link>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => toggleApplications(job._id)}
                        >
                          {expandedJobId === job._id ? 'Hide Applicants' : 'View Applicants'}
                        </button>
                      </div>
                    </div>

                    {expandedJobId === job._id && (
                      <div className="admin-applications">
                        {appsLoading[job._id] && (
                          <div className="dashboard-meta">Loading applications...</div>
                        )}
                        {appsError[job._id] && (
                          <div className="alert alert-warning">{appsError[job._id]}</div>
                        )}
                        {!appsLoading[job._id] && applications.length === 0 && (
                          <div className="dashboard-meta">No applications yet.</div>
                        )}

                        {!appsLoading[job._id] && applications.length > 0 && (
                          <div className="admin-app-list">
                            {applications.map((application) => (
                              <div key={application._id} className="admin-app-card">
                                <div>
                                  <div className="admin-app-name">{application.applicant?.name || 'Unnamed Applicant'}</div>
                                  <div className="admin-app-meta">{application.applicant?.email || 'No email provided'}</div>
                                  <div className="admin-app-meta">Applied: {formatDateShort(application.appliedAt)}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {!appsLoading[job._id] && applications.length > 0 && (
                          <div style={{ marginTop: '12px' }}>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => handleDownloadJobApplicants(job)}
                            >
                              Download Applicants
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeSection === 'organization' && activeOrgTab === 'freelancing' && (
          <>
            <div className="dashboard-stats">
              <div className="stat-card">
                <div className="stat-number">{totalFreelancing}</div>
                <div className="stat-label">Total Freelancing Posts</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{totalFreelancingApplications}</div>
                <div className="stat-label">Total Applicants</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{avgFreelancingApplications.toFixed(1)}</div>
                <div className="stat-label">Avg Applicants / Post</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{freelancingUniquePosters}</div>
                <div className="stat-label">Unique Posters</div>
              </div>
            </div>

            <div className="admin-insights">
              <div className="insight-card">
                <h3 className="insight-title">Freelancing Status Mix</h3>
                <div className="insight-list">
                  <div className="insight-row">
                    <span className="badge badge-success">Active</span>
                    <span>{freelancingStatusCounts.active}</span>
                  </div>
                  <div className="insight-row">
                    <span className="badge badge-danger">Closed</span>
                    <span>{freelancingStatusCounts.closed}</span>
                  </div>
                  <div className="insight-row">
                    <span className="badge badge-warning">Draft</span>
                    <span>{freelancingStatusCounts.draft}</span>
                  </div>
                </div>
              </div>
              <div className="insight-card">
                <h3 className="insight-title">Top Freelancing by Applicants</h3>
                {topFreelancing.length === 0 ? (
                  <p className="dashboard-meta">No freelancing posts yet.</p>
                ) : (
                  <div className="insight-list">
                    {topFreelancing.map((item) => (
                      <div key={item._id} className="insight-row">
                        <span className="insight-job">{item.title}</span>
                        <span>{item.applications?.length || 0}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="job-list-header">
              <h2 className="job-list-title">Freelancing Overview</h2>
              <span className="dashboard-meta">{totalFreelancing} posts</span>
            </div>

            {freelancingLoading && (
              <div className="loading" style={{ minHeight: '180px' }}>
                <div className="spinner"></div>
              </div>
            )}

            {!freelancingLoading && totalFreelancing === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">No Data</div>
                <h3 className="empty-state-title">No freelancing posts found</h3>
                <p className="empty-state-text">Create or import postings to see insights here.</p>
              </div>
            )}

            <div className="admin-job-grid">
              {freelancing.map((item) => {
                const applicants = applicationsByFreelancing[item._id] || [];
                const applicantCount = item.applications?.length || 0;
                const postedByName = item.postedBy?.name || 'Unknown';
                const postedByEmail = item.postedBy?.email || '—';
                const postedByCompany = item.postedBy?.company || item.companyName || '—';

                return (
                  <div key={item._id} className="admin-job-card">
                    <div className="admin-job-header">
                      <div>
                        <div className="admin-job-title">{item.title}</div>
                        <div className="admin-job-meta">{item.companyName} • {item.location || 'Location not set'}</div>
                        <div className="admin-job-meta">Posted on {formatDateShort(item.createdAt)}</div>
                      </div>
                      <div className="admin-job-status">
                        <span className={`badge ${getJobStatusBadge(item.status)}`}>{item.status || 'active'}</span>
                      </div>
                    </div>

                    <div className="admin-job-tags">
                      <span className="admin-tag">Applicants: <strong>{applicantCount}</strong></span>
                      <span className="admin-tag">Views: <strong>{item.views || 0}</strong></span>
                      <span className="admin-tag">Rate: <strong>{formatRate(item.rate)}</strong></span>
                      <span className="admin-tag">Type: <strong>{getProjectTypeLabel(item.projectType)}</strong></span>
                    </div>

                    <div className="admin-job-footer">
                      <div className="admin-job-meta">
                        Posted by <strong>{postedByName}</strong> ({postedByCompany}) • {postedByEmail}
                      </div>
                      <div className="admin-job-actions">
                        <Link className="btn btn-outline btn-sm" to={`/freelancing/${item._id}`}>View Post</Link>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => toggleFreelancingApplications(item._id)}
                        >
                          {expandedFreelancingId === item._id ? 'Hide Applicants' : 'View Applicants'}
                        </button>
                      </div>
                    </div>

                    {expandedFreelancingId === item._id && (
                      <div className="admin-applications">
                        {freelancingAppsLoading[item._id] && (
                          <div className="dashboard-meta">Loading applicants...</div>
                        )}
                        {freelancingAppsError[item._id] && (
                          <div className="alert alert-warning">{freelancingAppsError[item._id]}</div>
                        )}
                        {!freelancingAppsLoading[item._id] && applicants.length === 0 && (
                          <div className="dashboard-meta">No applicants yet.</div>
                        )}

                        {!freelancingAppsLoading[item._id] && applicants.length > 0 && (
                          <div className="admin-app-list">
                            {applicants.map((applicant) => (
                              <div key={applicant._id} className="admin-app-card">
                                <div>
                                  <div className="admin-app-name">{applicant.name || 'Unnamed Applicant'}</div>
                                  <div className="admin-app-meta">{applicant.email || 'No email provided'}</div>
                                  <div className="admin-app-meta">Applied: Not tracked</div>
                                </div>
                                <span className="badge badge-primary">Applied</span>
                              </div>
                            ))}
                          </div>
                        )}
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

export default AdminDashboard;
