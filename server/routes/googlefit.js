const express = require('express');
const User    = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

let google = null;
try {
  google = require('googleapis').google;
  console.log('✅ googleapis loaded');
} catch (e) {
  console.warn('⚠️  googleapis not found — Google Fit disabled');
}

function googleAvailable(req, res, next) {
  if (!google) return res.status(503).json({ error: 'googleapis not installed. Run: cd server && npm install' });
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET)
    return res.status(503).json({ error: 'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in env vars.' });
  next();
}

function getRedirectUri() {
  // GOOGLE_REDIRECT_URI in env always wins — set this explicitly in Render to:
  //   https://<your-app>.onrender.com/api/googlefit/callback
  // and register EXACTLY that URL in Google Cloud Console → OAuth → Authorized redirect URIs.
  if (process.env.GOOGLE_REDIRECT_URI) {
    // Strip any accidental trailing slash or whitespace from copy-paste
    return process.env.GOOGLE_REDIRECT_URI.trim().replace(/\/$/, '');
  }
  // Auto-detect from Render's injected external URL (reliable on Render)
  const base = process.env.RENDER_EXTERNAL_URL
    || process.env.FRONTEND_URL
    || 'http://localhost:5000';
  return base.replace(/\/$/, '') + '/api/googlefit/callback';
}

function makeClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    getRedirectUri()
  );
}

const SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.body.read',
  'https://www.googleapis.com/auth/fitness.heart_rate.read',
  'https://www.googleapis.com/auth/fitness.sleep.read',
  'https://www.googleapis.com/auth/fitness.oxygen_saturation.read',
];

// MET table for calorie estimation when Fit doesn't provide calories per session
const MET_TABLE = {
  11:6.8, 14:7.5, 62:9.8, 63:8.0, 64:10.0, 65:8.3,
  90:3.5, 91:4.5, 92:3.8,
  79:5.0, 94:6.0, 46:5.5,
  97:3.0, 55:3.8, 51:2.5,
  81:7.0, 82:6.5, 83:8.0,
  29:5.0, 77:4.0, 59:7.0, 60:6.5,
  40:5.3, 36:3.5, 43:3.0,
};

function getActivityIcon(t) {
  const m = {62:'🏃',63:'🏃',65:'🏃',90:'🚶',91:'🚶',92:'🚶',11:'🚴',13:'🚵',14:'🚴',15:'🚴',79:'🏋️',94:'🏋️',46:'🏋️',81:'🏊',82:'🏊',83:'🏊',40:'🥾',97:'🧘',55:'🧘',29:'⚙️',77:'🪜',59:'🚣',60:'🚣',21:'🥊',47:'🥊',52:'🥊'};
  return m[t] || '⚡';
}

const ACTIVITY_MAP = {
  1:'Aerobics',7:'Badminton',9:'Basketball',11:'Biking',13:'Mountain Biking',14:'Road Biking',15:'Spinning',
  21:'Boxing',22:'Calisthenics',23:'Circuit Training',25:'CrossFit',27:'Dancing',29:'Elliptical',
  36:'Gardening',37:'Golf',38:'Gymnastics',40:'Hiking',41:'Hockey',43:'Housework',44:'Jump Rope',
  45:'Kayaking',46:'Kettlebell',47:'Kickboxing',50:'Martial Arts',51:'Meditation',52:'MMA',
  55:'Pilates',57:'Racquetball',58:'Rock Climbing',59:'Rowing',60:'Rowing Machine',61:'Rugby',
  62:'Running',63:'Jogging',64:'Running (Sand)',65:'Treadmill Run',68:'Skateboarding',69:'Skating',
  71:'Skiing',73:'Snowboarding',76:'Squash',77:'Stair Climbing',79:'Strength Training',80:'Surfing',
  81:'Swimming',82:'Pool Swimming',83:'Open Water Swim',84:'Table Tennis',86:'Tennis',87:'Treadmill',
  88:'Volleyball',90:'Walking',91:'Nordic Walking',92:'Treadmill Walk',94:'Weightlifting',97:'Yoga',98:'Zumba',
};

// ── debug ────────────────────────────────────────────────────────
// Public — no auth. Visit /api/googlefit/debug to diagnose config.
router.get('/debug', (req, res) => {
  const redirectUri = getRedirectUri();
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const allSet = !!google && !!clientId && !!process.env.GOOGLE_CLIENT_SECRET;
  res.json({
    status:      allSet ? '✅ Ready to connect' : '❌ Not configured',
    googleapis:  !!google ? '✓ installed' : '✗ not installed (run: cd server && npm install)',
    clientId:    clientId ? `✓ set (${clientId.slice(0,8)}...)` : '✗ missing — add GOOGLE_CLIENT_ID in Render → Environment',
    secret:      process.env.GOOGLE_CLIENT_SECRET ? '✓ set' : '✗ missing — add GOOGLE_CLIENT_SECRET in Render → Environment',
    redirectUri: {
      value: redirectUri,
      instruction: 'Register THIS EXACT URL in Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 → Authorized redirect URIs',
      source: process.env.GOOGLE_REDIRECT_URI
        ? 'from GOOGLE_REDIRECT_URI env var'
        : process.env.RENDER_EXTERNAL_URL
          ? 'auto-detected from RENDER_EXTERNAL_URL'
          : 'fallback (localhost) — set GOOGLE_REDIRECT_URI in Render',
    },
    renderExternalUrl: process.env.RENDER_EXTERNAL_URL || '(not set)',
    frontendUrl:       process.env.FRONTEND_URL || '(not set)',
  });
});

// ── debug/rawsync — dumps raw Google Fit API response for diagnosis ──────────────
// Usage: GET /api/googlefit/debug/rawsync?tzOffset=-330  (IST = -330)
router.get('/debug/rawsync', protect, googleAvailable, async (req, res) => {
  try {
    const tokenDoc = await User.findById(req.user._id).select('+googleFit.accessToken +googleFit.refreshToken +googleFit.tokenExpiry +googleFit.connected +googleFit.lastSync +googleFit.googleId').lean();
    const tokens = tokenDoc?.googleFit || {};
    if (!tokens.connected) return res.status(400).json({ error: 'Not connected' });
    if (!tokens.accessToken && !tokens.refreshToken) return res.status(401).json({ error: 'No tokens' });

    const client = makeClient();
    client.setCredentials({
      access_token:  tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expiry_date:   tokens.tokenExpiry ? new Date(tokens.tokenExpiry).getTime() : undefined,
    });
    const fitness = google.fitness({ version: 'v1', auth: client });

    const tzOffset = parseInt(req.query.tzOffset || '0');
    const now = Date.now();
    const localMidnight = new Date(now - tzOffset * 60000);
    localMidnight.setUTCHours(0, 0, 0, 0);
    const startMs = localMidnight.getTime() + tzOffset * 60000;
    const durationMs = Math.max(now - startMs, 60000);

    const tryAgg = (dataTypeName) => fitness.users.dataset.aggregate({ userId:'me', requestBody:{
      aggregateBy: [{ dataTypeName }],
      bucketByTime: { durationMillis: durationMs.toString() },
      startTimeMillis: startMs.toString(), endTimeMillis: now.toString(),
    }});

    const [stepsR, calR, distR, hrR, activeR, weightR] = await Promise.allSettled([
      tryAgg('com.google.step_count.delta'),
      tryAgg('com.google.calories.expended'),
      tryAgg('com.google.distance.delta'),
      tryAgg('com.google.heart_rate.bpm'),
      tryAgg('com.google.active_minutes'),
      tryAgg('com.google.weight'),
    ]);

    const extract = (r, name) => {
      if (r.status !== 'fulfilled') return { name, error: r.reason?.message || 'failed' };
      const buckets = r.value?.data?.bucket || [];
      let total = 0; const rawPoints = [];
      for (const b of buckets)
        for (const d of (b.dataset || []))
          for (const p of (d.point || [])) {
            const v = p.value?.[0];
            const n = v?.intVal ?? v?.fpVal ?? 0;
            total += n;
            rawPoints.push({ value: n, source: (d.dataSourceId||'').split(':').slice(0,3).join(':') });
          }
      return { name, total: Math.round(total * 100) / 100, pointCount: rawPoints.length,
               sampleSources: [...new Set(rawPoints.map(p => p.source))].slice(0,3) };
    };

    res.json({
      queryWindow: {
        startLocal: new Date(startMs).toISOString(), endLocal: new Date(now).toISOString(),
        durationHours: Math.round(durationMs/3600000*10)/10, tzOffsetUsed: tzOffset,
      },
      results: [
        extract(stepsR,'steps'), extract(calR,'calories'), extract(distR,'distance_m'),
        extract(hrR,'heart_rate_bpm'), extract(activeR,'active_minutes'), extract(weightR,'weight_kg'),
      ],
      diagnosis: 'If all totals=0 with no errors, data is likely in Health Connect (Android 14+). The Fitness REST API cannot read Health Connect data.',
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── connect ──────────────────────────────────────────────────────
router.get('/connect', protect, googleAvailable, (req, res) => {
  const url = makeClient().generateAuthUrl({
    access_type: 'offline', prompt: 'consent', scope: SCOPES,
    state: req.user._id.toString(),
  });
  res.json({ url });
});

// ── callback — triggers immediate sync via redirect param ────────
router.get('/callback', googleAvailable, async (req, res) => {
  const { code, state: userId, error } = req.query;
  const front = (process.env.FRONTEND_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:5173').replace(/\/$/, '');
  if (error) return res.redirect(`${front}/profile?gfit=denied`);
  // Validate userId is a 24-char hex ObjectId to prevent injection
  if (!userId || !/^[a-f\d]{24}$/i.test(userId))
    return res.redirect(`${front}/profile?gfit=error`);
  try {
    const client = makeClient();
    const { tokens } = await client.getToken(code);
    await User.findByIdAndUpdate(userId, {
      'googleFit.connected':    true,
      'googleFit.accessToken':  tokens.access_token,
      ...(tokens.refresh_token ? { 'googleFit.refreshToken': tokens.refresh_token } : {}),
      'googleFit.tokenExpiry':  new Date(tokens.expiry_date),
      'googleFit.lastSync':     new Date(),
    });
    res.redirect(`${front}/profile?gfit=connected`);
  } catch (err) {
    console.error('GFit callback:', err.message);
    res.redirect(`${front}/profile?gfit=error`);
  }
});

// ── status ───────────────────────────────────────────────────────
router.get('/status', protect, async (req, res) => {
  const user = await User.findById(req.user._id).select('googleFit fitStats');
  res.json({
    connected: user?.googleFit?.connected || false,
    available: !!google && !!(process.env.GOOGLE_CLIENT_ID),
    lastSync:  user?.googleFit?.lastSync || null,
    stats:     user?.fitStats || {},
  });
});

// ── sync ─────────────────────────────────────────────────────────
router.post('/sync', protect, googleAvailable, async (req, res) => {
  try {
    // IMPORTANT: select:false fields need explicit + dot-notation paths.
    // Do NOT mix bare parent path ('googleFit') with '+googleFit.field' —
    // Mongoose throws "Path collision" error. List every needed subfield explicitly.
    const tokenDoc = await User.findById(req.user._id)
      .select('+googleFit.accessToken +googleFit.refreshToken +googleFit.tokenExpiry +googleFit.connected +googleFit.lastSync +googleFit.googleId profile')
      .lean();

    const tokens = tokenDoc?.googleFit || {};

    if (!tokens.connected)
      return res.status(400).json({ error: 'Google Fit not connected. Please connect first.' });

    if (!tokens.accessToken && !tokens.refreshToken) {
      await User.findByIdAndUpdate(req.user._id, { 'googleFit.connected': false });
      return res.status(401).json({ error: 'Token data missing. Please reconnect Google Fit.' });
    }

    const client = makeClient();
    client.setCredentials({
      access_token:  tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expiry_date:   tokens.tokenExpiry ? new Date(tokens.tokenExpiry).getTime() : undefined,
    });

    // Persist refreshed tokens automatically
    client.on('tokens', async (t) => {
      const upd = {};
      if (t.access_token)  upd['googleFit.accessToken']  = t.access_token;
      if (t.expiry_date)   upd['googleFit.tokenExpiry']  = new Date(t.expiry_date);
      if (t.refresh_token) upd['googleFit.refreshToken'] = t.refresh_token;
      if (Object.keys(upd).length) await User.findByIdAndUpdate(req.user._id, { $set: upd });
    });

    const fitness = google.fitness({ version: 'v1', auth: client });
    const now     = Date.now();
    // tzOffset convention: negative = ahead of UTC (e.g. IST UTC+5:30 → -330).
    // JS new Date().getTimezoneOffset() returns POSITIVE for UTC+ zones (+330 for IST).
    // The client negates it before sending, so we receive -330 for IST here.
    // Guard: clamp to valid range [-840, 720] minutes.
    const rawOffset  = parseInt(req.body.tzOffset || req.query.tzOffset || '0');
    const tzOffset   = Math.max(-840, Math.min(720, isNaN(rawOffset) ? 0 : rawOffset));
    const localMidnight = new Date(now - tzOffset * 60000);
    localMidnight.setUTCHours(0, 0, 0, 0);
    const startMs  = Math.min(localMidnight.getTime() + tzOffset * 60000, now - 60000);
    // Duration must be at least 1 minute for Google Fit to accept the request
    const durationMs = Math.max(now - startMs, 60000);

    // Also prepare a 24-hour fallback window (used if today returns all zeros)
    const start24h    = now - 86400000;
    const duration24h = Math.max(now - start24h, 60000);

    const agg = (dataTypeName, startTime, duration) => fitness.users.dataset.aggregate({
      userId: 'me',
      requestBody: {
        aggregateBy:     [{ dataTypeName }],
        bucketByTime:    { durationMillis: duration.toString() },
        startTimeMillis: startTime.toString(),
        endTimeMillis:   now.toString(),
      },
    });

    const [stepsR, calR, distR, hrR, activeR, weightR, spo2R] = await Promise.allSettled([
      agg('com.google.step_count.delta',   startMs, durationMs),
      agg('com.google.calories.expended',  startMs, durationMs),
      agg('com.google.distance.delta',     startMs, durationMs),
      agg('com.google.heart_rate.bpm',     startMs, durationMs),
      agg('com.google.active_minutes',     startMs, durationMs),
      agg('com.google.weight',             startMs, durationMs),
      agg('com.google.oxygen_saturation',  startMs, durationMs),
    ]);

    const [sleepR, sessionsR] = await Promise.allSettled([
      fitness.users.sessions.list({
        userId: 'me',
        startTime: new Date(now - 86400000).toISOString(),
        endTime:   new Date(now).toISOString(),
        activityType: 72,
      }),
      fitness.users.sessions.list({
        userId: 'me',
        startTime: new Date(startMs).toISOString(),
        endTime:   new Date(now).toISOString(),
      }),
    ]);

    // Sum all bucket values — also captures per-field errors for diagnostics
    const sumBuckets = (r) => {
      if (r.status !== 'fulfilled') return { value: 0, error: r.reason?.message || 'API error', points: 0 };
      try {
        let t = 0, points = 0;
        for (const b of (r.value?.data?.bucket || []))
          for (const d of (b.dataset || []))
            for (const p of (d.point || [])) {
              const v = p.value?.[0];
              t += v?.intVal ?? v?.fpVal ?? 0;
              points++;
            }
        return { value: t, error: null, points };
      } catch (e) { return { value: 0, error: e.message, points: 0 }; }
    };

    const avgBuckets = (r) => {
      if (r.status !== 'fulfilled') return { value: 0, error: r.reason?.message || 'API error', points: 0 };
      try {
        let t = 0, c = 0;
        for (const b of (r.value?.data?.bucket || []))
          for (const d of (b.dataset || []))
            for (const p of (d.point || [])) {
              const v = p.value?.[0];
              const n = v?.intVal ?? v?.fpVal ?? 0;
              if (n > 0) { t += n; c++; }
            }
        return { value: c > 0 ? Math.round(t / c) : 0, error: null, points: c };
      } catch (e) { return { value: 0, error: e.message, points: 0 }; }
    };

    const parseSleep = (r) => {
      try {
        let ms = 0;
        for (const s of (r?.value?.data?.session || []))
          if (s.activityType === 72)
            ms += parseInt(s.endTimeMillis) - parseInt(s.startTimeMillis);
        return Math.round(ms / 3600000 * 10) / 10;
      } catch { return 0; }
    };

    const parseSessions = (r) => {
      try {
        const userWeight = tokenDoc?.profile?.weight || 70;
        return (r?.value?.data?.session || [])
          .filter(s => s.activityType !== 72 && s.activityType !== 3)
          .map(s => {
            const dMin = Math.round((parseInt(s.endTimeMillis) - parseInt(s.startTimeMillis)) / 60000);
            const met  = MET_TABLE[s.activityType] || 4.5;
            return {
              name:         ACTIVITY_MAP[s.activityType] || s.name || 'Activity',
              activityType: s.activityType,
              startTime:    s.startTimeMillis,
              endTime:      s.endTimeMillis,
              date:         new Date(parseInt(s.startTimeMillis)).toISOString(),
              durationMin:  dMin,
              calories:     Math.round(met * userWeight * (dMin / 60)),
              icon:         getActivityIcon(s.activityType),
            };
          })
          .filter(s => s.durationMin > 0)
          .sort((a, b) => parseInt(b.startTime) - parseInt(a.startTime))
          .slice(0, 20);
      } catch { return []; }
    };

    const stepsD   = sumBuckets(stepsR);
    const calD     = sumBuckets(calR);
    const distD    = sumBuckets(distR);
    const hrD      = avgBuckets(hrR);
    const activeD  = sumBuckets(activeR);
    const weightD  = avgBuckets(weightR);
    const spo2D    = avgBuckets(spo2R);

    // ── 24h fallback: if today's window returned zero steps AND no API error,
    // it means data is genuinely absent from today's bucket (Health Connect wall,
    // phone just woke up, etc). Re-query last 24h to catch any stray data points.
    let steps = Math.round(stepsD.value);
    let caloriesBurned = Math.round(calD.value);
    let distance = Math.round(distD.value);
    let activeMinutes = Math.round(activeD.value);
    let usedFallback = false;

    if (steps === 0 && !stepsD.error) {
      const [stepsF, calF, distF, activeF] = await Promise.allSettled([
        agg('com.google.step_count.delta',  start24h, duration24h),
        agg('com.google.calories.expended', start24h, duration24h),
        agg('com.google.distance.delta',    start24h, duration24h),
        agg('com.google.active_minutes',    start24h, duration24h),
      ]);
      const sf = sumBuckets(stepsF);
      if (sf.value > 0) {
        steps         = Math.round(sf.value);
        caloriesBurned = Math.round(sumBuckets(calF).value);
        distance      = Math.round(sumBuckets(distF).value);
        activeMinutes = Math.round(sumBuckets(activeF).value);
        usedFallback  = true;
      }
    }

    const weightVal = Math.round(weightD.value * 10) / 10;
    const spo2Val   = Math.round(spo2D.value);

    // Build diagnostics so the client knows WHY a field is 0
    const diagnostics = {
      source: usedFallback ? 'last24h' : 'today',
      apiErrors: Object.fromEntries(
        Object.entries({ steps: stepsD, calories: calD, distance: distD,
                         heartRate: hrD, activeMinutes: activeD, weight: weightD, spo2: spo2D })
          .filter(([, d]) => d.error)
          .map(([k, d]) => [k, d.error])
      ),
      pointCounts: {
        steps: stepsD.points, calories: calD.points, distance: distD.points,
        heartRate: hrD.points, activeMinutes: activeD.points,
      },
      healthConnectLikely: steps === 0 && !stepsD.error && stepsD.points === 0,
    };

    const stats = {
      steps,
      caloriesBurned,
      distance,
      activeMinutes,
      heartRate:       hrD.value,
      weight:          weightVal || tokenDoc?.profile?.weight || 0,
      sleep:           parseSleep(sleepR),
      spo2:            spo2Val,
      workoutSessions: parseSessions(sessionsR),
      lastUpdated:     new Date(),
      source:          'googlefit',
    };

    await User.findByIdAndUpdate(req.user._id, {
      $set: { fitStats: stats, 'googleFit.lastSync': new Date() },
    });

    // Build a useful message for the client
    let message = 'Synced successfully';
    if (diagnostics.healthConnectLikely)
      message = 'Synced — but no data found. If you use Android 14+, your steps may be in Health Connect which the Google Fit API cannot read.';
    else if (usedFallback)
      message = 'Synced using last 24h window (no data in today\'s window yet).';

    res.json({ stats, message, diagnostics });
  } catch (err) {
    console.error('Sync error:', err.message);
    if (err.status === 429 || err.code === 429)
      return res.status(429).json({ error: 'Google Fit rate limit reached. Please wait a minute and try again.' });
    // Only mark disconnected on invalid_grant — the token was explicitly revoked by the user.
    // A bare status 401 from Google can be transient (network, clock skew) and should NOT
    // force re-auth since the refresh token is still valid and the client will retry.
    if (err.message?.includes('invalid_grant')) {
      await User.findByIdAndUpdate(req.user._id, { 'googleFit.connected': false });
      return res.status(401).json({ error: 'Token expired. Please reconnect Google Fit.' });
    }
    if (err.status === 401) {
      return res.status(401).json({ error: 'Token data missing. Please reconnect Google Fit.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ── disconnect ───────────────────────────────────────────────────
router.delete('/disconnect', protect, async (req, res) => {
  try {
    const tokenDoc = await User.findById(req.user._id).select('+googleFit.accessToken +googleFit.refreshToken +googleFit.tokenExpiry +googleFit.connected +googleFit.lastSync +googleFit.googleId').lean();
    if (google && tokenDoc?.googleFit?.accessToken) {
      try {
        const c = makeClient();
        c.setCredentials({ access_token: tokenDoc.googleFit.accessToken });
        await c.revokeToken(tokenDoc.googleFit.accessToken);
      } catch (_) {}
    }
    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        'googleFit.connected':    false,
        'googleFit.accessToken':  null,
        'googleFit.refreshToken': null,
        'googleFit.tokenExpiry':  null,
      },
    });
    res.json({ message: 'Disconnected' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
