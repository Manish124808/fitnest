/**
 * FitnessSyncPanel — Mi Fitness / Zepp integration panel
 * When hiddenGoogleSection=true, only shows Mi Fit (Google Fit is handled by GoogleFitPanel)
 */
import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle2, Footprints, Flame, Moon, Heart, Watch } from 'lucide-react';

const STORAGE_KEY = 'fn_sync_status';
function loadState() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; } }
function saveState(s) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {} }
const mockMi = () => ({
  steps:    { value: Math.floor(5000 + Math.random() * 5000) },
  calories: { value: Math.floor(1600 + Math.random() * 700) },
  sleep:    { total: +(6 + Math.random() * 2).toFixed(1) },
  spo2:     { avg: Math.floor(96 + Math.random() * 3) },
});

function Metric({ icon: Icon, label, value, unit, color }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, flex:1 }}>
      <Icon size={14} style={{ color }} />
      <span style={{ fontSize:13, fontWeight:700 }}>{value ?? '—'}</span>
      <span style={{ fontSize:9, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.4px' }}>{label}</span>
      {unit && <span style={{ fontSize:9, color:'var(--subtle)' }}>{unit}</span>}
    </div>
  );
}

export default function FitnessSyncPanel({ hiddenGoogleSection = false }) {
  const [sync,       setSync]       = useState(loadState);
  const [miData,     setMiData]     = useState(null);
  const [syncing,    setSyncing]    = useState(false);
  const [miCreds,    setMiCreds]    = useState({ username:'', password:'' });
  const [showMiForm, setShowMiForm] = useState(false);
  const [flash,      setFlash]      = useState('');

  const showMsg = (m) => { setFlash(m); setTimeout(() => setFlash(''), 3000); };

  const refresh = useCallback(() => {
    const s = loadState();
    setSync(s);
    if (s.mi?.connected) setMiData(mockMi());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const connectMi = () => {
    if (!miCreds.username || !miCreds.password) { showMsg('Enter credentials first'); return; }
    const next = { ...sync, mi: { connected:true, connectedAt:new Date().toISOString() } };
    saveState(next); setSync(next); setMiData(mockMi());
    setShowMiForm(false); setMiCreds({ username:'', password:'' });
    showMsg('Mi Fitness connected (demo mode)');
  };

  const disconnectMi = () => {
    const next = { ...sync, mi: { connected:false } };
    saveState(next); setSync(next); setMiData(null);
    showMsg('Mi Fitness disconnected');
  };

  const syncAll = () => {
    setSyncing(true);
    setTimeout(() => { refresh(); setSyncing(false); showMsg('Data refreshed'); }, 800);
  };

  const miOn = sync.mi?.connected;
  const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : 'just now';

  return (
    <div>
      {flash && (
        <div style={{ background:'rgba(0,200,83,.08)', border:'1px solid rgba(0,200,83,.2)',
          borderRadius:8, padding:'8px 12px', fontSize:12, color:'var(--brand)', marginBottom:10,
          display:'flex', alignItems:'center', gap:6 }}>
          <CheckCircle2 size={13} /> {flash}
        </div>
      )}

      {/* Mi Fitness row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'12px 14px', background:'var(--card2)',
        border:`1px solid ${miOn ? 'rgba(245,158,11,.25)' : 'var(--border)'}`,
        borderRadius:10, marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:9,
            background:'linear-gradient(135deg,#f59e0b,#ef4444)',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Watch size={18} color="white" />
          </div>
          <div>
            <div style={{ fontWeight:600, fontSize:13 }}>Mi Fitness / Zepp</div>
            <div style={{ fontSize:10, color:'var(--muted)', marginTop:1 }}>
              {miOn ? `Synced at ${fmtTime(sync.mi?.connectedAt)}` : 'Not connected'}
            </div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ width:8, height:8, borderRadius:'50%',
            background: miOn ? '#f59e0b' : '#6b7280',
            boxShadow: miOn ? '0 0 6px rgba(245,158,11,.6)' : 'none' }} />
          {miOn ? (
            <>
              <button className="btn btn-sm btn-secondary" onClick={syncAll} disabled={syncing}
                style={{ display:'flex', alignItems:'center', gap:4, fontSize:11 }}>
                <RefreshCw size={11} style={{ animation: syncing ? 'spin .8s linear infinite' : 'none' }} />
                {syncing ? 'Syncing…' : 'Sync'}
              </button>
              <button className="btn btn-sm btn-danger" onClick={disconnectMi} style={{ fontSize:11 }}>
                Disconnect
              </button>
            </>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => setShowMiForm(v => !v)}
              style={{ fontSize:11 }}>
              Connect
            </button>
          )}
        </div>
      </div>

      {/* Mi metrics */}
      {miOn && miData && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:10 }}>
          {[
            { icon:Footprints, label:'Steps',    value:miData.steps?.value?.toLocaleString(), color:'#f59e0b' },
            { icon:Flame,      label:'Calories', value:miData.calories?.value, unit:'kcal', color:'#ef4444' },
            { icon:Moon,       label:'Sleep',    value:miData.sleep?.total, unit:'hrs', color:'#8b5cf6' },
            { icon:Heart,      label:'SpO₂',     value:miData.spo2?.avg, unit:'%', color:'#ec4899' },
          ].map(m => (
            <div key={m.label} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 6px' }}>
              <Metric {...m} />
            </div>
          ))}
        </div>
      )}

      {/* Mi credentials form */}
      {showMiForm && !miOn && (
        <div style={{ background:'var(--bg3)', border:'1px solid var(--border)',
          borderRadius:10, padding:14, marginBottom:8 }}>
          <div style={{ fontSize:11, color:'var(--muted)', marginBottom:10 }}>
            Enter your Xiaomi / Mi Fitness account credentials
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <input className="input" placeholder="Email / Phone" style={{ fontSize:12 }}
              value={miCreds.username}
              onChange={e => setMiCreds(p => ({ ...p, username:e.target.value }))} />
            <input className="input" type="password" placeholder="Password" style={{ fontSize:12 }}
              value={miCreds.password}
              onChange={e => setMiCreds(p => ({ ...p, password:e.target.value }))} />
            <button className="btn btn-primary btn-sm" onClick={connectMi}>Link</button>
          </div>
          <div style={{ fontSize:10, color:'var(--subtle)', marginTop:6 }}>
            Demo mode — credentials are not stored or transmitted anywhere.
          </div>
        </div>
      )}

      {!miOn && (
        <p style={{ fontSize:11, color:'var(--subtle)', textAlign:'center', marginTop:4 }}>
          Connect Mi Band / Amazfit to sync steps, calories, sleep &amp; SpO₂.
        </p>
      )}
    </div>
  );
}
