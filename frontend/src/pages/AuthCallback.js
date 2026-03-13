import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Processing authentication...');

  useEffect(() => {
    const normalizeRedirect = (value) => {
      if (!value || typeof value !== 'string') return '/';
      if (!value.startsWith('/')) return '/';
      if (value.startsWith('/login') || value.startsWith('/auth/callback')) return '/';
      return value;
    };

    const getPostLoginRedirect = () => {
      const urlRedirect = searchParams.get('redirect');
      if (urlRedirect) {
        return normalizeRedirect(urlRedirect);
      }

      const stored = localStorage.getItem('postLoginRedirect');
      if (stored) {
        localStorage.removeItem('postLoginRedirect');
        return normalizeRedirect(stored);
      }
      return '/';
    };

    const handleCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');
      const error_description = searchParams.get('error_description');

      // Check for OAuth errors
      if (error) {
        setStatus(`Authentication failed: ${error_description || error}`);
        setTimeout(() => navigate('/login?error=' + encodeURIComponent(error_description || error)), 3000);
        return;
      }

      // Check for Google OAuth token (successful login)
      if (token) {
        setStatus('✅ Authentication successful! Redirecting...');
        localStorage.setItem('token', token);
        const redirectTo = getPostLoginRedirect();
        setTimeout(() => navigate(redirectTo, { replace: true }), 1500);
        return;
      }

      // If no token and no error, continue to redirect home
      const code = searchParams.get('code');
      if (!code) {
        setStatus('Authentication completed. Redirecting...');
        const redirectTo = getPostLoginRedirect();
        setTimeout(() => navigate(redirectTo, { replace: true }), 1500);
        return;
      }

      setStatus('Completing authentication...');
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
      }}>
        <h2 style={{ color: '#333', marginBottom: '20px' }}>Authentication</h2>
        
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          {status.includes('✅') ? (
            <span style={{ color: '#28a745', fontSize: '1.2rem' }}>{status}</span>
          ) : status.includes('❌') ? (
            <span style={{ color: '#dc3545', fontSize: '1.2rem' }}>{status}</span>
          ) : (
            <div>
              <div className="spinner" style={{ margin: '0 auto 15px' }}></div>
              <p style={{ color: '#666', margin: 0 }}>{status}</p>
            </div>
          )}
        </div>

        <p style={{ color: '#999', fontSize: '0.9rem' }}>
          Please wait while we complete the authentication process.
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
