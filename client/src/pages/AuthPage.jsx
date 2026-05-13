import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, register, clearError } from '../store/slices/authSlice';
import { Shield, Leaf, Smartphone, Activity } from 'lucide-react';
import { FitNestLogo } from '../components/layout/AppShell';

export default function AuthPage() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(s => s.auth);
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name:'', email:'', password:'', goal:'cutting' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = e => {
    e.preventDefault();
    dispatch(clearError());
    if (mode === 'login') dispatch(login({ email: form.email, password: form.password }));
    else dispatch(register({ name: form.name, email: form.email, password: form.password, profile: { goal: form.goal } }));
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      padding:16, position:'relative', overflow:'hidden',
      background:'radial-gradient(ellipse at 20% 50%,rgba(22,163,74,.07) 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,rgba(13,148,136,.07) 0%,transparent 60%),var(--bg)' }}>

      <div style={{ width:'100%', maxWidth:420 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
            <div style={{ filter:'drop-shadow(0 0 20px rgba(74,222,128,.4))' }}>
              <FitNestLogo size={68} />
            </div>
          </div>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:32, fontWeight:800,
            background:'linear-gradient(135deg,#4ade80,#34d399)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            FitNest
          </div>
          <div style={{ fontSize:13, color:'var(--muted)', marginTop:4 }}>
            Your all-in-one Indian fitness companion
          </div>
        </div>

        <div style={{ background:'var(--card)', border:'1px solid var(--border)',
          borderRadius:'var(--radius-lg)', padding:28, boxShadow:'var(--shadow-lg)' }}>
          <div className="tab-bar">
            <div className={`tab ${mode==='login'?'active':''}`}
              onClick={() => { setMode('login'); dispatch(clearError()); }}>Log In</div>
            <div className={`tab ${mode==='register'?'active':''}`}
              onClick={() => { setMode('register'); dispatch(clearError()); }}>Sign Up</div>
          </div>

          <form onSubmit={submit}>
            {mode === 'register' && (
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input className="input" placeholder="Your full name" value={form.name}
                  onChange={e => set('name', e.target.value)} required />
              </div>
            )}
            <div className="input-group">
              <label className="input-label">Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={form.email}
                onChange={e => set('email', e.target.value)} required />
            </div>
            <div className="input-group">
              <label className="input-label">Password</label>
              <input className="input" type="password" placeholder="Min 6 characters" value={form.password}
                onChange={e => set('password', e.target.value)} required />
            </div>
            {mode === 'register' && (
              <div className="input-group">
                <label className="input-label">Primary Goal</label>
                <select className="select" value={form.goal} onChange={e => set('goal', e.target.value)}>
                  <option value="cutting">Fat Loss (Cutting)</option>
                  <option value="bulking">Muscle Gain (Bulking)</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="performance">Athletic Performance</option>
                </select>
              </div>
            )}
            {error && (
              <div style={{ background:'rgba(255,82,82,.1)', border:'1px solid rgba(255,82,82,.2)',
                color:'#ff5252', padding:'9px 12px', borderRadius:8, fontSize:13, marginBottom:14,
                display:'flex', alignItems:'center', gap:8 }}>
                <Shield size={13} /> {error}
              </div>
            )}
            <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
              {loading
                ? <><Activity size={15} style={{ animation:'spin .8s linear infinite' }}/> Please wait…</>
                : mode === 'login' ? 'Log In' : 'Create Account'}
            </button>
          </form>
        </div>

        <div style={{ textAlign:'center', marginTop:16, fontSize:11, color:'var(--subtle)',
          display:'flex', justifyContent:'center', gap:18 }}>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}><Shield size={10}/> Secure JWT</span>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}><Leaf size={10}/> 300+ Indian Foods</span>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}><Smartphone size={10}/> PWA Ready</span>
        </div>
      </div>
    </div>
  );
}
