const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

const resolveEnvPath = () => {
  const forceLocal = process.env.FORCE_LOCAL_ENV === 'true' || process.env.FORCE_LOCAL_ENV === '1';
  const preferLocal = forceLocal || process.env.NODE_ENV !== 'production';
  const candidates = preferLocal
    ? ['.env.example.local', '.env']
    : ['.env'];

  for (const name of candidates) {
    const candidatePath = path.resolve(__dirname, name);
    if (fs.existsSync(candidatePath)) return candidatePath;
  }

  return null;
};

const envPath = resolveEnvPath();
if (envPath) {
  const shouldOverride = path.basename(envPath) === '.env.example.local';
  dotenv.config({ path: envPath, override: shouldOverride });
} else {
  dotenv.config();
}

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// CORS Configuration - supports both localhost and production
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const CORS_ORIGINS = [
  'http://localhost:3000',
  'https://entrepreneur.jankoti.com'
];

app.use(cors({
  origin: CORS_ORIGINS,
  credentials: true
}));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    runDataCleanup();
    setInterval(runDataCleanup, 12 * 60 * 60 * 1000);
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');
const adminRoutes = require('./routes/admin');
const freelancingRoutes = require('./routes/freelancing');
const startupRoutes = require('./routes/startup');
const podcastRoutes = require('./routes/podcast');
const classifiedRoutes = require('./routes/classified');
const Job = require('./models/Job');
const Application = require('./models/Application');
const Freelancing = require('./models/Freelancing');
const FreelancingApplication = require('./models/FreelancingApplication');
const Startup = require('./models/Startup');
const Podcast = require('./models/Podcast');
const Classified = require('./models/Classified');

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/freelancing', freelancingRoutes);
app.use('/api/startup', startupRoutes);
app.use('/api/podcast', podcastRoutes);
app.use('/api/classified', classifiedRoutes);

const POST_AUTO_PURGE_DAYS = Number(process.env.POST_AUTO_PURGE_DAYS || process.env.JOB_AUTO_PURGE_DAYS || 60);

const runDataCleanup = async () => {
  try {
    if (Number.isFinite(POST_AUTO_PURGE_DAYS) && POST_AUTO_PURGE_DAYS > 0) {
      const cutoff = new Date(Date.now() - POST_AUTO_PURGE_DAYS * 24 * 60 * 60 * 1000);
      const expiredJobs = await Job.find({ createdAt: { $lt: cutoff } }).select('_id').lean();
      const expiredJobIds = expiredJobs.map((job) => job._id);
      if (expiredJobIds.length > 0) {
        await Application.deleteMany({ job: { $in: expiredJobIds } });
        await Job.deleteMany({ _id: { $in: expiredJobIds } });
      }

      const expiredFreelancing = await Freelancing.find({ createdAt: { $lt: cutoff } })
        .select('_id')
        .lean();
      const expiredFreelancingIds = expiredFreelancing.map((item) => item._id);
      if (expiredFreelancingIds.length > 0) {
        await FreelancingApplication.deleteMany({ freelancing: { $in: expiredFreelancingIds } });
        await Freelancing.deleteMany({ _id: { $in: expiredFreelancingIds } });
      }
    }
  } catch (error) {
    console.warn('Data cleanup failed:', error.message);
  }
};

const escapeXml = (value) => {
  if (!value) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const buildSitemapXml = ({ baseUrl, staticPaths, dynamicEntries }) => {
  const urlset = [];
  const addUrl = (loc, lastmod) => {
    if (!loc) return;
    const safeLoc = escapeXml(loc);
    const lastmodTag = lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : '';
    urlset.push(`<url><loc>${safeLoc}</loc>${lastmodTag}</url>`);
  };

  staticPaths.forEach((pathItem) => {
    addUrl(`${baseUrl}${pathItem}`, null);
  });

  dynamicEntries.forEach(({ pathItem, lastmod }) => {
    addUrl(`${baseUrl}${pathItem}`, lastmod);
  });

  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${urlset.join('\n')}\n` +
    `</urlset>`;
};

app.get('/sitemap.xml', async (req, res) => {
  const baseUrl = (process.env.SITE_URL || process.env.FRONTEND_URL || 'https://entrepreneur.jankoti.com')
    .replace(/\/$/, '');
  const staticPaths = [
    '/',
    '/jobs',
    '/freelancing-view',
    '/startup-view',
    '/podcast-view',
    '/classified-view'
  ];

  try {
    const [jobs, freelancing, startups, podcasts, classifieds] = await Promise.all([
      Job.find({ status: 'active' }).select('_id updatedAt createdAt').lean(),
      Freelancing.find({ status: 'active' }).select('_id updatedAt createdAt').lean(),
      Startup.find({ status: 'active' }).select('_id updatedAt createdAt').lean(),
      Podcast.find({ status: 'active' }).select('_id updatedAt createdAt').lean(),
      Classified.find({ status: 'active' }).select('_id updatedAt createdAt').lean()
    ]);

    const dynamicEntries = [
      ...jobs.map((item) => ({
        pathItem: `/jobs/${item._id}`,
        lastmod: (item.updatedAt || item.createdAt || new Date()).toISOString()
      })),
      ...freelancing.map((item) => ({
        pathItem: `/freelancing/${item._id}`,
        lastmod: (item.updatedAt || item.createdAt || new Date()).toISOString()
      })),
      ...startups.map((item) => ({
        pathItem: `/startup/${item._id}`,
        lastmod: (item.updatedAt || item.createdAt || new Date()).toISOString()
      })),
      ...podcasts.map((item) => ({
        pathItem: `/podcast/${item._id}`,
        lastmod: (item.updatedAt || item.createdAt || new Date()).toISOString()
      })),
      ...classifieds.map((item) => ({
        pathItem: `/classified/${item._id}`,
        lastmod: (item.updatedAt || item.createdAt || new Date()).toISOString()
      }))
    ];

    const xml = buildSitemapXml({ baseUrl, staticPaths, dynamicEntries });
    res.set('Content-Type', 'application/xml');
    return res.status(200).send(xml);
  } catch (error) {
    const fallbackPath = path.resolve(__dirname, '..', 'frontend', 'public', 'sitemap.xml');
    if (fs.existsSync(fallbackPath)) {
      const fallbackXml = fs.readFileSync(fallbackPath, 'utf8');
      res.set('Content-Type', 'application/xml');
      return res.status(200).send(fallbackXml);
    }
    const xml = buildSitemapXml({ baseUrl, staticPaths, dynamicEntries: [] });
    res.set('Content-Type', 'application/xml');
    return res.status(200).send(xml);
  }
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
