// Icons replaced with emoji
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createWorkout, fetchWorkouts, deleteWorkout } from '../store/slices/workoutSlice';
import { CloudImg, getExerciseImage, EXERCISE_IMAGES } from '../data/cloudinaryAssets.jsx';
import { googleFitAPI } from '../api';
import { patchUser } from '../store/slices/authSlice';
import { useToast } from '../hooks/useToast';

const today = () => new Date().toISOString().split('T')[0];

const EXERCISE_LIBRARY = [
  { name:'Bench Press',    cat:'Chest',     icon:'🏋️', type:'strength', kcalPerMin:8 },
  { name:'Incline DB Press',cat:'Chest',   icon:'💪', type:'strength', kcalPerMin:7 },
  { name:'Deadlift',       cat:'Back/Legs', icon:'🔱', type:'strength', kcalPerMin:10},
  { name:'Squat',          cat:'Legs',      icon:'🦵', type:'strength', kcalPerMin:9 },
  { name:'OHP',            cat:'Shoulders', icon:'🏆', type:'strength', kcalPerMin:7 },
  { name:'Pull-ups',       cat:'Back',      icon:'⬆️', type:'strength', kcalPerMin:6 },
  { name:'Barbell Row',    cat:'Back',      icon:'🚣', type:'strength', kcalPerMin:6 },
  { name:'RDL',            cat:'Legs',      icon:'🦿', type:'strength', kcalPerMin:8 },
  { name:'Leg Press',      cat:'Legs',      icon:'🦵', type:'strength', kcalPerMin:7 },
  { name:'Tricep Pushdown',cat:'Arms',      icon:'💪', type:'strength', kcalPerMin:5 },
  { name:'Bicep Curl',     cat:'Arms',      icon:'🔄', type:'strength', kcalPerMin:5 },
  { name:'Plank',          cat:'Core',      icon:'⬛', type:'strength', kcalPerMin:3 },
  { name:'Running',        cat:'Cardio',    icon:'🏃', type:'cardio',   kcalPerMin:11},
  { name:'Walking',        cat:'Cardio',    icon:'🚶', type:'cardio',   kcalPerMin:4 },
  { name:'Cycling',        cat:'Cardio',    icon:'🚴', type:'cardio',   kcalPerMin:9 },
  { name:'Jump Rope',      cat:'Cardio',    icon:'🪢', type:'cardio',   kcalPerMin:12},
  { name:'Push-ups',       cat:'Chest',     icon:'⬆️', type:'strength', kcalPerMin:6 },
  { name:'Face Pulls',     cat:'Shoulders', icon:'🎯', type:'strength', kcalPerMin:4 },
];

const PPL = {
  push: { name:'Push Day', exercises:['Bench Press','OHP','Incline DB Press','Tricep Pushdown','Face Pulls'] },
  pull: { name:'Pull Day', exercises:['Deadlift','Pull-ups','Barbell Row','Bicep Curl'] },
  legs: { name:'Leg Day',  exercises:['Squat','RDL','Leg Press'] },
};

export default function WorkoutsPage() {
  const dispatch = useDispatch();
  const toast = useToast();
  const { workouts, loading } = useSelector(s => s.workout);
  const user = useSelector(s => s.auth.user);
  const [gfitSessions, setGfitSessions] = useState([]);
  const [tab, setTab] = useState('log');
  const [libCat, setLibCat] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [workoutName, setWorkoutName] = useState('');
  const [workoutType, setWorkoutType] = useState('push');
  const [addEx, setAddEx] = useState({ name:'', sets:3, reps:10, weight:0, duration:0 });
  const [notes, setNotes] = useState('');

  useEffect(() => { dispatch(fetchWorkouts({ limit:20 })); }, [dispatch]);

  // Auto-fetch Google Fit workout sessions — use cached data first, sync if stale
  useEffect(() => {
    if (!user?.googleFit?.connected) return;
    const cached = user?.fitStats?.workoutSessions;
    if (cached?.length) { setGfitSessions(cached); }
    // Sync if no cached sessions or data is stale (>5 min)
    const lastSync = user?.googleFit?.lastSync;
    const isStale  = !lastSync || (Date.now() - new Date(lastSync).getTime()) > 5 * 60 * 1000;
    if (!cached?.length || isStale) {
      googleFitAPI.sync().then(r => {
        dispatch(patchUser({ fitStats: r.data.stats, googleFit: { connected: true, lastSync: new Date().toISOString() } }));
        setGfitSessions(r.data.stats?.workoutSessions || []);
      }).catch(e => {
        const msg = e?.error || '';
        if (msg.includes('expired') || msg.includes('reconnect'))
          dispatch(patchUser({
            googleFit: { connected: false },
            fitStats: { steps: 0, caloriesBurned: 0, activeMinutes: 0, distance: 0,
                        heartRate: 0, sleep: 0, weight: 0, spo2: 0, workoutSessions: [] },
          }));
      });
    }
  }, [user?.googleFit?.connected]);

  const todayW = workouts.filter(w => w.date === today());
  const pastW  = workouts.filter(w => w.date !== today());
  const cats   = ['all', ...new Set(EXERCISE_LIBRARY.map(e => e.cat))];
  const libList = libCat === 'all' ? EXERCISE_LIBRARY : EXERCISE_LIBRARY.filter(e => e.cat === libCat);

  const quickLoad = (type) => {
    const plan = PPL[type];
    const exs = plan.exercises.map(name => {
      const lib = EXERCISE_LIBRARY.find(e => e.name === name) || {};
      const isCardio = lib.type === 'cardio';
      return { name, type: lib.type||'strength', category: lib.cat, sets: isCardio ? [] : [{ reps:10, weight:0, completed:true }], duration: isCardio?20:5, caloriesBurned: Math.round((lib.kcalPerMin||6)*(isCardio?20:5)) };
    });
    setExercises(exs); setWorkoutName(plan.name); setWorkoutType(type); setShowModal(true);
    toast.info(`${plan.name} loaded — adjust sets/weights!`);
  };

  const addExercise = () => {
    if (!addEx.name) { toast.error('Enter exercise name'); return; }
    const lib = EXERCISE_LIBRARY.find(e => e.name === addEx.name) || {};
    const isCardio = lib.type === 'cardio';
    setExercises(p => [...p, {
      name: addEx.name, type: lib.type||'strength', category: lib.cat,
      sets: isCardio ? [] : Array.from({length:+addEx.sets||3}, () => ({ reps:+addEx.reps||10, weight:+addEx.weight||0, completed:true })),
      duration: +addEx.duration||5, caloriesBurned: Math.round((lib.kcalPerMin||6)*(+addEx.duration||5)),
    }]);
    setAddEx({ name:'', sets:3, reps:10, weight:0, duration:0 });
  };

  const addFromLib = (lib) => {
    const isCardio = lib.type === 'cardio';
    setExercises(p => [...p, { name:lib.name, type:lib.type, category:lib.cat, sets: isCardio?[]:[{reps:10,weight:0,completed:true}], duration:isCardio?20:5, caloriesBurned:Math.round(lib.kcalPerMin*(isCardio?20:5)) }]);
    toast.info(`${lib.name} added ✓`);
  };

  const saveWorkout = async () => {
    if (!exercises.length) { toast.error('Add at least one exercise'); return; }
    const totalCal = exercises.reduce((s,e)=>s+(e.caloriesBurned||0),0);
    const duration = exercises.reduce((s,e)=>s+(e.duration||0),0);
    try {
      await dispatch(createWorkout({ name:workoutName||'Workout', type:workoutType, exercises, duration, totalCaloriesBurned:totalCal, notes, date:today() })).unwrap();
      toast.success('Workout saved! 💪');
      setShowModal(false); setExercises([]); setWorkoutName(''); setNotes('');
    } catch { toast.error('Saved locally — connect backend to persist'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div><div className="page-title">Workout Tracker 💪</div><div className="text-sm text-muted mt-2">PPL · Progressive overload</div></div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>+ Log Workout</button>
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        {Object.entries(PPL).map(([k,v]) => (
          <button key={k} className="btn btn-secondary btn-sm" onClick={() => quickLoad(k)}>⚡ {v.name}</button>
        ))}
      </div>

      <div className="tab-bar">
        {['log','library','history'].map(t => <div key={t} className={`tab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</div>)}
      </div>

      {tab === 'log' && (
        <>
        {gfitSessions.length > 0 && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:10, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#16a34a', boxShadow:'0 0 5px rgba(22,163,74,.7)', display:'inline-block' }}/>
              Auto-detected from Google Fit ({gfitSessions.length})
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {gfitSessions.map((s,i) => (
                <div key={i} style={{ background:'var(--card)', border:'1px solid rgba(139,92,246,.2)', borderRadius:12, padding:'12px 14px', display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ fontSize:22, background:'rgba(139,92,246,.1)', borderRadius:10, padding:'8px 10px', flexShrink:0 }}>
                    {s.icon || '⚡'}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700 }}>{s.name}</div>
                    <div style={{ fontSize:10, color:'var(--muted)', marginTop:3, display:'flex', gap:10, flexWrap:'wrap' }}>
                      <span>⏱ {s.durationMin} min</span>
                      {s.calories > 0 && <span style={{ color:'#f59e0b' }}>🔥 ~{s.calories} kcal</span>}
                      {s.date && <span style={{ color:'var(--subtle)' }}>{new Date(s.date).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}</span>}
                    </div>
                  </div>
                  <span style={{ fontSize:9, padding:'3px 8px', borderRadius:99, background:'rgba(139,92,246,.12)', color:'#8b5cf6', fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', flexShrink:0 }}>GFit</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {
        todayW.length === 0 ? (
          <div className="empty-state">
            <CloudImg src={EXERCISE_IMAGES.gym_general} alt="gym" height={160} style={{ width:'100%', borderRadius:12, marginBottom:16 }} />
            <div className="empty-state-title">No workout logged today</div>
            <div className="empty-state-sub">Use PPL quick-load above or log custom exercises</div>
            <button className="btn btn-primary mt-3" onClick={() => setShowModal(true)}>Start Workout</button>
          </div>
        ) : todayW.map(w => (
          <div key={w._id} className="card mb-3">
            <div className="flex items-center justify-between mb-3">
              <div><div style={{ fontWeight:700, fontSize:15 }}>{w.name}</div><div className="text-sm text-muted mt-2">⏱ {w.duration}min · 🔥 {w.totalCaloriesBurned}kcal · {w.exercises?.length} exercises</div></div>
              <span className="tag tag-green">✅ Done</span>
            </div>
            {w.exercises?.map((ex,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border-light)' }}>
                <CloudImg src={getExerciseImage(ex.name)} alt={ex.name} width={40} height={40} style={{ borderRadius:8, flexShrink:0 }} fallback="💪" />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:500 }}>{ex.name}</div>
                  <div style={{ fontSize:10, color:'var(--muted)' }}>
                    {ex.type==='cardio' ? `${ex.duration}min` : `${ex.sets?.length}×${ex.sets?.[0]?.reps}${ex.sets?.[0]?.weight ? ` @${ex.sets[0].weight}kg`:''}`}
                  </div>
                </div>
                <div style={{ fontSize:11, fontWeight:600, color:'var(--amber)' }}>{ex.caloriesBurned}kcal</div>
              </div>
            ))}
          </div>
        ))
        }
      </>
      )}

      {tab === 'library' && (
        <div>
          <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:6, marginBottom:12 }}>
            {cats.map(c => <button key={c} className={`tag ${libCat===c?'tag-green':'tag-gray'}`} style={{ cursor:'pointer', padding:'5px 10px', whiteSpace:'nowrap', fontSize:11 }} onClick={()=>setLibCat(c)}>{c}</button>)}
          </div>
          <div className="grid-2">
            {libList.map(ex => (
              <div key={ex.name} className="card card-hover" style={{ padding:0, overflow:'hidden' }} onClick={() => { addFromLib(ex); setShowModal(true); }}>
                <CloudImg src={getExerciseImage(ex.name)} alt={ex.name} height={90} style={{ width:'100%' }} fallback={ex.icon} />
                <div style={{ padding:'10px 12px' }}>
                  <div style={{ fontWeight:600, fontSize:13 }}>{ex.name}</div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:5 }}>
                    <span className={`tag ${ex.type==='cardio'?'tag-blue':'tag-green'}`} style={{ fontSize:9 }}>{ex.cat}</span>
                    <span style={{ fontSize:10, color:'var(--amber)', fontWeight:600 }}>~{ex.kcalPerMin} kcal/min</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'history' && (
        pastW.length === 0 ? <div className="empty-state"><div className="empty-state-icon">📜</div><div className="empty-state-title">No history yet</div></div>
        : pastW.map(w => (
          <div key={w._id} className="card mb-3 flex items-center gap-3">
            <CloudImg src={getExerciseImage(w.exercises?.[0]?.name||'')} alt={w.name} width={50} height={50} style={{ borderRadius:10, flexShrink:0 }} fallback="🏋️" />
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600, fontSize:13 }}>{w.name}</div>
              <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{w.date} · {w.duration}min · 🔥{w.totalCaloriesBurned}kcal</div>
            </div>
            <button className="btn-icon btn-danger btn-sm" onClick={() => dispatch(deleteWorkout(w._id))}>🗑</button>
          </div>
        ))
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth:540 }}>
            <div className="modal-handle" />
            <div className="flex items-center justify-between mb-4">
              <div className="modal-title" style={{ marginBottom:0 }}>Log Workout 💪</div>
              <button className="btn-icon btn-ghost" onClick={() => setShowModal(false)} style={{ fontSize:20 }}>✕</button>
            </div>
            <div className="grid-2 mb-3">
              <div className="input-group"><label className="input-label">Name</label><input className="input" placeholder="Push Day A" value={workoutName} onChange={e=>setWorkoutName(e.target.value)} /></div>
              <div className="input-group"><label className="input-label">Type</label>
                <select className="select" value={workoutType} onChange={e=>setWorkoutType(e.target.value)}>
                  {['push','pull','legs','upper','lower','full','cardio','custom'].map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            {exercises.length > 0 && (
              <div style={{ marginBottom:12 }}>
                <div className="section-title">Exercises ({exercises.length})</div>
                {exercises.map((ex,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 10px', background:'var(--green-50)', borderRadius:8, marginBottom:5 }}>
                    <CloudImg src={getExerciseImage(ex.name)} alt={ex.name} width={34} height={34} style={{ borderRadius:6, flexShrink:0 }} fallback="💪" />
                    <div style={{ flex:1, fontSize:12 }}><strong>{ex.name}</strong><span className="text-muted"> · {ex.type==='cardio'?`${ex.duration}min`:`${ex.sets?.length}×${ex.sets?.[0]?.reps}${ex.sets?.[0]?.weight?` @${ex.sets[0].weight}kg`:''}`}</span></div>
                    <button style={{ color:'var(--red)', fontSize:12 }} onClick={()=>setExercises(p=>p.filter((_,j)=>j!==i))}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <div className="card mb-3" style={{ background:'var(--bg)', padding:12 }}>
              <div className="section-title">Add Exercise</div>
              <div className="input-group">
                <input className="input" list="exList" placeholder="Exercise name" value={addEx.name} onChange={e=>setAddEx(f=>({...f,name:e.target.value}))} />
                <datalist id="exList">{EXERCISE_LIBRARY.map(e=><option key={e.name} value={e.name}/>)}</datalist>
              </div>
              <div className="grid-4" style={{ gap:8 }}>
                {[['sets','Sets'],['reps','Reps'],['weight','Weight(kg)'],['duration','Dur(min)']].map(([k,l])=>(
                  <div key={k}><label className="input-label">{l}</label><input className="input" type="number" value={addEx[k]} onChange={e=>setAddEx(f=>({...f,[k]:e.target.value}))}/></div>
                ))}
              </div>
              <button className="btn btn-secondary btn-sm" onClick={addExercise}>+ Add</button>
            </div>
            <div className="input-group"><label className="input-label">Notes</label><textarea className="input textarea" rows={2} placeholder="PRs? How did it feel?" value={notes} onChange={e=>setNotes(e.target.value)}/></div>
            <button className="btn btn-primary btn-full" onClick={saveWorkout} disabled={!exercises.length||loading}>
              {loading ? '⏳ Saving...' : `💾 Save (${exercises.length} exercise${exercises.length!==1?'s':''})`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
