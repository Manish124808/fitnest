# FitNest — Local Dev Setup

## Why you get ERR_CONNECTION_REFUSED on login

The error means the frontend is trying to call `localhost:5000/api` directly
but the backend server isn't running — **or** your `client/.env` has
`VITE_API_URL=http://localhost:5000/api` which bypasses Vite's proxy.

## Fix in 3 steps

### 1. Check your `client/.env`

Open `fitnest-v3/client/.env` (or `.env.local`).

**BAD** — causes the error:
```
VITE_API_URL=http://localhost:5000/api
```

**GOOD** — delete that line or leave the file empty for local dev:
```
# (empty — no VITE_API_URL)
```

The Vite dev server already has a proxy in `vite.config.js` that forwards
`/api` → `http://localhost:5000` automatically. You don't need `VITE_API_URL`
locally at all.

### 2. Create `server/.env`

```bash
cp server/.env.example server/.env
```

Then fill in at minimum:
```
MONGO_URI=mongodb+srv://youruser:yourpass@cluster.mongodb.net/fitnest
JWT_SECRET=any-random-secret-string
ADMIN_EMAIL=your@email.com
PORT=5000
```

### 3. Run both servers

```bash
# Option A — one command (installs concurrently automatically)
npm install
npm run dev

# Option B — two terminals
# Terminal 1:
cd server && npm install && npm run dev

# Terminal 2:
cd client && npm install && npm run dev
```

Client → http://localhost:5173  
API  → http://localhost:5000/api

---

## Render deployment

On Render, set these env vars in the dashboard:

| Key | Value |
|-----|-------|
| `MONGO_URI` | Your Atlas URI |
| `JWT_SECRET` | Any random string |
| `ADMIN_EMAIL` | Your login email |
| `FRONTEND_URL` | `https://your-app.onrender.com` |
| `VITE_API_URL` | *(not needed — server serves the built frontend)* |

The build command copies the Vite build into `server/public`,
so one Render service serves both frontend and API.
