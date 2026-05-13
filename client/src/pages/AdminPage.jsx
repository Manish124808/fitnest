/**
 * FitNest Admin Dashboard v2.3
 * Full charts, real-time stats, promote tool
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Users, Utensils, ChefHat, BarChart3,
  Trash2, Shield, ShieldOff, Search,
  RefreshCw, TrendingUp, Activity, CheckCircle,
  XCircle, ArrowLeft, Eye, Zap, UserPlus,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { adminAPI } from '../api';
import { useNavigate } from 'react-router-dom';

const TABS = [
  { id:'stats',   label:'Dashboard',  Icon:BarChart3 },
  { id:'charts',  label:'Analytics',  Icon:TrendingUp },
  { id:'users',   label:'Users',      Icon:Users },
  { id:'foods',   label:'Foods',      Icon:Utensils },
  { id:'recipes', label:'Recipes',    Icon:ChefHat },
  { id:'tools',   label:'Tools',      Icon:Zap },
];

const COLORS = ['#00e676','#3b82f6','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#ec4899','#14b8a6'];

function StatCard({ label, value, sub, color = 'var(--brand)', icon: Icon }) {
  return (
    <div className="stat-card" style={{ borderColor: color + '33' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <div className="stat-label">{label}</div>
          <div className="stat-value" style={{ color, fontSize:26 }}>{value ?? '—'}</div>
          {sub && <div className="stat-sub">{sub}</div>}
        </div>
        {Icon && (
          <div style={{ background: color + '15', borderRadius:10, padding:8 }}>
            <Icon size={18} color={color} />
          </div>
        )}
      </div>
    </div>
  );
}

function Pagination({ page, pages, onPage }) {
  if (pages <= 1) return null;
  return (
    <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:16 }}>
      {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
        <button key={p} className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => onPage(p)}>{p}</button>
      ))}
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="card mb-4">
      <div className="section-title mb-3" style={{ fontSize:13 }}>{title}</div>
      {children}
    </div>
  );
}

// ── Stats Tab ─────────────────────────────────────────────────────
function StatsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getStats().then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign:'center', padding:40 }}><RefreshCw size={24} style={{ animation:'spin .8s linear infinite', color:'var(--muted)' }} /></div>;
  if (!data) return <div className="empty-state"><div className="empty-state-title">Failed to load stats</div></div>;

  const { users, content, topFoods, regByDay } = data;

  return (
    <div>
      <div className="section-title" style={{ marginBottom:12 }}>User Metrics</div>
      <div className="grid-4 mb-4">
        <StatCard label="Total Users"    value={users.total}            icon={Users}       color="#00e676" />
        <StatCard label="Active Users"   value={users.active}           icon={Activity}    color="#3b82f6" sub="accounts" />
        <StatCard label="New This Week"  value={users.newThisWeek}      icon={TrendingUp}  color="#f59e0b" />
        <StatCard label="Active 7 Days"  value={users.activeThisWeek}   icon={CheckCircle} color="#8b5cf6" sub="logged a meal" />
      </div>

      <div className="section-title" style={{ marginBottom:12 }}>Content</div>
      <div className="grid-4 mb-4">
        <StatCard label="Foods"     value={content.foods}     icon={Utensils} color="#00e676" />
        <StatCard label="Recipes"   value={content.recipes}   icon={ChefHat}  color="#f59e0b" />
        <StatCard label="Workouts"  value={content.workouts}  icon={Activity} color="#3b82f6" />
        <StatCard label="Meal Logs" value={content.mealLogs}  icon={BarChart3} color="#8b5cf6" />
      </div>

      {topFoods?.length > 0 && (
        <>
          <div className="section-title mb-3">Most Used Foods</div>
          <div className="card mb-4">
            {topFoods.map((f, i) => (
              <div key={f._id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'9px 0', borderBottom: i < topFoods.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:12, color:'var(--muted)', width:18 }}>#{i+1}</span>
                  <span style={{ fontSize:13, fontWeight:500 }}>{f.name}</span>
                  <span className="tag tag-gray" style={{ fontSize:9 }}>{f.category}</span>
                </div>
                <span className="tag tag-green">{f.usageCount} uses</span>
              </div>
            ))}
          </div>
        </>
      )}

      {regByDay?.length > 0 && (
        <>
          <div className="section-title mb-3">New Registrations (Last 7 Days)</div>
          <div className="card">
            {regByDay.map(d => (
              <div key={d._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
                <span style={{ fontSize:12, color:'var(--muted)' }}>{d._id}</span>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ height:6, width: Math.max(d.count * 20, 6), maxWidth:120,
                    background:'var(--brand)', borderRadius:99, opacity:.7 }} />
                  <span style={{ fontSize:13, fontWeight:700, color:'var(--brand)' }}>{d.count}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Analytics / Charts Tab ────────────────────────────────────────
function ChartsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const load = useCallback(() => {
    setLoading(true);
    adminAPI.getActivity(days).then(r => setData(r.data)).finally(() => setLoading(false));
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const fmtDate = (d) => d?.slice(5) || d; // MM-DD from YYYY-MM-DD

  if (loading) return <div style={{ textAlign:'center', padding:40 }}><RefreshCw size={24} style={{ animation:'spin .8s linear infinite', color:'var(--muted)' }} /></div>;

  const { mealActivity = [], userGrowth = [], topFoodsChart = [] } = data || {};

  // Pie chart data
  const pieData = topFoodsChart.slice(0, 6).map((f, i) => ({
    name: f.name.split(' ')[0],
    value: f.usageCount || 0,
    fill: COLORS[i],
  }));

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:16, alignItems:'center' }}>
        <span style={{ fontSize:12, color:'var(--muted)' }}>Time range:</span>
        {[7, 14, 30, 60].map(d => (
          <button key={d} className={`btn btn-sm ${days===d ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setDays(d)}>{d}d</button>
        ))}
        <button className="btn btn-ghost btn-sm btn-icon" onClick={load}><RefreshCw size={13} /></button>
      </div>

      <ChartCard title="Daily Meal Logs">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={mealActivity.map(d => ({ ...d, date: fmtDate(d._id) }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fontSize:10, fill:'var(--muted)' }} />
            <YAxis tick={{ fontSize:10, fill:'var(--muted)' }} />
            <Tooltip contentStyle={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }} />
            <Line type="monotone" dataKey="logs" stroke="#00e676" strokeWidth={2} dot={false} name="Meal Logs" />
            <Line type="monotone" dataKey="activeUsers" stroke="#3b82f6" strokeWidth={2} dot={false} name="Active Users" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="New User Registrations">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={userGrowth.map(d => ({ ...d, date: fmtDate(d._id) }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fontSize:10, fill:'var(--muted)' }} />
            <YAxis tick={{ fontSize:10, fill:'var(--muted)' }} allowDecimals={false} />
            <Tooltip contentStyle={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }} />
            <Bar dataKey="count" fill="#f59e0b" radius={[4,4,0,0]} name="New Users" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {pieData.some(d => d.value > 0) && (
        <ChartCard title="Top Food Usage (Pie)">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip contentStyle={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }} />
              <Legend wrapperStyle={{ fontSize:11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {mealActivity.length === 0 && userGrowth.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-title">No activity data yet</div>
          <div className="empty-state-sub">Charts will populate as users start logging meals</div>
        </div>
      )}
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────
function UsersTab() {
  const [users,   setUsers]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [q,       setQ]       = useState('');
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers({ page, limit:15, q });
      setUsers(res.data.users);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } finally { setLoading(false); }
  }, [page, q]);

  useEffect(() => { load(); }, [load]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const toggleAdmin = async (id, current) => {
    await adminAPI.updateUser(id, { isAdmin: !current });
    showToast(`Admin status ${!current ? 'granted' : 'revoked'}`);
    load();
  };

  const toggleActive = async (id, current) => {
    await adminAPI.updateUser(id, { isActive: !current });
    showToast(`User ${!current ? 'activated' : 'suspended'}`);
    load();
  };

  const deleteUser = async (id, name) => {
    if (!window.confirm(`Delete user "${name}" and all their data?`)) return;
    await adminAPI.deleteUser(id);
    showToast('User deleted');
    load();
  };

  return (
    <div>
      {toast && (
        <div style={{ background:'rgba(0,200,83,.08)', border:'1px solid rgba(0,200,83,.2)',
          borderRadius:8, padding:'8px 12px', fontSize:12, color:'var(--brand)', marginBottom:12,
          display:'flex', alignItems:'center', gap:6 }}>
          <CheckCircle size={13} /> {toast}
        </div>
      )}

      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        <div style={{ position:'relative', flex:1 }}>
          <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--muted)' }} />
          <input className="input" placeholder="Search users by name or email…"
            style={{ paddingLeft:36 }}
            value={q} onChange={e => { setQ(e.target.value); setPage(1); }} />
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin .8s linear infinite' : 'none' }} />
        </button>
      </div>

      <div style={{ fontSize:11, color:'var(--muted)', marginBottom:10 }}>{total} users total</div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        {users.map((u, i) => (
          <div key={u._id} style={{
            display:'flex', alignItems:'center', gap:10,
            padding:'11px 14px',
            borderBottom: i < users.length - 1 ? '1px solid var(--border)' : 'none',
            background: !u.isActive ? 'rgba(255,82,82,.04)' : 'transparent',
          }}>
            <div className="avatar" style={{ width:32, height:32, fontSize:11, flexShrink:0 }}>
              {u.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:13, fontWeight:600 }} className="truncate">{u.name}</span>
                {u.isAdmin && <span className="tag tag-purple" style={{ fontSize:9 }}>Admin</span>}
                {!u.isActive && <span className="tag tag-red" style={{ fontSize:9 }}>Suspended</span>}
                {u.googleFit?.connected && <span className="tag tag-green" style={{ fontSize:9 }}>GFit</span>}
              </div>
              <div style={{ fontSize:10, color:'var(--muted)' }}>{u.email}</div>
            </div>
            <div style={{ display:'flex', gap:4, flexShrink:0 }}>
              <button className="btn btn-icon btn-ghost" title={u.isAdmin ? 'Remove admin' : 'Make admin'}
                onClick={() => toggleAdmin(u._id, u.isAdmin)}>
                {u.isAdmin ? <ShieldOff size={13} /> : <Shield size={13} />}
              </button>
              <button className="btn btn-icon btn-ghost" title={u.isActive ? 'Suspend' : 'Activate'}
                onClick={() => toggleActive(u._id, u.isActive)}>
                {u.isActive ? <XCircle size={13} /> : <CheckCircle size={13} />}
              </button>
              <button className="btn btn-icon btn-danger" title="Delete user"
                onClick={() => deleteUser(u._id, u.name)}>
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
        {users.length === 0 && !loading && (
          <div className="empty-state"><div className="empty-state-title">No users found</div></div>
        )}
      </div>
      <Pagination page={page} pages={pages} onPage={setPage} />
    </div>
  );
}

// ── Foods Tab ─────────────────────────────────────────────────────
function FoodsTab() {
  const [foods,   setFoods]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [q,       setQ]       = useState('');
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getFoods({ page, limit:15, q });
      setFoods(res.data.foods);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } finally { setLoading(false); }
  }, [page, q]);

  useEffect(() => { load(); }, [load]);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const deleteFood = async (id, name) => {
    if (!window.confirm(`Delete food "${name}"?`)) return;
    await adminAPI.deleteFood(id);
    showToast('Food deleted');
    load();
  };

  const verifyFood = async (id, current) => {
    await adminAPI.updateFood(id, { isVerified: !current });
    showToast(current ? 'Food unverified' : 'Food verified');
    load();
  };

  return (
    <div>
      {toast && (
        <div style={{ background:'rgba(0,200,83,.08)', border:'1px solid rgba(0,200,83,.2)',
          borderRadius:8, padding:'8px 12px', fontSize:12, color:'var(--brand)', marginBottom:12,
          display:'flex', alignItems:'center', gap:6 }}>
          <CheckCircle size={13} /> {toast}
        </div>
      )}

      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        <div style={{ position:'relative', flex:1 }}>
          <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--muted)' }} />
          <input className="input" placeholder="Search foods…" style={{ paddingLeft:36 }}
            value={q} onChange={e => { setQ(e.target.value); setPage(1); }} />
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin .8s linear infinite' : 'none' }} />
        </button>
      </div>

      <div style={{ fontSize:11, color:'var(--muted)', marginBottom:10 }}>{total} foods in database</div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        {foods.map((f, i) => (
          <div key={f._id} style={{
            display:'flex', alignItems:'center', gap:10,
            padding:'10px 14px',
            borderBottom: i < foods.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:13, fontWeight:600 }} className="truncate">{f.name}</span>
                {f.isVerified && <span className="tag tag-green" style={{ fontSize:9 }}>Verified</span>}
                <span className="tag tag-gray" style={{ fontSize:9 }}>{f.category}</span>
                {f.isCustom && <span className="tag tag-blue" style={{ fontSize:9 }}>Custom</span>}
              </div>
              <div style={{ fontSize:10, color:'var(--muted)', marginTop:2 }}>
                {f.calories} kcal · P:{f.macros?.protein}g C:{f.macros?.carbs}g F:{f.macros?.fats}g
                {f.usageCount > 0 && ` · ${f.usageCount} uses`}
              </div>
            </div>
            <div style={{ display:'flex', gap:4 }}>
              <button className="btn btn-icon btn-ghost" title={f.isVerified ? 'Unverify' : 'Verify'}
                onClick={() => verifyFood(f._id, f.isVerified)}>
                {f.isVerified ? <XCircle size={13} /> : <CheckCircle size={13} />}
              </button>
              <button className="btn btn-icon btn-danger" title="Delete"
                onClick={() => deleteFood(f._id, f.name)}>
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
        {foods.length === 0 && !loading && (
          <div className="empty-state"><div className="empty-state-title">No foods found</div></div>
        )}
      </div>
      <Pagination page={page} pages={pages} onPage={setPage} />
    </div>
  );
}

// ── Recipes Tab ───────────────────────────────────────────────────
function RecipesTab() {
  const [recipes, setRecipes] = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getRecipes({ page, limit:15 });
      setRecipes(res.data.recipes);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const deleteRecipe = async (id, name) => {
    if (!window.confirm(`Delete recipe "${name}"?`)) return;
    await adminAPI.deleteRecipe(id);
    showToast('Recipe deleted');
    load();
  };

  const togglePublic = async (id, current) => {
    await adminAPI.updateRecipe(id, { isPublic: !current });
    showToast(current ? 'Recipe set to private' : 'Recipe made public');
    load();
  };

  return (
    <div>
      {toast && (
        <div style={{ background:'rgba(0,200,83,.08)', border:'1px solid rgba(0,200,83,.2)',
          borderRadius:8, padding:'8px 12px', fontSize:12, color:'var(--brand)', marginBottom:12,
          display:'flex', alignItems:'center', gap:6 }}>
          <CheckCircle size={13} /> {toast}
        </div>
      )}

      <div style={{ fontSize:11, color:'var(--muted)', marginBottom:10 }}>{total} recipes total</div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        {recipes.map((r, i) => (
          <div key={r._id} style={{
            display:'flex', alignItems:'center', gap:10,
            padding:'10px 14px',
            borderBottom: i < recipes.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{ fontSize:20, flexShrink:0 }}>{r.emoji || '🍽️'}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:13, fontWeight:600 }} className="truncate">{r.name}</span>
                <span className={`tag ${r.isPublic ? 'tag-green' : 'tag-gray'}`} style={{ fontSize:9 }}>
                  {r.isPublic ? 'Public' : 'Private'}
                </span>
                <span className="tag tag-blue" style={{ fontSize:9 }}>{r.category}</span>
              </div>
              <div style={{ fontSize:10, color:'var(--muted)', marginTop:2 }}>
                by {r.author?.name} · {r.nutrition?.calories} kcal · {r.likes?.length || 0} likes
              </div>
            </div>
            <div style={{ display:'flex', gap:4 }}>
              <button className="btn btn-icon btn-ghost" title={r.isPublic ? 'Make private' : 'Make public'}
                onClick={() => togglePublic(r._id, r.isPublic)}>
                <Eye size={13} />
              </button>
              <button className="btn btn-icon btn-danger" title="Delete"
                onClick={() => deleteRecipe(r._id, r.name)}>
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
        {recipes.length === 0 && !loading && (
          <div className="empty-state"><div className="empty-state-title">No recipes yet</div></div>
        )}
      </div>
      <Pagination page={page} pages={pages} onPage={setPage} />
    </div>
  );
}

// ── Tools Tab ─────────────────────────────────────────────────────
function ToolsTab() {
  const [email, setEmail] = useState('');
  const [msg,   setMsg]   = useState('');
  const [err,   setErr]   = useState('');
  const [loading, setLoading] = useState(false);

  const promote = async () => {
    if (!email.trim()) return;
    setLoading(true); setMsg(''); setErr('');
    try {
      const r = await adminAPI.promote(email.trim());
      setMsg(r.data.message || 'Done!');
      setEmail('');
    } catch (e) {
      setErr(e.response?.data?.error || 'Error promoting user');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="card mb-4">
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
          <UserPlus size={16} color="var(--brand)" />
          <span style={{ fontWeight:600, fontSize:14 }}>Promote User to Admin</span>
        </div>
        <p style={{ fontSize:12, color:'var(--muted)', marginBottom:12 }}>
          Enter the email of a registered user to grant them admin access.
          The user must already have an account.
        </p>
        <div style={{ display:'flex', gap:8 }}>
          <input className="input" placeholder="user@example.com"
            value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && promote()} style={{ flex:1 }} />
          <button className="btn btn-primary" onClick={promote} disabled={loading || !email.trim()}>
            {loading ? <RefreshCw size={13} style={{ animation:'spin .8s linear infinite' }} /> : 'Promote'}
          </button>
        </div>
        {msg && <div style={{ marginTop:10, color:'var(--brand)', fontSize:12 }}>✅ {msg}</div>}
        {err && <div style={{ marginTop:10, color:'#ef4444', fontSize:12 }}>❌ {err}</div>}
      </div>

      <div className="card">
        <div style={{ fontWeight:600, fontSize:14, marginBottom:10 }}>Google Fit Status</div>
        <p style={{ fontSize:12, color:'var(--muted)' }}>
          Google Fit is configured via environment variables on Render.
          Required: <code style={{ background:'var(--surface-2)', padding:'1px 4px', borderRadius:3, fontSize:11 }}>GOOGLE_CLIENT_ID</code> and{' '}
          <code style={{ background:'var(--surface-2)', padding:'1px 4px', borderRadius:3, fontSize:11 }}>GOOGLE_CLIENT_SECRET</code>.
          The <code style={{ background:'var(--surface-2)', padding:'1px 4px', borderRadius:3, fontSize:11 }}>googleapis</code> package
          is included in package.json and installs automatically on Render.
        </p>
      </div>
    </div>
  );
}

// ── Main Admin Page ───────────────────────────────────────────────
export default function AdminPage() {
  const [tab, setTab] = useState('stats');
  const navigate = useNavigate();

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <div className="page-title" style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Shield size={22} style={{ color:'var(--brand)' }} />
            Admin Dashboard
          </div>
          <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>
            Manage users, foods, recipes and view real-time analytics
          </div>
        </div>
      </div>

      <div className="tab-bar mb-4" style={{ overflowX:'auto' }}>
        {TABS.map(({ id, label, Icon }) => (
          <div key={id} className={`tab ${tab === id ? 'active' : ''}`}
            onClick={() => setTab(id)}
            style={{ display:'flex', alignItems:'center', gap:5, justifyContent:'center', whiteSpace:'nowrap' }}>
            <Icon size={13} /> {label}
          </div>
        ))}
      </div>

      {tab === 'stats'   && <StatsTab />}
      {tab === 'charts'  && <ChartsTab />}
      {tab === 'users'   && <UsersTab />}
      {tab === 'foods'   && <FoodsTab />}
      {tab === 'recipes' && <RecipesTab />}
      {tab === 'tools'   && <ToolsTab />}
    </div>
  );
}
