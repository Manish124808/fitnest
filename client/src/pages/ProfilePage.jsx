import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile, logout } from '../store/slices/authSlice';
import { useToast } from '../hooks/useToast';
import { CloudImg, HERO_IMAGES } from '../data/cloudinaryAssets.jsx';
import GoogleFitPanel from '../components/googlefit/GoogleFitPanel';
import FitnessSyncPanel from '../components/FitnessSyncPanel';
import {
  Save, LogOut, Flame, Zap, Scale, Activity,
  BedDouble, Footprints, Droplets, ShieldCheck,
} from 'lucide-react';

const GOAL_OPTIONS = [
  { value:'cutting',     label:'Cutting (Fat Loss)' },
  { value:'bulking',     label:'Bulking (Muscle Gain)' },
  { value:'maintenance', label:'Maintenance' },
  { value:'performance', label:'Performance' },
];
const ACTIVITY_OPTIONS = [
  { value:'sedentary',  label:'Sedentary (desk job)' },
  { value:'light',      label:'Light (1-3 days/week)' },
  { value:'moderate',   label:'Moderate (4-5 days/week)' },
  { value:'active',     label:'Active (6-7 days/week)' },
  { value:'veryActive', label:'Very Active (athlete)' },
];
const GOAL_ICONS = {
  cutting:'🔥', bulking:'💪', maintenance:'⚖️', performance:'🏃',
};

export default function ProfilePage() {
  const dispatch = useDispatch();
  const toast    = useToast();
  const user     = useSelector(s => s.auth.user);

  const [form, setForm] = useState({
    name:          user?.name || '',
    age:           user?.profile?.age || '',
    height:        user?.profile?.height || '',
    weight:        user?.profile?.weight || '',
    targetWeight:  user?.profile?.targetWeight || '',
    goal:          user?.profile?.goal || 'cutting',
    activityLevel: user?.profile?.activityLevel || 'moderate',
    calories:      user?.targets?.calories || 2000,
    protein:       user?.targets?.protein  || 150,
    carbs:         user?.targets?.carbs    || 200,
    fats:          user?.targets?.fats     || 65,
    steps:         user?.targets?.steps    || 10000,
    water:         user?.targets?.water    || 3000,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    try {
      await dispatch(updateProfile({
        name: form.name,
        profile: {
          age: +form.age, height: +form.height, weight: +form.weight,
          targetWeight: +form.targetWeight, goal: form.goal, activityLevel: form.activityLevel,
        },
        targets: {
          calories: +form.calories, protein: +form.protein,
          carbs: +form.carbs, fats: +form.fats,
          steps: +form.steps, water: +form.water,
        },
      })).unwrap();
      toast.success('Profile saved!');
    } catch { toast.error('Save failed — check backend connection'); }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'FN';

  const tdee = (() => {
    const { age, height, weight, activityLevel, goal } = form;
    if (!age || !height || !weight) return null;
    const bmr = 88.362 + (13.397 * +weight) + (4.799 * +height) - (5.677 * +age);
    const mult = { sedentary:1.2, light:1.375, moderate:1.55, active:1.725, veryActive:1.9 };
    const tdee = Math.round(bmr * (mult[activityLevel] || 1.55));
    return { tdee, target: goal==='cutting' ? tdee-400 : goal==='bulking' ? tdee+300 : tdee };
  })();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="page-title">Profile &amp; Settings</div>
          <div className="text-sm text-muted mt-2">Manage your account and fitness goals</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-primary btn-sm" onClick={save}
            style={{ display:'flex', alignItems:'center', gap:5 }}>
            <Save size={13} /> Save
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => dispatch(logout())}
            style={{ display:'flex', alignItems:'center', gap:5 }}>
            <LogOut size={13} /> Logout
          </button>
        </div>
      </div>

      {/* Profile hero */}
      <div className="card mb-4" style={{ position:'relative', overflow:'hidden', padding:0 }}>
        <CloudImg src={HERO_IMAGES.fitness} alt="fitness" height={100}
          style={{ width:'100%', filter:'brightness(0.4)' }} />
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', padding:16, gap:14 }}>
          <div className="avatar" style={{ width:64, height:64, fontSize:24,
            border:'3px solid rgba(255,255,255,.3)' }}>{initials}</div>
          <div style={{ color:'#fff' }}>
            <div style={{ fontSize:18, fontWeight:700 }}>{user?.name}</div>
            <div style={{ fontSize:12, opacity:.8 }}>{user?.email}</div>
            <div style={{ marginTop:4, display:'flex', gap:6, flexWrap:'wrap' }}>
              <span className="tag" style={{ background:'rgba(255,255,255,.2)', color:'#fff', fontSize:10 }}>
                {GOAL_ICONS[user?.profile?.goal]} {user?.profile?.goal || 'FitNest'}
              </span>
              {user?.isAdmin && (
                <span className="tag" style={{ background:'rgba(139,92,246,.3)', color:'#c4b5fd', fontSize:10,
                  display:'flex', alignItems:'center', gap:4 }}>
                  <ShieldCheck size={9} /> Admin
                </span>
              )}
            </div>
          </div>
          <div style={{ marginLeft:'auto', textAlign:'right', color:'#fff' }}>
            <div style={{ fontSize:24, fontWeight:700, fontFamily:'Syne,sans-serif' }}>{user?.streak || 0}</div>
            <div style={{ fontSize:10, opacity:.8 }}>
              <Flame size={10} style={{ display:'inline', marginRight:2 }} />day streak
            </div>
          </div>
        </div>
      </div>

      {/* TDEE Card */}
      {tdee && (
        <div className="grad-card mb-4">
          <div className="section-title">Estimated TDEE</div>
          <div style={{ display:'flex', gap:24, alignItems:'center' }}>
            <div>
              <div style={{ fontSize:26, fontWeight:800, color:'var(--brand)', fontFamily:'Syne,sans-serif' }}>
                {tdee.tdee} <span style={{ fontSize:13, fontWeight:400 }}>kcal</span>
              </div>
              <div style={{ fontSize:11, color:'var(--muted)' }}>Total Daily Energy Expenditure</div>
            </div>
            <div style={{ borderLeft:'1px solid var(--border)', paddingLeft:24 }}>
              <div style={{ fontSize:20, fontWeight:800, color:'#29b6f6', fontFamily:'Syne,sans-serif' }}>
                {tdee.target} <span style={{ fontSize:13, fontWeight:400 }}>kcal</span>
              </div>
              <div style={{ fontSize:11, color:'var(--muted)' }}>
                Recommended for {form.goal}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid-2 mb-4">
        {/* Personal Info */}
        <div className="card">
          <div className="section-title">Personal Info</div>
          <div className="input-group">
            <label className="input-label">Full Name</label>
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">Age</label>
            <input className="input" type="number" value={form.age}
              onChange={e => set('age', e.target.value)} placeholder="22" />
          </div>
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">Height (cm)</label>
              <input className="input" type="number" value={form.height}
                onChange={e => set('height', e.target.value)} placeholder="175" />
            </div>
            <div className="input-group">
              <label className="input-label">Weight (kg)</label>
              <input className="input" type="number" value={form.weight}
                onChange={e => set('weight', e.target.value)} placeholder="72" />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Target Weight (kg)</label>
            <input className="input" type="number" value={form.targetWeight}
              onChange={e => set('targetWeight', e.target.value)} placeholder="68" />
          </div>
        </div>

        {/* Goals */}
        <div className="card">
          <div className="section-title">Fitness Goals</div>
          <div className="input-group">
            <label className="input-label">Primary Goal</label>
            <select className="select" value={form.goal} onChange={e => set('goal', e.target.value)}>
              {GOAL_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{GOAL_ICONS[o.value]} {o.label}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Activity Level</label>
            <select className="select" value={form.activityLevel}
              onChange={e => set('activityLevel', e.target.value)}>
              {ACTIVITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">Daily Calories</label>
              <input className="input" type="number" value={form.calories}
                onChange={e => set('calories', e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Protein (g)</label>
              <input className="input" type="number" value={form.protein}
                onChange={e => set('protein', e.target.value)} />
            </div>
          </div>
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">Carbs (g)</label>
              <input className="input" type="number" value={form.carbs}
                onChange={e => set('carbs', e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Fats (g)</label>
              <input className="input" type="number" value={form.fats}
                onChange={e => set('fats', e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Daily Targets */}
      <div className="card mb-4">
        <div className="section-title">Daily Targets</div>
        <div className="grid-2">
          <div className="input-group">
            <label className="input-label" style={{ display:'flex', alignItems:'center', gap:5 }}>
              <Footprints size={11} /> Step Goal
            </label>
            <input className="input" type="number" value={form.steps}
              onChange={e => set('steps', e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label" style={{ display:'flex', alignItems:'center', gap:5 }}>
              <Droplets size={11} /> Water Goal (ml)
            </label>
            <input className="input" type="number" value={form.water}
              onChange={e => set('water', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Google Fit Integration */}
      <div className="card mb-4">
        <div className="section-title" style={{ marginBottom:14 }}>Google Fit</div>
        <GoogleFitPanel />
      </div>

      {/* Mi Fitness / Other Devices */}
      <div className="card">
        <div className="section-title" style={{ marginBottom:14 }}>Mi Fitness / Other Devices</div>
        <FitnessSyncPanel />
      </div>
    </div>
  );
}
