import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { loginWithGoogle } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState('candidate');
  const [company, setCompany] = useState('');

  useEffect(() => {
    const redirect = searchParams.get('redirect');
    if (redirect) {
      localStorage.setItem('postLoginRedirect', redirect);
    } else {
      localStorage.removeItem('postLoginRedirect');
    }
  }, [searchParams]);

  const handleGoogleSignIn = () => {
    setError('');
    setLoading(true);

    try {
      loginWithGoogle(role, role === 'organization' ? company : undefined);
    } catch (err) {
      setError('Google sign in failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Sign in to your account</p>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="role-selector" style={{ marginTop: '20px' }}>
          <button
            type="button"
            className={`role-option ${role === 'candidate' ? 'active' : ''}`}
            onClick={() => setRole('candidate')}
          >
            Candidate
          </button>
          <button
            type="button"
            className={`role-option ${role === 'organization' ? 'active' : ''}`}
            onClick={() => setRole('organization')}
          >
            Organization
          </button>
        </div>

        {role === 'organization' && (
          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label">Organization Name (optional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter your organization name"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
            />
          </div>
        )}

        <div style={{ marginTop: '20px' }}>
          <button
            className="btn btn-google btn-block"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.7 1.22 9.2 3.62l6.86-6.86C35.88 2.58 30.45 0 24 0 14.62 0 6.51 5.38 2.56 13.22l8.06 6.26C12.64 13.06 17.85 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.52 24.55c0-1.62-.14-3.18-.4-4.7H24v9.01h12.7c-.56 2.86-2.17 5.28-4.6 6.9l7.08 5.5c4.14-3.82 6.34-9.45 6.34-16.71z"/>
              <path fill="#FBBC05" d="M10.62 28.51a14.5 14.5 0 0 1-.76-4.51c0-1.57.27-3.09.76-4.51l-8.06-6.26A23.95 23.95 0 0 0 0 24c0 3.86.92 7.51 2.56 10.78l8.06-6.27z"/>
              <path fill="#34A853" d="M24 48c6.45 0 11.88-2.13 15.86-5.8l-7.08-5.5c-1.97 1.32-4.5 2.1-8.78 2.1-6.15 0-11.36-3.56-13.38-8.72l-8.06 6.27C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>
        </div>

        <p className="auth-footer">
          Do not have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
