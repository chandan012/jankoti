const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');
const { auth, normalizeRole, isAdminEmail } = require('../middleware/auth');
const { sendAdminAlert } = require('../services/emailService');

const ALLOWED_ROLES = ['candidate', 'organization'];
const normalizeRedirect = (redirect) => {
  if (!redirect || typeof redirect !== 'string') return undefined;
  const trimmed = redirect.trim();
  if (!trimmed.startsWith('/')) return undefined;
  if (trimmed.startsWith('/login') || trimmed.startsWith('/auth/callback')) return undefined;
  if (trimmed.includes('://')) return undefined;
  return trimmed;
};

const encodeState = (payload) => {
  if (!payload) return undefined;
  const json = JSON.stringify(payload);
  const base64 = Buffer.from(json, 'utf8').toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const decodeState = (state) => {
  if (!state) return null;
  try {
    const base64 = state.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch (error) {
    return null;
  }
};

// Google OAuth Strategy Configuration
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'your_google_client_id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your_google_client_secret',
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      const stateData = decodeState(req?.query?.state);
      const requestedRole = normalizeRole(stateData?.role);
      const resolvedRole = ALLOWED_ROLES.includes(requestedRole) ? requestedRole : 'candidate';
      const company = resolvedRole === 'organization' ? stateData?.company : undefined;
      const profileEmail = profile.emails?.[0]?.value;
      const isAdmin = isAdminEmail(profileEmail);

      // Check if user already exists
      let user = await User.findOne({ googleId: profile.id });
      
      if (user) {
        if (isAdmin && user.role !== 'admin') {
          user.role = 'admin';
          await user.save();
        } else if (resolvedRole && normalizeRole(user.role) !== resolvedRole) {
          user.role = resolvedRole;
          if (resolvedRole === 'organization' && company && !user.company) {
            user.company = company;
          }
          await user.save();
        }
        return done(null, user);
      }
      
      // Check if user exists with same email
      user = await User.findOne({ email: profileEmail });
      
      if (user) {
        // Link Google account to existing user
        user.googleId = profile.id;
        user.profilePicture = profile.photos[0].value;
        if (isAdmin) {
          user.role = 'admin';
        } else if (resolvedRole && normalizeRole(user.role) !== resolvedRole) {
          user.role = resolvedRole;
          if (resolvedRole === 'organization' && company && !user.company) {
            user.company = company;
          }
        }
        await user.save();
        return done(null, user);
      }
      
      // Create new user
      user = await User.create({
        googleId: profile.id,
        email: profileEmail,
        name: profile.displayName,
        profilePicture: profile.photos[0].value,
        role: isAdmin ? 'admin' : resolvedRole,
        company
      });

      sendAdminAlert({
        subject: 'New user registration (Google)',
        text: `A new user registered via Google OAuth.\n\nName: ${user.name}\nEmail: ${user.email}\nRole: ${user.role}\n`
      }).catch((err) => console.warn('Admin alert failed:', err.message));
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_secret', {
    expiresIn: '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, company } = req.body;
    const normalizedRole = normalizeRole(role);
    const isAdmin = isAdminEmail(email);

    if (!isAdmin && !ALLOWED_ROLES.includes(normalizedRole)) {
      return res.status(400).json({ message: 'Please select a valid role' });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: isAdmin ? 'admin' : normalizedRole,
      company: normalizedRole === 'organization' ? company : undefined
    });

    sendAdminAlert({
      subject: 'New user registration',
      text: `A new user registered.\n\nName: ${user.name}\nEmail: ${user.email}\nRole: ${user.role}\n`
    }).catch((err) => console.warn('Admin alert failed:', err.message));
    
    // Generate token
    const token = generateToken(user._id);
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: normalizeRole(user.role),
        roleRaw: user.role,
        company: user.company
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }
    
    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = generateToken(user._id);
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: normalizeRole(user.role),
        roleRaw: user.role,
        company: user.company,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/auth/google
// @desc    Initiate Google OAuth
// @access  Public
router.get('/google', 
  (req, res, next) => {
    const requestedRole = normalizeRole(req.query.role);
    const role = ALLOWED_ROLES.includes(requestedRole) ? requestedRole : undefined;
    const rawCompany = typeof req.query.company === 'string' ? req.query.company.trim() : undefined;
    const company = rawCompany ? rawCompany : undefined;
    const redirect = normalizeRedirect(req.query.redirect);
    const state = encodeState({ role, company, redirect });

    passport.authenticate('google', { 
      scope: ['profile', 'email'],
      state
    })(req, res, next);
  }
);

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Generate JWT token
    const token = generateToken(req.user._id);
    const stateData = decodeState(req?.query?.state);
    const redirect = normalizeRedirect(stateData?.redirect);
    const redirectQuery = redirect ? `&redirect=${encodeURIComponent(redirect)}` : '';

    // Redirect to frontend with token (not to API endpoint)
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}${redirectQuery}`);
  }
);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = req.user;
    const userObj = user.toObject();
    userObj.roleRaw = userObj.role;
    userObj.role = normalizeRole(userObj.role);
    res.json({ user: userObj });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error logging out' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// @route   PUT /api/auth/updateprofile
// @desc    Update user profile
// @access  Private
router.put('/updateprofile', async (req, res) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    const { name, company, skills, resume } = req.body;
    
    const user = await User.findByIdAndUpdate(
      decoded.id,
      { 
        name, 
        company, 
        skills, 
        resume 
      },
      { new: true }
    );

    const userObj = user.toObject();
    userObj.roleRaw = userObj.role;
    userObj.role = normalizeRole(userObj.role);
    res.json({ user: userObj });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
