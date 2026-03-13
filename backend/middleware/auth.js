const jwt = require('jsonwebtoken');
const User = require('../models/User');

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'chandanzope21@gmail.com')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const isAdminEmail = (email) => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(String(email).toLowerCase());
};

const normalizeRole = (role) => {
  if (role === 'jobseeker') return 'candidate';
  if (role === 'employer' || role === 'admin') return 'organization';
  return role;
};

const isOrganizationRole = (role) => {
  return ['organization', 'employer', 'admin'].includes(role);
};

const isCandidateRole = (role) => {
  return ['candidate', 'jobseeker'].includes(role);
};

const auth = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (isAdminEmail(user.email) && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }

    req.userId = user._id.toString();
    req.user = user;
    req.isAdmin = user.role === 'admin' || isAdminEmail(user.email);
    req.userRole = normalizeRole(user.role);
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    const user = await User.findById(decoded.id);

    if (!user) {
      return next();
    }

    if (isAdminEmail(user.email) && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }

    req.userId = user._id.toString();
    req.user = user;
    req.isAdmin = user.role === 'admin' || isAdminEmail(user.email);
    req.userRole = normalizeRole(user.role);
    return next();
  } catch (error) {
    return next();
  }
};

const requireOrganization = (req, res, next) => {
  const role = req.userRole || req.user?.role;
  if (!isOrganizationRole(role)) {
    return res.status(403).json({ message: 'Organization access required' });
  }
  next();
};

const requireCandidate = (req, res, next) => {
  const role = req.userRole || req.user?.role;
  if (!isCandidateRole(role)) {
    return res.status(403).json({ message: 'Candidate access required' });
  }
  next();
};

module.exports = {
  auth,
  optionalAuth,
  requireOrganization,
  requireCandidate,
  normalizeRole,
  isOrganizationRole,
  isCandidateRole,
  isAdminEmail
};
