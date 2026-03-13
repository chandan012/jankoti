import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/jankotilogo1.png';

const Navbar = () => {
  const { user, isAuthenticated, isOrganization, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setAvatarError(false);
  }, [user?.profilePicture]);

  useEffect(() => {
    if (!showDropdown) return;

    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [showDropdown]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowDropdown(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" aria-label="Home">
          <img src={logo} alt="Jankoti logo" className="navbar-logo-image" />
          
        </Link>
        
        <div className="navbar-links">
          <Link to="/jobs">Job News</Link>
          <Link to="/freelancing-view">Freelancing</Link>
          <Link to="/startup-view">Startup</Link>
          <Link to="/podcast-view">Podcast</Link>
          <Link to="/classified-view">Classified</Link>

          {isAuthenticated ? (
            <div className="user-menu">
              
              
              <div className={`dropdown ${showDropdown ? 'open' : ''}`} ref={dropdownRef}>
                <button 
                  className="user-menu-btn"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  {user?.profilePicture && !avatarError ? (
                    <img 
                      src={user.profilePicture} 
                      alt={user.name || 'User avatar'}
                      className="user-avatar"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <div className="user-avatar-placeholder">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span>{(user?.name || '').trim().split(' ')[0] || 'User'}</span>
                </button>
                
                {showDropdown && (
                  <div className="dropdown-content">
                    {isAdmin && (
                      <Link to="/admin/dashboard" onClick={() => setShowDropdown(false)}>
                        Admin Dashboard
                      </Link>
                    )}
                    {isOrganization && (
                      <>
                        <Link to="/post-job" onClick={() => setShowDropdown(false)}>
                          Post a Job
                        </Link>
                        <Link to="/post-freelancing" onClick={() => setShowDropdown(false)}>
                          Post Freelancing
                        </Link>
                        <Link to="/post-startup" onClick={() => setShowDropdown(false)}>
                          Post Startup
                        </Link>
                        <Link to="/post-podcast" onClick={() => setShowDropdown(false)}>
                          Post Podcast
                        </Link>
                        <Link to="/post-classified" onClick={() => setShowDropdown(false)}>
                          Post Classified
                        </Link>
                      </>
                    )}
                    <button onClick={handleLogout}>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline btn-sm">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
