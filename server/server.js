const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();

// Trust Render's proxy (required for express-rate-limit and accurate IP detection)
app.set('trust proxy', 1);

// ── Security ──────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// ── CORS — allow frontend in dev ──────────────────────────────
const allowedOrigins = [
  'http://localhost:5173', 'http://localhost:3000', 'http://localhost:5000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(null, true); // allow all in production (same-origin)
  },
  credentials: true,
}));

// ── Rate limiting ──────────────────────────────────────────────
app.use('/api/', rateLimit({ windowMs:15*60*1000, max:500, message:{ error:'Too many requests.' } }));
const authLimiter = rateLimit({ windowMs:15*60*1000, max:20, message:{ error:'Too many auth attempts.' } });

// ── Request logging (dev only) ──────────────────────────────────
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// ── Body parsing ───────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health check ───────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({
  status: 'ok', version: '2.3.0',
  env: process.env.NODE_ENV,
  db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  time: new Date().toISOString(),
  features: {
    googleFit: !!(process.env.GOOGLE_CLIENT_ID),
    ifct2017:  process.env.IFCT_ENABLED === 'true',
  },
}));

// ── Routes ──────────────────────────────────────────────────────
app.use('/api/auth',      authLimiter,               require('./routes/auth'));
app.use('/api/users',                                require('./routes/users'));
app.use('/api/nutrition',                            require('./routes/nutrition'));
app.use('/api/workouts',                             require('./routes/workouts'));
app.use('/api/recipes',                              require('./routes/recipes'));
app.use('/api/goals',                                require('./routes/goals'));
app.use('/api/social',                               require('./routes/social'));
app.use('/api/foods',                                require('./routes/foods'));
app.use('/api/admin',                                require('./routes/admin'));
// Google Fit REST OAuth
app.use('/api/googlefit', require('./routes/googlefit'));
// Health Connect (Android 13+ push-based bridge — no OAuth needed)
app.use('/api/healthconnect', require('./routes/healthconnect'));

// ── Serve React build ──────────────────────────────────────────
const clientDist = path.join(__dirname, 'public');
app.use(express.static(clientDist, {
  maxAge: '1y',
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html') || filePath.endsWith('sw.js') || filePath.endsWith('.webmanifest')) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    }
    if (filePath.endsWith('sw.js')) res.setHeader('Service-Worker-Allowed', '/');
    // Inject Health Connect Web Bridge Origin Trial token if configured.
    // Get your token at: https://developer.chrome.com/origintrials/#/trials/active
    // Search for "Health Connect" and register your origin.
    if (filePath.endsWith('.html') && process.env.HEALTH_CONNECT_OT_TOKEN) {
      res.setHeader('Origin-Trial', process.env.HEALTH_CONNECT_OT_TOKEN);
    }
  },
}));

// ── SPA fallback ───────────────────────────────────────────────
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  const htmlPath = path.join(clientDist, 'index.html');
  // Inject Origin Trial token as HTTP header for Health Connect Web Bridge
  if (process.env.HEALTH_CONNECT_OT_TOKEN) {
    res.setHeader('Origin-Trial', process.env.HEALTH_CONNECT_OT_TOKEN);
  }
  res.sendFile(htmlPath, err => {
    if (err) res.status(500).json({ error: 'Client not built. Run npm run build.' });
  });
});

// ── Error handler ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Server error' : err.message,
  });
});

// ── Start ──────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    // ── Auto-grant admin to ADMIN_EMAIL on every startup ──────────
    if (process.env.ADMIN_EMAIL) {
      try {
        const User = require('./models/User');
        const result = await User.updateOne(
          { email: process.env.ADMIN_EMAIL.toLowerCase().trim() },
          { $set: { isAdmin: true, isActive: true } }
        );
        if (result.matchedCount > 0) {
          console.log(`🛡️  Admin granted to ${process.env.ADMIN_EMAIL}`);
        } else {
          console.log(`ℹ️  ADMIN_EMAIL user not yet registered (will get admin on first login)`);
        }
      } catch (e) { console.warn('Admin bootstrap error:', e.message); }
    }
    app.listen(PORT, () => {
      console.log(`🌿 FitNest v2.3 on port ${PORT}`);
      console.log(`   Health → http://localhost:${PORT}/api/health`);
    });
  })
  .catch(err => { console.error('❌ MongoDB:', err.message); process.exit(1); });

module.exports = app;
