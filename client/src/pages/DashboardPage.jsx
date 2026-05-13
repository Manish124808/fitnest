import { useEffect, useCallback, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchLog, updateWater } from '../store/slices/nutritionSlice';
import { fetchWorkouts } from '../store/slices/workoutSlice';
import { googleFitAPI } from '../api';
import { patchUser, fetchMe } from '../store/slices/authSlice';
import {
  Plus, Dumbbell, Droplets, Zap, Target,
  TrendingUp, Brain, Flame, Footprints,
  Heart, Route, Moon, Weight, RefreshCw,
  Activity, Wind, Timer, ChevronRight, AlertCircle,
  Wifi, WifiOff,
} from 'lucide-react';

const today = () => new Date().toISOString().split('T')[0];
const greet = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

/* ── Calorie ring ──────────────────────────────────────────────── */
function CalRing({ eaten, goal }) {
  const r    = 48;
  const circ = 2 * Math.PI * r;
  const pct  = Math.min(1, eaten / Math.max(goal, 1));
  const color = pct > 1 ? '#ff5252' : pct > .85 ? '#ffd740' : '#00e676';
  return (
    <div className="cal-ring-wrap">
      <svg className="cal-ring-svg" width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="10"/>
        <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
          style={{ filter:`drop-shadow(0 0 8px ${color}88)`, transition:'stroke-dashoffset .7s cubic-bezier(.4,0,.2,1)' }}/>
      </svg>
      <div className="cal-ring-text">
        <div style={{ fontSize:20, fontWeight:800, color, fontFamily:'Syne,sans-serif' }}>{eaten}</div>
        <div style={{ fontSize:9, color:'var(--muted)', marginTop:1 }}>of {goal}</div>
        <div style={{ fontSize:8, color:'var(--subtle)' }}>kcal</div>
      </div>
    </div>
  );
}

/* ── Modern fitness metric card ────────────────────────────────── */
function FitCard({ icon: Icon, label, value, unit, color, sub, progress, target, pulse }) {
  const pct = (progress != null && target) ? Math.min(100, Math.round((progress / target) * 100)) : null;
  return (
    <div style={{
      background: `linear-gradient(145deg, var(--card) 0%, ${color}06 100%)`,
      border: `1px solid ${color}28`,
      borderRadius: 14, padding: '14px 10px', textAlign: 'center',
      position: 'relative', overflow: 'hidden',
      transition: 'transform .15s, box-shadow .15s',
      cursor: 'default',
      boxShadow: `0 2px 12px ${color}10`,
    }}
    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 6px 20px ${color}22`; }}
    onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=`0 2px 12px ${color}10`; }}
    >
      {/* top glow */}
      <div style={{
        position:'absolute', top:0, left:'50%', transform:'translateX(-50%)',
        width:40, height:2, background:`linear-gradient(90deg,transparent,${color},transparent)`,
        borderRadius:99,
      }}/>

      <div style={{ display:'flex', justifyContent:'center', marginBottom:8 }}>
        <div style={{
          background:`${color}18`, borderRadius:10, padding:'7px 8px',
          position:'relative',
        }}>
          <Icon size={15} color={color}/>
          {pulse && (
            <div style={{
              position:'absolute', inset:0, borderRadius:10,
              border:`1px solid ${color}40`,
              animation:'pulseRing 2s ease-in-out infinite',
            }}/>
          )}
        </div>
      </div>

      <div style={{ fontSize:18, fontWeight:800, color, fontFamily:'Syne,sans-serif', lineHeight:1, letterSpacing:'-.02em' }}>
        {value ?? '—'}
      </div>
      {unit && <div style={{ fontSize:9, color:'var(--subtle)', marginTop:2, fontWeight:500 }}>{unit}</div>}
      <div style={{ fontSize:9, color:'var(--muted)', marginTop:3, textTransform:'uppercase', letterSpacing:'.05em', fontWeight:600 }}>
        {label}
      </div>
      {sub && (
        <div style={{
          fontSize:9, marginTop:4, padding:'2px 6px', borderRadius:99,
          background:`${color}14`, color, display:'inline-block', fontWeight:600,
        }}>
          {sub}
        </div>
      )}
      {pct !== null && (
        <div style={{ marginTop:8, height:3, background:'rgba(255,255,255,.05)', borderRadius:99 }}>
          <div style={{
            height:'100%', width:`${pct}%`, borderRadius:99,
            background:`linear-gradient(90deg, ${color}99, ${color})`,
            transition:'width .8s cubic-bezier(.4,0,.2,1)',
            boxShadow:`0 0 6px ${color}60`,
          }}/>
        </div>
      )}
    </div>
  );
}

/* ── Google Fit section ─────────────────────────────────────────── */
function GoogleFitSection({ stats, user, dispatch, navigate }) {
  const connected = user?.googleFit?.connected;
  const [syncing,    setSyncing]    = useState(false);
  const [syncErr,    setSyncErr]    = useState('');
  const [justSynced, setJustSynced] = useState(false);

  const doSync = useCallback(async () => {
    if (syncing) return;
    setSyncing(true); setSyncErr('');
    try {
      const r = await googleFitAPI.sync();
      dispatch(patchUser({
        fitStats:  r.data.stats,
        googleFit: { connected: true, lastSync: new Date().toISOString() },
      }));
      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 3000);
    } catch (e) {
      const msg = e?.error || e?.message || 'Sync failed';
      if (msg === 'Sync already in progress') { setSyncing(false); return; }
      setSyncErr(msg);
      if (e?.status === 401 || msg.includes('expired') || msg.includes('reconnect') || msg.includes('Token data missing') || msg.includes('invalid_grant')) {
        dispatch(patchUser({
          googleFit: { connected: false },
          fitStats: { steps: 0, caloriesBurned: 0, activeMinutes: 0, distance: 0,
                      heartRate: 0, sleep: 0, weight: 0, spo2: 0, workoutSessions: [],
                      lastUpdated: null, source: '' },
        }));
      }
      setTimeout(() => setSyncErr(''), 5000);
    } finally {
      setSyncing(false);
    }
  }, [syncing, dispatch]);

  if (!connected) {
    return (
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'13px 16px', marginBottom:14,
        background:'rgba(22,163,74,.04)',
        border:'1px dashed rgba(22,163,74,.25)', borderRadius:14,
        fontSize:11, color:'var(--muted)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ background:'rgba(22,163,74,.12)', borderRadius:8, padding:'6px 7px' }}>
            <WifiOff size={13} color="var(--brand)"/>
          </div>
          <div>
            <div style={{ fontWeight:600, color:'var(--text)', fontSize:11 }}>Google Fit not connected</div>
            <div style={{ fontSize:10, color:'var(--muted)', marginTop:2 }}>Connect Google Fit to see steps, calories, sleep & more</div>
          </div>
        </div>
        <button onClick={() => navigate('/profile')}
          style={{ padding:'6px 14px', fontSize:10, fontWeight:700, borderRadius:8,
            background:'var(--brand)', border:'none',
            color:'#000', cursor:'pointer', flexShrink:0, marginLeft:8,
            letterSpacing:'.02em' }}>
          Connect
        </button>
      </div>
    );
  }

  const s = stats || {};
  // Show cards if sync has ever run today (lastUpdated set), even if all values are 0
  const hasData = !!s.lastUpdated;
  const targets = user?.targets || {};

  const syncLabel = syncing ? 'Syncing…' : justSynced ? '✓ Synced' : 'Sync';
  const syncColor = justSynced ? '#16a34a' : 'var(--brand)';

  return (
    <div style={{ marginBottom:18 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:'#16a34a',
            boxShadow:'0 0 8px rgba(22,163,74,.9)', animation:'pulse 2s ease-in-out infinite' }}/>
          <span style={{ fontSize:11, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.08em' }}>
            Google Fit · Today
          </span>
          {s.lastUpdated && (
            <span style={{ fontSize:9, color:'var(--subtle)', background:'rgba(255,255,255,.04)', padding:'2px 6px', borderRadius:99 }}>
              {new Date(s.lastUpdated).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
            </span>
          )}
        </div>
        <button onClick={doSync} disabled={syncing}
          style={{
            display:'flex', alignItems:'center', gap:5, padding:'5px 12px', fontSize:10,
            background: justSynced ? 'rgba(22,163,74,.15)' : 'rgba(22,163,74,.08)',
            border:`1px solid ${justSynced ? 'rgba(22,163,74,.4)' : 'rgba(22,163,74,.2)'}`,
            borderRadius:8, color:syncColor, cursor:syncing?'wait':'pointer', fontWeight:700,
            transition:'all .2s',
          }}>
          <RefreshCw size={10} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }}/>
          {syncLabel}
        </button>
      </div>

      {/* Error banner */}
      {syncErr && (
        <div style={{
          display:'flex', alignItems:'center', gap:8, padding:'8px 12px', marginBottom:10,
          background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:10,
          fontSize:11, color:'#ef4444',
        }}>
          <AlertCircle size={12}/>
          {syncErr}
        </div>
      )}

      {hasData ? (
        <>
          {/* Row 1 — primary activity metrics */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:8 }}>
            <FitCard icon={Footprints} label="Steps"    color="#16a34a"
              value={s.steps > 0 ? s.steps.toLocaleString() : '0'}
              progress={s.steps} target={targets.steps || 10000}
              sub={s.steps > 0 ? `${Math.min(100,Math.round((s.steps/(targets.steps||10000))*100))}% of goal` : null}/>
            <FitCard icon={Flame}  label="Burned"   color="#f59e0b"
              value={s.caloriesBurned > 0 ? s.caloriesBurned.toLocaleString() : '0'} unit="kcal"/>
            <FitCard icon={Route}  label="Distance" color="#3b82f6"
              value={s.distance > 0 ? (s.distance/1000).toFixed(2) : '0'} unit="km"/>
            <FitCard icon={Zap}    label="Active"   color="#8b5cf6"
              value={s.activeMinutes || 0} unit="min"
              progress={s.activeMinutes} target={30}
              sub={s.activeMinutes >= 30 ? '✓ Goal met' : null}/>
          </div>

          {/* Row 2 — body / health metrics */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
            <FitCard icon={Heart}  label="Heart Rate" color="#ef4444"
              value={s.heartRate || '—'} unit={s.heartRate ? 'bpm' : ''}
              pulse={s.heartRate > 0}
              sub={s.heartRate > 0 ? (s.heartRate < 60 ? '↓ Low' : s.heartRate < 100 ? '✓ Normal' : '↑ High') : ''}/>
            <FitCard icon={Moon}   label="Sleep"     color="#6366f1"
              value={s.sleep || '—'} unit={s.sleep ? 'hrs' : ''}
              sub={s.sleep > 0 ? (s.sleep >= 7 ? '✓ Good' : s.sleep >= 6 ? 'Moderate' : 'Short') : ''}/>
            <FitCard icon={Wind}   label="SpO₂"     color="#06b6d4"
              value={s.spo2 > 0 ? s.spo2+'%' : '—'}
              sub={s.spo2 > 0 ? (s.spo2 >= 95 ? '✓ Normal' : '↓ Low') : ''}/>
            <FitCard icon={Weight} label="Weight"   color="#ec4899"
              value={s.weight || '—'} unit={s.weight ? 'kg' : ''}/>
          </div>

          {/* Workout sessions from Google Fit */}
          {s.workoutSessions?.length > 0 && (
            <div style={{ marginTop:12 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--muted)', textTransform:'uppercase',
                letterSpacing:'.08em', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
                <Activity size={11} color="var(--brand)"/> Auto-detected Activities
              </div>
              <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4 }}>
                {s.workoutSessions.slice(0,8).map((ws, i) => (
                  <div key={i} style={{
                    flexShrink:0, background:'var(--card)',
                    border:'1px solid rgba(139,92,246,.2)', borderRadius:12,
                    padding:'10px 14px', minWidth:100, maxWidth:130,
                  }}>
                    <div style={{ fontSize:18, marginBottom:4, textAlign:'center' }}>{ws.icon || '⚡'}</div>
                    <div style={{ fontSize:11, fontWeight:700, textAlign:'center', lineHeight:1.3 }}>{ws.name}</div>
                    <div style={{ fontSize:9, color:'var(--muted)', marginTop:4, display:'flex', flexDirection:'column', gap:2, alignItems:'center' }}>
                      <span style={{ display:'flex', alignItems:'center', gap:3 }}>
                        <Timer size={8}/>  {ws.durationMin} min
                      </span>
                      {ws.calories > 0 && (
                        <span style={{ display:'flex', alignItems:'center', gap:3 }}>
                          <Flame size={8} color="#f59e0b"/> ~{ws.calories} kcal
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{
          textAlign:'center', padding:'20px 0',
          background:'rgba(22,163,74,.03)', borderRadius:12,
          border:'1px solid rgba(22,163,74,.1)',
        }}>
          <RefreshCw size={24} style={{ color:'var(--subtle)', display:'block', margin:'0 auto 10px' }}/>
          <div style={{ fontSize:12, color:'var(--muted)', marginBottom:4 }}>No sync yet today</div>
          <div style={{ fontSize:10, color:'var(--subtle)' }}>Tap <strong style={{color:'var(--brand)'}}>Sync</strong> to fetch today's data from Google Fit</div>
        </div>
      )}
    </div>
  );
}

/* ── Main dashboard ─────────────────────────────────────────────── */
export default function DashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user     = useSelector(s => s.auth.user);
  const { currentLog }  = useSelector(s => s.nutrition);
  const { workouts }    = useSelector(s => s.workout);

  useEffect(() => {
    dispatch(fetchMe()).catch(() => {});
    dispatch(fetchLog(today())).catch(() => {});
    dispatch(fetchWorkouts({ date: today(), limit: 1 })).catch(() => {});
  }, [dispatch]);

  // Clear fitStats from Redux/localStorage if they are from a previous day
  useEffect(() => {
    const lastUpdated = user?.fitStats?.lastUpdated;
    if (lastUpdated) {
      const lastDate = new Date(lastUpdated).toISOString().split('T')[0];
      if (lastDate !== today()) {
        dispatch(patchUser({ fitStats: {
          steps: 0, caloriesBurned: 0, activeMinutes: 0, distance: 0,
          heartRate: 0, sleep: 0, weight: 0, spo2: 0, workoutSessions: [],
          lastUpdated: null, source: '',
        }}));
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Global sync lock — prevents simultaneous sync calls from Dashboard + GoogleFitPanel
  const syncInFlight = useRef(false);

  // Auto-sync Google Fit on load + every 5 min (only if connected)
  useEffect(() => {
    if (!user?.googleFit?.connected) return;

    const doSync = async () => {
      if (syncInFlight.current) return;
      syncInFlight.current = true;
      try {
        const r = await googleFitAPI.sync();
        dispatch(patchUser({
          fitStats:  r.data.stats,
          googleFit: { connected: true, lastSync: new Date().toISOString() },
        }));
      } catch (e) {
        const msg = e?.error || e?.message || '';
        if (msg === 'Sync already in progress') return;
        const isTokenError = msg.includes('expired') || msg.includes('reconnect') || msg.includes('Token data missing') || msg.includes('invalid_grant');
        if (isTokenError)
          dispatch(patchUser({
            googleFit: { connected: false },
            fitStats: { steps: 0, caloriesBurned: 0, activeMinutes: 0, distance: 0,
                        heartRate: 0, sleep: 0, weight: 0, spo2: 0, workoutSessions: [],
                        lastUpdated: null, source: '' },
          }));
      } finally {
        syncInFlight.current = false;
      }
    };

    const lastSync      = user?.googleFit?.lastSync;
    const lastUpdated   = user?.fitStats?.lastUpdated;
    const syncedToday   = lastSync    && new Date(lastSync).toISOString().split('T')[0] === today();
    const dataFromToday = lastUpdated && new Date(lastUpdated).toISOString().split('T')[0] === today();
    const isStale = !lastSync || !syncedToday || !dataFromToday ||
                    (Date.now() - new Date(lastSync).getTime()) > 5 * 60 * 1000;
    if (isStale) doSync();

    const id = setInterval(doSync, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [user?.googleFit?.connected, user?._id, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps
  const targets = user?.targets || { calories:2000, protein:150, carbs:200, fats:65, water:3000, steps:10000 };
  const totals  = {
    calories: currentLog?.totals?.calories || 0,
    protein:  currentLog?.totals?.protein  || 0,
    carbs:    currentLog?.totals?.carbs    || 0,
    fats:     currentLog?.totals?.fats     || 0,
  };
  const water        = currentLog?.water || 0;
  const waterGlasses = Math.round(water / 250);
  const totalGlasses = Math.round(targets.water / 250);
  const todayWorkout = workouts?.[0];
  const fitStats     = user?.fitStats || {};
  const pct = (v, t) => Math.min(100, Math.round((v / Math.max(t, 1)) * 100));

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="page-title">{greet()}, {user?.name?.split(' ')[0]}</div>
          <div className="text-sm text-muted mt-2">
            {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })}
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
          {user?.streak > 0 && (
            <span className="tag tag-amber" style={{ display:'flex', alignItems:'center', gap:4 }}>
              <Flame size={10}/> {user.streak}-day streak
            </span>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/nutrition')}
            style={{ display:'flex', alignItems:'center', gap:5 }}>
            <Plus size={13}/> Log Meal
          </button>
        </div>
      </div>

      {/* Calorie + macros */}
      <div className="grad-card mb-4">
        <div style={{ display:'flex', alignItems:'center', gap:20 }}>
          <CalRing eaten={totals.calories} goal={targets.calories}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, color:'var(--muted)', fontWeight:600,
              textTransform:'uppercase', letterSpacing:'.06em', marginBottom:12 }}>
              Today's Macros
            </div>
            {[
              { label:'Protein', val:totals.protein, target:targets.protein, color:'#00e676' },
              { label:'Carbs',   val:totals.carbs,   target:targets.carbs,   color:'#29b6f6' },
              { label:'Fats',    val:totals.fats,    target:targets.fats,    color:'#ffd740' },
            ].map(m => (
              <div key={m.label} style={{ marginBottom:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:11, color:'var(--muted)' }}>{m.label}</span>
                  <span style={{ fontSize:11, fontWeight:700, color:m.color }}>
                    {Math.round(m.val)}<span style={{ color:'var(--subtle)', fontWeight:400 }}>/{m.target}g</span>
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width:pct(m.val,m.target)+'%',
                    background:m.color, boxShadow:`0 0 8px ${m.color}66` }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', gap:12, marginTop:14, paddingTop:14, borderTop:'1px solid var(--border)' }}>
          {[
            { label:'Eaten', val:totals.calories+' kcal',                             color:'var(--brand)' },
            { label:'Goal',  val:targets.calories+' kcal',                            color:'var(--text)' },
            { label:'Left',  val:Math.max(0,targets.calories-totals.calories)+' kcal',
              color: totals.calories>targets.calories ? '#ff5252' : '#29b6f6' },
          ].map(s => (
            <div key={s.label} style={{ flex:1, textAlign:'center' }}>
              <div style={{ fontSize:14, fontWeight:800, color:s.color, fontFamily:'Syne,sans-serif' }}>{s.val}</div>
              <div style={{ fontSize:9, color:'var(--muted)', marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Macro stat mini-cards */}
      <div className="grid-4 mb-4">
        {[
          { label:'Protein', val:Math.round(totals.protein)+'g', sub:`/ ${targets.protein}g`, pct:pct(totals.protein,targets.protein), color:'#00e676' },
          { label:'Carbs',   val:Math.round(totals.carbs)+'g',   sub:`/ ${targets.carbs}g`,   pct:pct(totals.carbs,targets.carbs),     color:'#29b6f6' },
          { label:'Fats',    val:Math.round(totals.fats)+'g',    sub:`/ ${targets.fats}g`,    pct:pct(totals.fats,targets.fats),       color:'#ffd740' },
          { label:'Water',   val:(water/1000).toFixed(1)+'L',    sub:`/ ${(targets.water/1000).toFixed(1)}L`, pct:pct(water,targets.water), color:'#40c4ff' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color:s.color, fontSize:18 }}>{s.val}</div>
            <div className="stat-sub">{s.sub}</div>
            <div className="progress-bar mt-2">
              <div className="progress-fill" style={{ width:s.pct+'%', background:s.color }}/>
            </div>
          </div>
        ))}
      </div>

      {/* Workout + Water */}
      <div className="grid-2 mb-4">
        <div className="card">
          <div className="section-title" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ display:'flex', alignItems:'center', gap:5 }}>
              <Dumbbell size={12}/> Today's Workout
            </span>
            <button onClick={() => navigate('/workouts')} style={{
              display:'flex', alignItems:'center', gap:2, fontSize:10, color:'var(--brand)',
              background:'none', border:'none', cursor:'pointer', padding:0,
            }}>
              View <ChevronRight size={10}/>
            </button>
          </div>
          {todayWorkout ? (
            <div>
              <div style={{ padding:12, background:'rgba(0,230,118,.06)',
                border:'1px solid rgba(0,230,118,.15)', borderRadius:'var(--radius-sm)', marginBottom:10 }}>
                <div style={{ fontWeight:700, fontSize:14, color:'var(--brand)' }}>{todayWorkout.name}</div>
                <div style={{ fontSize:11, color:'var(--muted)', marginTop:4, display:'flex', gap:10 }}>
                  <span style={{ display:'flex', alignItems:'center', gap:3 }}><Zap size={10}/> {todayWorkout.duration}min</span>
                  <span style={{ display:'flex', alignItems:'center', gap:3 }}><Flame size={10}/> {todayWorkout.totalCaloriesBurned}kcal</span>
                </div>
              </div>
              <div style={{ fontSize:11, color:'var(--muted)' }}>{todayWorkout.exercises?.length || 0} exercises logged</div>
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'16px 0' }}>
              <Dumbbell size={32} style={{ color:'var(--subtle)', margin:'0 auto 8px', display:'block' }}/>
              <div style={{ fontSize:12, color:'var(--muted)', marginBottom:10 }}>No workout yet today</div>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/workouts')}>Start Workout</button>
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-title" style={{ display:'flex', alignItems:'center', gap:5 }}>
            <Droplets size={12}/> Hydration
          </div>
          <div style={{ fontSize:11, color:'var(--muted)', marginBottom:10 }}>
            {waterGlasses}/{totalGlasses} glasses · {(water/1000).toFixed(2)}L
          </div>
          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
            {Array.from({ length: totalGlasses }).map((_, i) => (
              <div key={i}
                className={`water-drop ${i < waterGlasses ? 'filled' : ''}`}
                onClick={() => dispatch(updateWater({ date: today(), water: (i+1)*250 }))}/>
            ))}
          </div>
          <div className="progress-bar mt-3">
            <div className="progress-fill" style={{ width:pct(water,targets.water)+'%',
              background:'linear-gradient(90deg,#29b6f6,#40c4ff)',
              boxShadow:'0 0 8px rgba(41,182,246,.4)' }}/>
          </div>
        </div>
      </div>

      {/* ── Fitness / Activity section (below water, above insights) ── */}
      <GoogleFitSection stats={fitStats} user={user} dispatch={dispatch} navigate={navigate}/>

      {/* Smart insights */}
      <div className="card">
        <div className="section-title" style={{ display:'flex', alignItems:'center', gap:5, marginBottom:12 }}>
          <Brain size={12}/> Smart Insights
        </div>
        {totals.calories < targets.calories * 0.5 && (
          <div className="insight insight-amber" style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
            <Zap size={13} style={{ flexShrink:0, marginTop:1 }}/>
            Only {pct(totals.calories,targets.calories)}% of calorie target logged. Log a meal to stay on track!
          </div>
        )}
        {totals.protein >= targets.protein * 0.9 && (
          <div className="insight insight-green" style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
            <Target size={13} style={{ flexShrink:0, marginTop:1 }}/>
            Excellent protein intake at {Math.round(totals.protein)}g — right on track!
          </div>
        )}
        {water < targets.water * 0.5 && (
          <div className="insight insight-blue" style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
            <Droplets size={13} style={{ flexShrink:0, marginTop:1 }}/>
            Under 50% hydration — drink 1–2 glasses now.
          </div>
        )}
        {fitStats.steps > 0 && fitStats.steps < (targets.steps || 10000) * 0.5 && (
          <div className="insight insight-amber" style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
            <Footprints size={13} style={{ flexShrink:0, marginTop:1 }}/>
            Only {fitStats.steps.toLocaleString()} steps so far. Goal: {(targets.steps||10000).toLocaleString()}. Time to move!
          </div>
        )}
        {fitStats.sleep > 0 && fitStats.sleep < 6 && (
          <div className="insight insight-purple" style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
            <Moon size={13} style={{ flexShrink:0, marginTop:1 }}/>
            Only {fitStats.sleep}h sleep last night. Aim for 7–8h for optimal recovery.
          </div>
        )}
        {fitStats.spo2 > 0 && fitStats.spo2 < 95 && (
          <div className="insight insight-blue" style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
            <Wind size={13} style={{ flexShrink:0, marginTop:1 }}/>
            SpO₂ at {fitStats.spo2}% — below normal (95–100%). Consider rest or consult a doctor.
          </div>
        )}
        <div className="insight insight-purple" style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
          <TrendingUp size={13} style={{ flexShrink:0, marginTop:1 }}/>
          {user?.profile?.goal === 'cutting'
            ? 'Stay in a 300–500 kcal deficit for safe fat loss.'
            : user?.profile?.goal === 'bulking'
            ? 'Eat 300–500 kcal above maintenance to build muscle.'
            : 'Consistent meals and workouts are key to your goals.'}
        </div>
      </div>
    </div>
  );
}
