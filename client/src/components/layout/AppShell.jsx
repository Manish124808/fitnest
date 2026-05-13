import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import {
  LayoutDashboard, Salad, Dumbbell, ChefHat, Target,
  TrendingUp, Users, Settings, LogOut, ShieldCheck,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/',           label: 'Dashboard', Icon: LayoutDashboard },
  { path: '/nutrition',  label: 'Nutrition',  Icon: Salad },
  { path: '/workouts',   label: 'Workouts',   Icon: Dumbbell },
  { path: '/recipes',    label: 'Recipes',    Icon: ChefHat },
  { path: '/goals',      label: 'Goals',      Icon: Target },
  { path: '/progress',   label: 'Progress',   Icon: TrendingUp },
  { path: '/social',     label: 'Community',  Icon: Users },
  { path: '/profile',    label: 'Profile',    Icon: Settings },
];

const MOBILE_PATHS = ['/', '/nutrition', '/workouts', '/goals', '/profile'];

// 🌿 FitNest Leaf Logo SVG
export function FitNestLogo({ size = 32, showText = false }) {
  return (
    <img src="/logo.png" width={size} height={size} alt="FitNest"
      style={{ borderRadius: size * 0.25, objectFit:'cover', display:'block' }} />
  );
}

export default function AppShell() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const dispatch  = useDispatch();
  const user      = useSelector(s => s.auth.user);

  const isActive = (p) => p === '/' ? location.pathname === '/' : location.pathname.startsWith(p);
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'FN';

  return (
    <div className="app-shell">

      {/* ── Desktop Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo" onClick={() => navigate('/')} style={{ cursor:'pointer' }}>
          <FitNestLogo size={34} />
          <div>
            <div className="sidebar-logo-text">FitNest</div>
            <div className="sidebar-logo-sub">Health companion</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ path, label, Icon }) => (
            <div key={path}
              className={`sidebar-item${isActive(path) ? ' active' : ''}`}
              onClick={() => navigate(path)}>
              <span className="sidebar-item-icon">
                <Icon size={17} strokeWidth={isActive(path) ? 2.5 : 2} />
              </span>
              {label}
            </div>
          ))}

          {/* Admin — only shown when isAdmin is true */}
          {user?.isAdmin === true && (
            <div
              className={`sidebar-item${isActive('/admin') ? ' active' : ''}`}
              onClick={() => navigate('/admin')}
              style={{ borderTop: '1px solid var(--border)', marginTop: 6, paddingTop: 8 }}>
              <span className="sidebar-item-icon">
                <ShieldCheck size={17} strokeWidth={isActive('/admin') ? 2.5 : 2} />
              </span>
              Admin Panel
            </div>
          )}
        </nav>

        <div className="sidebar-user">
          <div className="avatar" style={{ width:34, height:34, fontSize:12, flexShrink:0 }}>
            {initials}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div className="sidebar-user-name" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {user?.name}
            </div>
            <div className="sidebar-user-goal" style={{ display:'flex', alignItems:'center', gap:3 }}>
              {user?.isAdmin ? <><ShieldCheck size={9}/> Admin</> : (user?.profile?.goal || 'FitNest')}
            </div>
          </div>
          <button className="btn-icon btn-ghost" onClick={() => dispatch(logout())} title="Logout"
            style={{ padding:5, borderRadius:6, color:'var(--muted)', border:'none', background:'none', cursor:'pointer' }}>
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* ── Mobile Header ── */}
      <header className="mobile-header">
        <div style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}
          onClick={() => navigate('/')}>
          <FitNestLogo size={28} />
          <span style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:17,
            background:'linear-gradient(135deg,#4ade80,#34d399)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            FitNest
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {user?.isAdmin && (
            <button onClick={() => navigate('/admin')}
              style={{ display:'flex', alignItems:'center', gap:3, padding:'4px 8px', fontSize:10,
                background:'rgba(139,92,246,.15)', border:'1px solid rgba(139,92,246,.3)',
                borderRadius:6, color:'#a78bfa', cursor:'pointer' }}>
              <ShieldCheck size={11}/> Admin
            </button>
          )}
          <div className="avatar" style={{ width:30, height:30, fontSize:11, cursor:'pointer' }}
            onClick={() => navigate('/profile')}>
            {initials}
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="main-content">
        <div className="page-wrapper animate-fade">
          <Outlet />
        </div>
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="bottom-nav">
        {NAV_ITEMS.filter(n => MOBILE_PATHS.includes(n.path)).map(({ path, label, Icon }) => (
          <div key={path}
            className={`bottom-nav-item${isActive(path) ? ' active' : ''}`}
            onClick={() => navigate(path)}>
            <span className="nav-icon">
              <Icon size={20} strokeWidth={isActive(path) ? 2.5 : 1.8} />
            </span>
            <span className="nav-label">{label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
}
