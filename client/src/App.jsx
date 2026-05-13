import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ToastProvider } from './hooks/useToast';
import AppShell from './components/layout/AppShell';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import NutritionPage from './pages/NutritionPage';
import WorkoutsPage from './pages/WorkoutsPage';
import RecipesPage from './pages/RecipesPage';
import GoalsPage from './pages/GoalsPage';
import ProgressPage from './pages/ProgressPage';
import SocialPage from './pages/SocialPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import CustomFoodsPage from './pages/CustomFoodsPage';

function PrivateRoute({ children }) {
  const token = useSelector(s => s.auth.token);
  return token ? children : <Navigate to="/login" replace />;
}
function PublicRoute({ children }) {
  const token = useSelector(s => s.auth.token);
  return !token ? children : <Navigate to="/" replace />;
}
function AdminRoute({ children }) {
  const { token, user } = useSelector(s => s.auth);
  if (!token) return <Navigate to="/login" replace />;
  // Check isAdmin directly — must be boolean true
  if (user?.isAdmin !== true) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />
        <Route path="/" element={<PrivateRoute><AppShell /></PrivateRoute>}>
          <Route index                  element={<DashboardPage />} />
          <Route path="nutrition"       element={<NutritionPage />} />
          <Route path="workouts"        element={<WorkoutsPage />} />
          <Route path="recipes"         element={<RecipesPage />} />
          <Route path="goals"           element={<GoalsPage />} />
          <Route path="progress"        element={<ProgressPage />} />
          <Route path="social"          element={<SocialPage />} />
          <Route path="profile"         element={<ProfilePage />} />
          <Route path="my-foods"        element={<CustomFoodsPage />} />
          <Route path="admin"           element={<AdminRoute><AdminPage /></AdminRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
}
