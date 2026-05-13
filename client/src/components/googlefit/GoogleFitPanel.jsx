/**
 * GoogleFitPanel.jsx
 * Google Fit OAuth panel.
 *
 * On Android 13+ / Pixel devices, Health Connect is the underlying store,
 * but the Google Fitness REST API can still read it IF the user has enabled
 * Google Fit as a connected app inside Health Connect settings.
 *
 * If sync returns 0 steps, we show a step-by-step guide to link them.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Activity, RefreshCw, CheckCircle2, AlertCircle,
  Footprints, Flame, Route, Heart, Moon, Weight,
  Zap, Link, Unlink, Clock, TrendingUp, Wind,
  ChevronDown, ChevronUp, Info,
} from 'lucide-react';
import { googleFitAPI } from '../../api';
import { useDispatch } from 'react-redux';
import { patchUser } from '../../store/slices/authSlice';

function StatTile({ icon: Icon, label, value, unit, color, sub }) {
  return (
    <div style={{
      background: 'var(--card)', border: `1px solid ${color}22`,
      borderRadius: 12, padding: '13px 8px', textAlign: 'center',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 5 }}>
        <div style={{ background: color + '18', borderRadius: 8, padding: '5px 6px' }}>
          <Icon size={14} color={color} />
        </div>
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color, fontFamily: 'Syne,sans-serif', lineHeight: 1 }}>
        {value ?? '—'}
      </div>
      {unit && <div style={{ fontSize: 9, color: 'var(--subtle)', marginTop: 2 }}>{unit}</div>}
      <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '.04em' }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: 9, color: 'var(--subtle)', marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function HCGuide() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      marginTop: 10, borderRadius: 10,
      border: '1px solid rgba(245,158,11,.3)',
      background: 'rgba(245,158,11,.05)',
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 13px', background: 'none', border: 'none', cursor: 'pointer',
          color: '#f59e0b', fontSize: 12, fontWeight: 600,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Info size={13} />
          Showing 0 steps? Fix Health Connect → Google Fit sync
        </span>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {open && (
        <div style={{ padding: '0 13px 13px', fontSize: 11, color: 'var(--muted)', lineHeight: 1.8 }}>
          <p style={{ marginBottom: 8, color: 'var(--text)', fontWeight: 600 }}>
            On Android 13+ your steps are stored in Health Connect, not Google Fit directly.
            Follow these steps to connect them:
          </p>
          {[
            'Open the Health Connect app on your phone',
            'Tap Apps & devices → Google Fit',
            'Enable all data types (Steps, Calories, Heart rate, Sleep, Weight)',
            'Open Google Fit app and make sure it is actively tracking',
            'Come back here and tap Sync Now',
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
              <span style={{
                minWidth: 18, height: 18, borderRadius: '50%',
                background: 'rgba(245,158,11,.2)', color: '#f59e0b',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 800,
              }}>{i + 1}</span>
              <span>{step}</span>
            </div>
          ))}
          <p style={{ marginTop: 10, fontSize: 10, color: 'var(--subtle)' }}>
            If Google Fit app is not installed, download it from the Play Store first.
          </p>
        </div>
      )}
    </div>
  );
}

export default function GoogleFitPanel() {
  const dispatch = useDispatch();

  const [status,  setStatus]  = useState({ connected: false, available: false, stats: {} });
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [flash,   setFlash]   = useState(null);

  const notify = (type, text) => {
    setFlash({ type, text });
    setTimeout(() => setFlash(null), type === 'warn' ? 10000 : 5000);
  };

  const load = useCallback(async () => {
    try {
      const r = await googleFitAPI.getStatus();
      setStatus(r.data);
    } catch {
      setStatus(s => ({ ...s, available: false }));
    } finally {
      setLoading(false);
    }
  }, []);

  const syncNow = useCallback(async () => {
    setSyncing(true);
    try {
      const r    = await googleFitAPI.sync();
      const now  = new Date().toISOString();
      const stats = r.data.stats || {};
      setStatus(s => ({ ...s, stats, lastSync: now, connected: true }));
      dispatch(patchUser({
        fitStats:  stats,
        googleFit: { connected: true, lastSync: now },
      }));
      const steps = stats.steps || 0;
      if (steps === 0) {
        notify('warn', 'Synced but got 0 steps. See the guide below to link Health Connect → Google Fit.');
      } else {
        notify('success', `Synced! ${steps.toLocaleString()} steps today.`);
      }
    } catch (e) {
      const msg = e?.error || e?.message || 'Sync failed';
      if (msg === 'Sync already in progress') return;
      notify('error', msg);
      const isTokenError = msg.includes('expired') || msg.includes('reconnect') ||
                           msg.includes('Token data missing') || msg.includes('invalid_grant');
      if (isTokenError) {
        setStatus(s => ({ ...s, connected: false }));
        dispatch(patchUser({ googleFit: { connected: false } }));
      }
    } finally {
      setSyncing(false);
    }
  }, [dispatch]);

  useEffect(() => {
    load();
    const params = new URLSearchParams(window.location.search);
    if (params.get('gfit') === 'connected') {
      notify('success', 'Google Fit connected! Syncing…');
      window.history.replaceState({}, '', location.pathname);
      setTimeout(() => syncNow(), 800);
    } else if (params.get('gfit') === 'error') {
      notify('error', 'Google Fit connection failed. Check server credentials.');
      window.history.replaceState({}, '', location.pathname);
    } else if (params.get('gfit') === 'denied') {
      notify('error', 'Google Fit permission denied.');
      window.history.replaceState({}, '', location.pathname);
    }
  }, [load, syncNow]);

  const connect = async () => {
    try {
      const r = await googleFitAPI.getConnectUrl();
      if (r.data?.url) {
        window.location.href = r.data.url;
      } else {
        notify('error', r.data?.error || 'Google Fit not configured on server.');
      }
    } catch (e) {
      const msg = e?.error || e?.message || 'Could not connect to Google Fit.';
      if (msg.includes('GOOGLE_CLIENT_ID') || msg.includes('GOOGLE_CLIENT_SECRET') || msg.includes('env vars')) {
        notify('error', 'Google credentials missing. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Render → Environment.');
      } else if (msg.includes('redirect')) {
        notify('error', 'Redirect URI mismatch. GOOGLE_REDIRECT_URI in Render must match Google Console exactly.');
      } else if (msg.includes('Not authorized') || msg.includes('no token')) {
        notify('error', 'Session expired. Please log out and log in again, then retry.');
      } else {
        notify('error', msg);
      }
    }
  };

  const disconnect = async () => {
    if (!confirm('Disconnect Google Fit? Cached stats will be cleared.')) return;
    try {
      await googleFitAPI.disconnect();
      setStatus(s => ({ ...s, connected: false, stats: {} }));
      dispatch(patchUser({
        fitStats:  { steps: 0, caloriesBurned: 0, activeMinutes: 0, distance: 0,
                     heartRate: 0, sleep: 0, weight: 0, spo2: 0, workoutSessions: [] },
        googleFit: { connected: false, lastSync: null },
      }));
      notify('success', 'Disconnected from Google Fit.');
    } catch (e) {
      notify('error', e?.error || 'Failed to disconnect');
    }
  };

  const fmt = iso => iso
    ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  const stats    = status.stats || {};
  const hasStats = !!(status.lastSync || stats.lastUpdated);
  const showZeroGuide = status.connected && hasStats && (stats.steps === 0);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <RefreshCw size={18} style={{ color: 'var(--muted)', animation: 'spin .8s linear infinite' }} />
    </div>
  );

  return (
    <div>
      {/* Flash */}
      {flash && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px',
          background: flash.type === 'success' ? 'rgba(22,163,74,.08)'
                    : flash.type === 'warn'    ? 'rgba(245,158,11,.08)'
                    : 'rgba(239,68,68,.08)',
          border: `1px solid ${flash.type === 'success' ? 'rgba(22,163,74,.25)'
                              : flash.type === 'warn'    ? 'rgba(245,158,11,.25)'
                              : 'rgba(239,68,68,.25)'}`,
          borderRadius: 8, fontSize: 12, marginBottom: 12,
          color: flash.type === 'success' ? 'var(--brand)'
               : flash.type === 'warn'    ? '#f59e0b'
               : '#ef4444',
        }}>
          {flash.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
          {flash.text}
        </div>
      )}

      {/* Not configured */}
      {!status.available && !status.connected && (
        <div style={{
          padding: '10px 12px', marginBottom: 12,
          background: 'rgba(245,158,11,.07)', border: '1px solid rgba(245,158,11,.25)',
          borderRadius: 8, fontSize: 11, color: 'var(--muted)', lineHeight: 1.6,
        }}>
          <strong style={{ color: '#f59e0b' }}>Google credentials not set.</strong> Add{' '}
          <code style={{ background: 'rgba(255,255,255,.07)', padding: '1px 4px', borderRadius: 3 }}>GOOGLE_CLIENT_ID</code> and{' '}
          <code style={{ background: 'rgba(255,255,255,.07)', padding: '1px 4px', borderRadius: 3 }}>GOOGLE_CLIENT_SECRET</code>{' '}
          to <code style={{ background: 'rgba(255,255,255,.07)', padding: '1px 4px', borderRadius: 3 }}>server/.env</code> then restart.
        </div>
      )}

      {/* Connection row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 14px', background: 'var(--bg)',
        border: `1px solid ${status.connected ? 'rgba(22,163,74,.3)' : 'var(--border)'}`,
        borderRadius: 11, marginBottom: 14,
        boxShadow: status.connected ? '0 0 0 1px rgba(22,163,74,.1)' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg,#e8f4f8 0%,#90caf9 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Activity size={18} color="#1565c0" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>Google Fit</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', display: 'inline-block', flexShrink: 0,
                background: status.connected ? '#16a34a' : '#6b7280',
                boxShadow: status.connected ? '0 0 5px rgba(22,163,74,.7)' : 'none',
              }} />
              {status.connected
                ? `Connected${fmt(status.lastSync) ? ` · synced ${fmt(status.lastSync)}` : ''}`
                : 'Not connected'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {status.connected ? (
            <>
              <button onClick={syncNow} disabled={syncing} style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '6px 11px',
                fontSize: 11, fontWeight: 600, borderRadius: 7, cursor: 'pointer',
                background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)',
              }}>
                <RefreshCw size={11} style={{ animation: syncing ? 'spin .8s linear infinite' : 'none' }} />
                {syncing ? 'Syncing…' : 'Sync Now'}
              </button>
              <button onClick={disconnect} style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '6px 8px',
                fontSize: 11, borderRadius: 7, cursor: 'pointer',
                background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', color: '#ef4444',
              }}>
                <Unlink size={11} />
              </button>
            </>
          ) : (
            <button onClick={connect} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px',
              fontSize: 11, fontWeight: 700, borderRadius: 7, cursor: 'pointer',
              background: 'linear-gradient(135deg,#1565c0,#1976d2)',
              border: 'none', color: 'white',
            }}>
              <Link size={11} />
              Connect Google Fit
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {status.connected && hasStats ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 8 }}>
            <StatTile icon={Footprints} label="Steps"    color="#16a34a"
              value={stats.steps > 0 ? stats.steps.toLocaleString() : '0'} />
            <StatTile icon={Flame}      label="Burned"   color="#f59e0b"
              value={stats.caloriesBurned > 0 ? stats.caloriesBurned.toLocaleString() : '0'} unit="kcal" />
            <StatTile icon={Route}      label="Distance" color="#3b82f6"
              value={stats.distance > 0 ? (stats.distance / 1000).toFixed(2) : '0'} unit="km" />
            <StatTile icon={Zap}        label="Active"   color="#8b5cf6"
              value={stats.activeMinutes || 0} unit="min" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            <StatTile icon={Heart}  label="Heart Rate" color="#ef4444"
              value={stats.heartRate || '—'} unit={stats.heartRate ? 'bpm' : ''}
              sub={stats.heartRate > 0 ? (stats.heartRate < 60 ? '↓ Low' : stats.heartRate < 100 ? '✓ Normal' : '↑ High') : ''} />
            <StatTile icon={Moon}   label="Sleep"      color="#6366f1"
              value={stats.sleep || '—'} unit={stats.sleep ? 'hrs' : ''}
              sub={stats.sleep > 0 ? (stats.sleep >= 7 ? '✓ Good' : stats.sleep >= 6 ? 'Moderate' : 'Short') : ''} />
            <StatTile icon={Wind}   label="SpO₂"       color="#06b6d4"
              value={stats.spo2 > 0 ? stats.spo2 + '%' : '—'}
              sub={stats.spo2 > 0 ? (stats.spo2 >= 95 ? '✓ Normal' : '↓ Low') : ''} />
            <StatTile icon={Weight} label="Weight"     color="#ec4899"
              value={stats.weight || '—'} unit={stats.weight ? 'kg' : ''} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 10, color: 'var(--subtle)' }}>
            <Clock size={9} />
            Last synced: {status.lastSync ? new Date(status.lastSync).toLocaleString('en-IN') : 'never'}
          </div>
          {showZeroGuide && <HCGuide />}
        </>
      ) : status.connected && !hasStats ? (
        <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 12, color: 'var(--muted)' }}>
          <TrendingUp size={20} style={{ marginBottom: 8, color: 'var(--subtle)', display: 'block', margin: '0 auto 8px' }} />
          Tap <strong>Sync Now</strong> to fetch today's data from Google Fit.
        </div>
      ) : !status.connected ? (
        <div style={{ fontSize: 11, color: 'var(--subtle)', textAlign: 'center', padding: '8px 0', lineHeight: 1.6 }}>
          Connect Google Fit to sync<br />
          <strong style={{ color: 'var(--muted)' }}>steps · calories · distance · heart rate · sleep · weight · SpO₂</strong>
        </div>
      ) : null}
    </div>
  );
}
