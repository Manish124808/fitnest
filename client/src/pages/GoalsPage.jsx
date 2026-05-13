// Icons replaced with emoji
import { useState } from 'react';
import { useToast } from '../hooks/useToast';

export default function GoalsPage() {
  const toast = useToast();
  const [goals, setGoals] = useState([
    { id:1, icon:'⚖️', title:'Reach Target Weight', current:72, target:68, unit:'kg', type:'weight', color:'var(--green)' },
    { id:2, icon:'🏋️', title:'Bench Press 1RM',     current:95, target:110, unit:'kg', type:'strength', color:'var(--amber)' },
    { id:3, icon:'🔱', title:'Deadlift 1RM',         current:140, target:160, unit:'kg', type:'strength', color:'var(--blue)' },
    { id:4, icon:'🦵', title:'Squat 1RM',            current:122, target:130, unit:'kg', type:'strength', color:'var(--purple)' },
    { id:5, icon:'👣', title:'Daily Steps',          current:8240, target:10000, unit:'steps', type:'steps', color:'var(--teal)' },
    { id:6, icon:'💪', title:'Workouts This Week',   current:1, target:6, unit:'sessions', type:'workout', color:'var(--green)' },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title:'', icon:'🎯', current:'', target:'', unit:'', type:'custom', color:'var(--green)' });
  const [inputVals, setInputVals] = useState({});

  const pct = (c,t) => Math.min(100, Math.round((c/t)*100));
  const barColor = p => p>=100?'var(--green)':p>=60?'var(--blue)':'var(--amber)';

  const updateGoal = (id) => {
    const val = Number(inputVals[id]);
    if (isNaN(val)) return;
    setGoals(p => p.map(g => g.id===id ? { ...g, current:val, status: val>=g.target?'completed':'active' } : g));
    setInputVals(p => ({ ...p, [id]:'' }));
    toast.success('Progress updated! 🎯');
  };

  const addGoal = () => {
    if (!form.title||!form.target) { toast.error('Title and target required'); return; }
    setGoals(p => [...p, { id:Date.now(), ...form, current:Number(form.current)||0, target:Number(form.target) }]);
    toast.success('Goal added! 🎯');
    setShowAdd(false);
    setForm({ title:'', icon:'🎯', current:'', target:'', unit:'', type:'custom', color:'var(--green)' });
  };

  const completedGoals = goals.filter(g => pct(g.current, g.target) >= 100);
  const activeGoals    = goals.filter(g => pct(g.current, g.target) < 100);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div><div className="page-title">Goals & Targets 🎯</div><div className="text-sm text-muted mt-2">{completedGoals.length}/{goals.length} completed</div></div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Add Goal</button>
      </div>

      {/* Summary */}
      <div className="grid-3 mb-4">
        <div className="stat-card"><div className="stat-label">Active Goals</div><div className="stat-value" style={{ color:'var(--blue)' }}>{activeGoals.length}</div></div>
        <div className="stat-card"><div className="stat-label">Completed</div><div className="stat-value" style={{ color:'var(--green)' }}>{completedGoals.length}</div></div>
        <div className="stat-card"><div className="stat-label">Avg Progress</div><div className="stat-value" style={{ color:'var(--amber)' }}>{Math.round(goals.reduce((s,g)=>s+pct(g.current,g.target),0)/goals.length)}%</div></div>
      </div>

      {/* Active */}
      {activeGoals.length > 0 && <div className="section-title">Active Goals</div>}
      {activeGoals.map(g => {
        const p = pct(g.current, g.target);
        return (
          <div key={g.id} className="card mb-3">
            <div className="flex items-center gap-3 mb-3">
              <span style={{ fontSize:30 }}>{g.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:14 }}>{g.title}</div>
                <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>
                  <strong style={{ color:g.color }}>{g.current.toLocaleString()}</strong> / {g.target.toLocaleString()} {g.unit}
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:20, fontWeight:700, color: barColor(p) }}>{p}%</div>
                <div style={{ fontSize:9, color:'var(--muted)' }}>{g.target - g.current > 0 ? `${(g.target-g.current).toLocaleString()} ${g.unit} to go` : 'Completed!'}</div>
              </div>
            </div>
            <div className="progress-bar mb-3" style={{ height:8 }}>
              <div className="progress-fill" style={{ width:p+'%', background: barColor(p) }} />
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <input type="number" className="input" style={{ flex:1, padding:'7px 10px', fontSize:12 }}
                placeholder={`Log new ${g.unit}`}
                value={inputVals[g.id]||''}
                onChange={e => setInputVals(p => ({ ...p, [g.id]: e.target.value }))}
                onKeyDown={e => e.key==='Enter' && updateGoal(g.id)}
              />
              <button className="btn btn-secondary btn-sm" onClick={() => updateGoal(g.id)}>Update</button>
              <button className="btn-icon btn-ghost" style={{ color:'var(--red)', fontSize:13 }} onClick={() => setGoals(p => p.filter(x=>x.id!==g.id))}>🗑</button>
            </div>
          </div>
        );
      })}

      {/* Completed */}
      {completedGoals.length > 0 && (
        <>
          <div className="section-title mt-3">Completed 🎉</div>
          {completedGoals.map(g => (
            <div key={g.id} className="card mb-3" style={{ border:'1px solid var(--green-100)', background:'var(--green-50)' }}>
              <div className="flex items-center gap-3">
                <span style={{ fontSize:28 }}>{g.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:13 }}>{g.title}</div>
                  <div style={{ fontSize:11, color:'var(--green)', marginTop:2 }}>{g.current.toLocaleString()} / {g.target.toLocaleString()} {g.unit}</div>
                </div>
                <span style={{ fontSize:24 }}>✅</span>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowAdd(false)}>
          <div className="modal">
            <div className="modal-handle" />
            <div className="modal-title">Add New Goal 🎯</div>
            <div className="grid-2">
              <div className="input-group"><label className="input-label">Icon</label><input className="input" value={form.icon} onChange={e=>setForm(f=>({...f,icon:e.target.value}))}/></div>
              <div className="input-group"><label className="input-label">Type</label>
                <select className="select" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                  {['weight','steps','calories','workout','strength','custom'].map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="input-group"><label className="input-label">Goal Title *</label><input className="input" placeholder="e.g. Reach 70kg bodyweight" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/></div>
            <div className="grid-3">
              <div className="input-group"><label className="input-label">Current</label><input className="input" type="number" value={form.current} onChange={e=>setForm(f=>({...f,current:e.target.value}))}/></div>
              <div className="input-group"><label className="input-label">Target *</label><input className="input" type="number" value={form.target} onChange={e=>setForm(f=>({...f,target:e.target.value}))}/></div>
              <div className="input-group"><label className="input-label">Unit</label><input className="input" placeholder="kg / steps" value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))}/></div>
            </div>
            <button className="btn btn-primary btn-full" onClick={addGoal}>✅ Add Goal</button>
          </div>
        </div>
      )}
    </div>
  );
}
