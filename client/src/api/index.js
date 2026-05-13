import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('fn_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    // Only kill the session on 401 from auth or user routes.
    // /googlefit/ returns 401 for token-expired (Google token, not our JWT) —
    // intercepting those would log the user out of the app entirely.
    const url = err.config.url || '';
    const isSessionRoute = !url.includes('/auth/') && !url.includes('/googlefit/');
    if (err.response?.status === 401 && isSessionRoute) {
      localStorage.removeItem('fn_token');
      localStorage.removeItem('fn_user');
      window.location.href = '/login';
    }
    return Promise.reject(err.response?.data || { error: err.message });
  }
);

export default api;

export const authAPI = {
  register: d => api.post('/auth/register', d),
  login:    d => api.post('/auth/login', d),
};

export const userAPI = {
  getMe:    ()  => api.get('/users/me'),
  updateMe: d   => api.put('/users/me', d),
};

export const nutritionAPI = {
  getLog:     date => api.get(`/nutrition?date=${date}`),
  addFood:    d    => api.post('/nutrition/add', d),
  removeFood: d    => api.delete('/nutrition/remove', { data: d }),
  updateWater:d    => api.put('/nutrition/water', d),
  getHistory: days => api.get(`/nutrition/history?days=${days}`),
};

export const workoutAPI = {
  getWorkouts:   p        => api.get('/workouts', { params: p }),
  createWorkout: d        => api.post('/workouts', d),
  updateWorkout: (id, d)  => api.put(`/workouts/${id}`, d),
  deleteWorkout: id       => api.delete(`/workouts/${id}`),
  getStats:      days     => api.get(`/workouts/stats?days=${days}`),
};

export const recipeAPI = {
  getRecipes:   p       => api.get('/recipes', { params: p }),
  getRecipe:    id      => api.get(`/recipes/${id}`),
  createRecipe: d       => api.post('/recipes', d),
  updateRecipe: (id,d)  => api.put(`/recipes/${id}`, d),
  deleteRecipe: id      => api.delete(`/recipes/${id}`),
  likeRecipe:   id      => api.post(`/recipes/${id}/like`),
};

export const goalAPI = {
  getGoals:       s      => api.get(`/goals?status=${s||'active'}`),
  createGoal:     d      => api.post('/goals', d),
  updateProgress: (id,d) => api.put(`/goals/${id}/progress`, d),
  deleteGoal:     id     => api.delete(`/goals/${id}`),
};

export const socialAPI = {
  getFeed:     ()       => api.get('/social/feed'),
  createPost:  d        => api.post('/social/post', d),
  likePost:    id       => api.post(`/social/${id}/like`),
  commentPost: (id, t)  => api.post(`/social/${id}/comment`, { text: t }),
};

export const foodAPI = {
  search:       (q, cat) => api.get(`/foods/search?q=${encodeURIComponent(q||'')}&category=${cat||''}`),
  getMine:       ()      => api.get('/foods/mine'),
  createCustom:  d       => api.post('/foods', d),
  updateCustom:  (id,d)  => api.put(`/foods/${id}`, d),
  deleteCustom:  id      => api.delete(`/foods/${id}`),
  seed:          ()      => api.post('/foods/seed'),
};

// Google Fit OAuth REST API
// NOTE: JS getTimezoneOffset() returns POSITIVE for UTC+ zones (e.g. IST = +330).
// The server expects NEGATIVE for zones ahead of UTC (e.g. IST = -330) so we negate.
//
// Module-level sync lock — shared across Dashboard and GoogleFitPanel so they never
// fire two concurrent /sync requests (race condition that caused stale data display).
let _gfitSyncInFlight = false;

export const googleFitAPI = {
  getConnectUrl: ()  => api.get('/googlefit/connect'),
  getStatus:     ()  => api.get('/googlefit/status'),
  sync: () => {
    if (_gfitSyncInFlight) return Promise.reject({ error: 'Sync already in progress' });
    _gfitSyncInFlight = true;
    return api.post('/googlefit/sync', { tzOffset: -new Date().getTimezoneOffset() })
      .finally(() => { _gfitSyncInFlight = false; });
  },
  disconnect:    ()  => api.delete('/googlefit/disconnect'),
};

export const adminAPI = {
  getStats:     ()        => api.get('/admin/stats'),
  getActivity:  (days)    => api.get('/admin/activity', { params: { days } }),
  promote:      (email)   => api.post('/admin/promote', { email }),
  getUsers:     p         => api.get('/admin/users', { params: p }),
  updateUser:   (id, d)   => api.patch(`/admin/users/${id}`, d),
  deleteUser:   id        => api.delete(`/admin/users/${id}`),
  getFoods:     p         => api.get('/admin/foods', { params: p }),
  updateFood:   (id, d)   => api.patch(`/admin/foods/${id}`, d),
  deleteFood:   id        => api.delete(`/admin/foods/${id}`),
  getRecipes:   p         => api.get('/admin/recipes', { params: p }),
  updateRecipe: (id, d)   => api.patch(`/admin/recipes/${id}`, d),
  deleteRecipe: id        => api.delete(`/admin/recipes/${id}`),
};
