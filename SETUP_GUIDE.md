# FitNest — Health Connect Setup Guide

## What changed and why

Google silently migrated all fitness data on **Android 14+ / Pixel devices** from the
Google Fitness REST API to **Health Connect**. The Fitness REST API returns silent zeros
for these users — no error, just no data.

This version replaces the Fitness REST API with a **Health Connect push architecture**.

| | Old (Google Fit REST) | New (Health Connect) |
|---|---|---|
| Auth | OAuth 2.0 → server fetches | On-device permission → PWA reads & pushes |
| Data flow | Server pulls from Google API | PWA pushes to server |
| Google Console needed | Yes | **No** |
| Android req | Any | Android 9+ (HC app) / Android 14+ (built-in) |
| Non-Android | Works | Manual entry fallback |

---

## Environment variables

### Required (all platforms)
```env
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_long_random_secret
NODE_ENV=production
FRONTEND_URL=https://your-app.onrender.com
```

### No longer needed for fitness sync
```
GOOGLE_CLIENT_ID      ← remove (unless using Google Sign-In for login)
GOOGLE_CLIENT_SECRET  ← remove
GOOGLE_REDIRECT_URI   ← remove
```

---

## Render.com settings

| Field | Value |
|-------|-------|
| **Build Command** | `npm install && cd client && npm install && npm run build` |
| **Start Command** | `cd server && node server.js` |

### Environment variables (Render Dashboard)

| Key | Value |
|-----|-------|
| `MONGO_URI` | Atlas connection string |
| `JWT_SECRET` | Random 32+ char string |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://your-app.onrender.com` |
| `ADMIN_EMAIL` | Your email |

---

## How sync works

### Android 14+ / Pixel
1. Open PWA in Chrome → Profile → Health Connect → **Connect**
2. Allow permissions in the dialog (steps, calories, distance, HR, sleep, weight)
3. App reads data locally and pushes to server automatically
4. Tap **Sync Now** to refresh anytime

### Android 9–13
1. Install **Health Connect** from Google Play first
2. Same flow as above

### iOS / Desktop
1. Tap **Connect (manual)** → tap **✏️** icon
2. Enter today's stats manually → **Save**

---

## Health Connect Web Bridge requirements

| Requirement | Minimum |
|-------------|---------|
| Android | 9+ (with HC app) or 14+ |
| Chrome | 125+ |
| PWA context | Chrome browser (not WebView) |

The app detects `navigator.health` at startup. If absent → manual entry fallback.

---

## API endpoints

`/api/googlefit/*` still works (aliased to new handler — no breaking change).

| Endpoint | Method | What it does |
|----------|--------|--------------|
| `/api/healthconnect/status` | GET | Status + cached stats |
| `/api/healthconnect/connect` | POST | Mark connected (no OAuth) |
| `/api/healthconnect/sync` | POST | **Receive** data pushed from PWA |
| `/api/healthconnect/disconnect` | DELETE | Clear connection + stats |
| `/api/healthconnect/debug` | GET | Show stored stats |

---

## Troubleshooting

**Sync shows 0** → Open Health Connect app and check if data is recorded there.
If HC is empty, your fitness tracker isn't writing to it.

**Permission dialog doesn't appear** → Chrome must be 125+. Check chrome://settings/help.

**Connect does nothing on iPhone** → Health Connect is Android-only. Use manual entry (✏️).

**Debug your stored data:**
```
GET https://your-app.onrender.com/api/healthconnect/debug
Authorization: Bearer <JWT>
```
