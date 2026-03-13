import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import JobView from './pages/JobView';
import PostJob from './pages/PostJob';
import JobDetail from './pages/JobDetail';
import Footer from './components/Footer';

// Import all the new pages
import FreelancingView from './pages/FreelancingView';
import PostFreelancing from './pages/PostFreelancing';
import FreelancingDetail from './pages/FreelancingDetail';
import StartupView from './pages/StartupView';
import PostStartup from './pages/PostStartup';
import StartupDetail from './pages/StartupDetail';
import PodcastView from './pages/PodcastView';
import PostPodcast from './pages/PostPodcast';
import PodcastDetail from './pages/PodcastDetail';
import ClassifiedView from './pages/ClassifiedView';
import PostClassified from './pages/PostClassified';
import ClassifiedDetail from './pages/ClassifiedDetail';
import TermsCondition from './pages/TermsCondition';
import AdminDashboard from './pages/AdminDashboard';

// Protected Route
const ProtectedRoute = ({ children, requireOrganization = false, requireCandidate = false, requireAdmin = false }) => {
  const { isAuthenticated, isOrganization, isCandidate, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading" style={{ minHeight: '60vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirectTo = `${location.pathname}${location.search}${location.hash}`;
    if (redirectTo && redirectTo !== '/login') {
      localStorage.setItem('postLoginRedirect', redirectTo);
    }
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirectTo)}`} replace />;
  }

  if (requireOrganization && !isOrganization) {
    return <Navigate to="/" replace />;
  }

  if (requireCandidate && !isCandidate) {
    return <Navigate to="/" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Auth Callback Handler
const AuthCallbackHandler = () => {
  const [searchParams] = useSearchParams();
  const { handleAuthCallback } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      handleAuthCallback(token);
    }
  }, [searchParams, handleAuthCallback]);

  return <AuthCallback />;
};

function App() {
  return (
    <div className="App">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallbackHandler />} />
          
          {/* Public listing routes */}
          <Route path="/jobs" element={<JobView />} />
          <Route path="/post-job" element={<ProtectedRoute requireOrganization><PostJob /></ProtectedRoute>} />
          <Route path="/jobs/:id" element={<ProtectedRoute><JobDetail /></ProtectedRoute>} />
          
          <Route path="/freelancing-view" element={<FreelancingView />} />
          <Route path="/post-freelancing" element={<ProtectedRoute requireOrganization><PostFreelancing /></ProtectedRoute>} />
          <Route path="/freelancing/:id" element={<ProtectedRoute><FreelancingDetail /></ProtectedRoute>} />
          
          <Route path="/startup-view" element={<StartupView />} />
          <Route path="/post-startup" element={<ProtectedRoute requireOrganization><PostStartup /></ProtectedRoute>} />
          <Route path="/startup/:id" element={<ProtectedRoute><StartupDetail /></ProtectedRoute>} />
          
          <Route path="/podcast-view" element={<PodcastView />} />
          <Route path="/post-podcast" element={<ProtectedRoute requireOrganization><PostPodcast /></ProtectedRoute>} />
          <Route path="/podcast/:id" element={<ProtectedRoute><PodcastDetail /></ProtectedRoute>} />
          
          <Route path="/classified-view" element={<ClassifiedView />} />
          <Route path="/post-classified" element={<ProtectedRoute requireOrganization><PostClassified /></ProtectedRoute>} />
          <Route path="/classified/:id" element={<ProtectedRoute><ClassifiedDetail /></ProtectedRoute>} />

          <Route path="/my-jobs" element={<ProtectedRoute requireOrganization><JobView myJobsOnly={true} /></ProtectedRoute>} />
          <Route path="/terms-condition" element={<TermsCondition />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
