import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI, userAPI } from '../../api';

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const res = await userAPI.getMe();
    localStorage.setItem('fn_user', JSON.stringify(res.data.user));
    return res.data.user;
  } catch (err) {
    return rejectWithValue(err.error || 'Failed to fetch user');
  }
});

export const register = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await authAPI.register(data);
    localStorage.setItem('fn_token', res.data.token);
    localStorage.setItem('fn_user', JSON.stringify(res.data.user));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.error || 'Registration failed');
  }
});

export const login = createAsyncThunk('auth/login', async (data, { rejectWithValue }) => {
  try {
    const res = await authAPI.login(data);
    localStorage.setItem('fn_token', res.data.token);
    localStorage.setItem('fn_user', JSON.stringify(res.data.user));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.error || 'Login failed');
  }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (data, { rejectWithValue }) => {
  try {
    const res = await userAPI.updateMe(data);
    localStorage.setItem('fn_user', JSON.stringify(res.data.user));
    return res.data.user;
  } catch (err) {
    return rejectWithValue(err.error || 'Update failed');
  }
});

const storedUser = (() => { try { return JSON.parse(localStorage.getItem('fn_user')); } catch { return null; } })();

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:    storedUser || null,
    token:   localStorage.getItem('fn_token') || null,
    loading: false,
    error:   null,
  },
  reducers: {
    logout(state) {
      state.user  = null;
      state.token = null;
      localStorage.removeItem('fn_token');
      localStorage.removeItem('fn_user');
    },
    clearError(state)        { state.error = null; },
    // Update local user cache after Google Fit sync or admin changes
    patchUser(state, action) {
      if (state.user) {
        const payload = action.payload;
        // Deep merge nested objects (googleFit, fitStats, targets, profile)
        const merged = { ...state.user };
        for (const key of Object.keys(payload)) {
          if (payload[key] && typeof payload[key] === 'object' && !Array.isArray(payload[key]) && typeof merged[key] === 'object' && merged[key] !== null) {
            merged[key] = { ...merged[key], ...payload[key] };
          } else {
            merged[key] = payload[key];
          }
        }
        state.user = merged;
        localStorage.setItem('fn_user', JSON.stringify(state.user));
      }
    },
  },
  extraReducers: (builder) => {
    const pending  = (state) => { state.loading = true; state.error = null; };
    const rejected = (state, action) => { state.loading = false; state.error = action.payload; };
    builder
      .addCase(register.pending, pending)
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user    = action.payload.user;
        state.token   = action.payload.token;
      })
      .addCase(register.rejected, rejected)
      .addCase(login.pending, pending)
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user    = action.payload.user;
        state.token   = action.payload.token;
      })
      .addCase(login.rejected, rejected)
      .addCase(updateProfile.pending, pending)
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        // Merge to preserve fitStats, googleFit etc that the profile update response may omit
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('fn_user', JSON.stringify(state.user));
      })
      .addCase(updateProfile.rejected, rejected)
      .addCase(fetchMe.fulfilled, (state, action) => {
        // Deep merge for config objects (googleFit, targets, profile, notifications)
        // but REPLACE fitStats outright so stale cached stats never bleed through
        const payload = action.payload;
        const base = state.user || {};
        const merged = { ...base };
        const deepMergeKeys = new Set(['googleFit', 'targets', 'profile', 'notifications']);
        for (const key of Object.keys(payload)) {
          if (
            deepMergeKeys.has(key) &&
            payload[key] && typeof payload[key] === 'object' && !Array.isArray(payload[key]) &&
            merged[key] && typeof merged[key] === 'object' && merged[key] !== null
          ) {
            merged[key] = { ...merged[key], ...payload[key] };
          } else {
            // fitStats and all other fields are replaced directly
            merged[key] = payload[key];
          }
        }
        state.user = merged;
        localStorage.setItem('fn_user', JSON.stringify(merged));
      });
  },
});

export const { logout, clearError, patchUser } = authSlice.actions;
export default authSlice.reducer;
