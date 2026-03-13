import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = process.env.REACT_APP_API_URL || '/api';
const resolveOAuthBaseUrl = () => {
  const envUrl = process.env.REACT_APP_OAUTH_URL || process.env.REACT_APP_API_URL || '/api';
  if (/^https?:\/\//i.test(envUrl)) return envUrl;
  if (typeof window === 'undefined') return envUrl;

  const protocol = window.location.protocol || 'http:';
  const host = window.location.hostname || 'localhost';
  const basePath = envUrl.startsWith('/') ? envUrl : `/${envUrl}`;

  if (process.env.NODE_ENV === 'development') {
    return `${protocol}//${host}:5000${basePath}`;
  }

  return envUrl;
};

const normalizeRole = (role) => {
  if (role === 'jobseeker') return 'candidate';
  if (role === 'employer' || role === 'admin') return 'organization';
  return role;
};

const normalizeUser = (user) => {
  if (!user) return null;
  const roleRaw = user.roleRaw || user.role;
  return {
    ...user,
    roleRaw,
    role: normalizeRole(roleRaw)
  };
};

const isOrganizationRole = (role) => normalizeRole(role) === 'organization';
const isCandidateRole = (role) => normalizeRole(role) === 'candidate';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await axios.get(`${API_URL}/auth/me`);
        setUser(normalizeUser(response.data.user));
      } catch (err) {
        console.error('Auth check failed:', err);
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
      }
    }
    
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      }, {
        withCredentials: true
      });
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(normalizeUser(user));
      
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      return { success: false, message };
    }
  };

  const register = async (name, email, password, role, company) => {
    try {
      setError(null);
      const response = await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password,
        role,
        company
      }, {
        withCredentials: true
      });
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(normalizeUser(user));
      
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      return { success: false, message };
    }
  };

  const loginWithGoogle = (role, company) => {
    const oauthBaseUrl = resolveOAuthBaseUrl();
    const params = new URLSearchParams();
    if (role) params.set('role', role);
    if (company) params.set('company', company);
    const storedRedirect = localStorage.getItem('postLoginRedirect');
    if (storedRedirect) params.set('redirect', storedRedirect);
    const query = params.toString();
    window.location.href = `${oauthBaseUrl}/auth/google${query ? `?${query}` : ''}`;
  };

  const handleAuthCallback = (token) => {
    if (token) {
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      checkAuth();
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, {
        withCredentials: true
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
    
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const response = await axios.put(`${API_URL}/auth/updateprofile`, profileData);
      setUser(normalizeUser(response.data.user));
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Update failed';
      setError(message);
      return { success: false, message };
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    loginWithGoogle,
    handleAuthCallback,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    isOrganization: isOrganizationRole(user?.roleRaw || user?.role),
    isCandidate: isCandidateRole(user?.roleRaw || user?.role),
    isAdmin: user?.roleRaw === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
