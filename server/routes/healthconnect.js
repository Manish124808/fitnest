/**
 * Health Connect Bridge Route
 * ─────────────────────────────────────────────────────────────────
 * Android 14+ / Pixel devices moved all fitness data from the Google
 * Fitness REST API into Health Connect.  The Fitness REST API returns
 * silent zeros for those users — there is no error, just no data.
 *
 * Health Connect has NO REST API.  It is a local Android SDK only.
 * The solution is a "push" architecture:
 *   1. The PWA (running in Android WebView / Chrome) uses the
 *      Health Connect Web Bridge (navigator.health) to read data
 *      directly on the device.
 *   2. The PWA posts that data to this server endpoint.
 *   3. The server persists it exactly like it used to after a Fit sync.
 *
 * This file is a drop-in replacement for routes/googlefit.js
 * Rename it or mount it alongside:
 *   app.use('/api/healthconnect', require('./routes/healthconnect'));
 *   app.use('/api/googlefit',     require('./routes/healthconnect')); // alias
 */

const express  = require('express');
const User     = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────
// Status — tells the client which backend is active
// ─────────────────────────────────────────────────────────────────
router.get('/status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('healthConnect fitStats');
    res.json({
      // Keep field name 'connected' so the existing frontend works unchanged
      connected:  user?.healthConnect?.connected || false,
      available:  true,
      backend:    'healthconnect',   // new field — client can detect migration
      lastSync:   user?.healthConnect?.lastSync,
      stats:      user?.fitStats || {},
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// Connect — no OAuth needed for Health Connect.
// The PWA requests permissions directly on the device via
// navigator.health.requestPermission(). We just mark the user as
// "connected" in the DB so the UI shows the right state.
// ─────────────────────────────────────────────────────────────────
router.post('/connect', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        'healthConnect.connected': true,
        'healthConnect.connectedAt': new Date(),
      },
    });
    res.json({ connected: true, message: 'Health Connect linked.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Legacy GET /connect — returns instructions for the new flow
// (keeps the old URL working if anything still calls it)
router.get('/connect', protect, (req, res) => {
  res.json({
    backend:  'healthconnect',
    message:  'Health Connect uses on-device permissions, not OAuth. ' +
              'POST to /api/healthconnect/connect after the PWA has ' +
              'obtained device permissions.',
  });
});

// ─────────────────────────────────────────────────────────────────
// Sync — the PWA pushes data it read locally from Health Connect.
//
// Expected body:
// {
//   steps:          number,   // today's step count
//   caloriesBurned: number,   // kcal
//   distance:       number,   // metres
//   activeMinutes:  number,
//   heartRate:      number,   // bpm average (0 = no data)
//   sleep:          number,   // hours (0 = no data)
//   weight:         number,   // kg (0 = no data)
//   spo2:           number,   // % (0 = no data)
//   workoutSessions: Array,   // same shape as before
//   source:         string,   // 'healthconnect' | 'googlefit' | 'manual'
// }
// ─────────────────────────────────────────────────────────────────
router.post('/sync', protect, async (req, res) => {
  try {
    const {
      steps          = 0,
      caloriesBurned = 0,
      distance       = 0,
      activeMinutes  = 0,
      heartRate      = 0,
      sleep          = 0,
      weight         = 0,
      spo2           = 0,
      workoutSessions = [],
      source         = 'healthconnect',
    } = req.body;

    // Basic sanity — reject obviously bogus values
    if (steps < 0 || steps > 100000)
      return res.status(400).json({ error: `steps out of range: ${steps}` });
    if (caloriesBurned < 0 || caloriesBurned > 20000)
      return res.status(400).json({ error: `caloriesBurned out of range: ${caloriesBurned}` });

    const stats = {
      steps:           Math.round(steps),
      caloriesBurned:  Math.round(caloriesBurned),
      distance:        Math.round(distance),
      activeMinutes:   Math.round(activeMinutes),
      heartRate:       Math.round(heartRate),
      sleep:           Math.round(sleep * 10) / 10,
      weight:          Math.round(weight * 10) / 10,
      spo2:            Math.round(spo2),
      workoutSessions: Array.isArray(workoutSessions) ? workoutSessions.slice(0, 20) : [],
      lastUpdated:     new Date(),
      source,
    };

    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        fitStats: stats,
        'healthConnect.connected': true,
        'healthConnect.lastSync':  new Date(),
      },
    });

    res.json({ stats, message: 'Synced successfully' });
  } catch (err) {
    console.error('HC sync error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// Disconnect
// ─────────────────────────────────────────────────────────────────
router.delete('/disconnect', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        'healthConnect.connected': false,
        fitStats: {
          steps: 0, caloriesBurned: 0, activeMinutes: 0, distance: 0,
          heartRate: 0, sleep: 0, weight: 0, spo2: 0, workoutSessions: [],
        },
      },
    });
    res.json({ message: 'Disconnected' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// Debug — shows current stored stats (no external API call needed)
// ─────────────────────────────────────────────────────────────────
router.get('/debug', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('healthConnect fitStats');
    res.json({
      backend:        'healthconnect',
      connected:      user?.healthConnect?.connected,
      lastSync:       user?.healthConnect?.lastSync,
      storedStats:    user?.fitStats,
      note:           'Health Connect data is pushed from the Android PWA. ' +
                      'Use the Sync button in the app to push fresh data.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// Callback stub — old OAuth callback URL may still be registered
// in Google Console; redirect gracefully instead of 404-ing.
// ─────────────────────────────────────────────────────────────────
router.get('/callback', (req, res) => {
  const front = (process.env.FRONTEND_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:5173').replace(/\/$/, '');
  res.redirect(`${front}/profile?hc=migrated`);
});

module.exports = router;
