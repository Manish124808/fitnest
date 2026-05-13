import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { workoutAPI } from '../../api';

export const fetchWorkouts = createAsyncThunk('workout/fetchWorkouts', async (params, { rejectWithValue }) => {
  try { const res = await workoutAPI.getWorkouts(params); return res.data; }
  catch (err) { return rejectWithValue(err.error || 'Failed'); }
});

export const createWorkout = createAsyncThunk('workout/create', async (data, { rejectWithValue }) => {
  try { const res = await workoutAPI.createWorkout(data); return res.data.workout; }
  catch (err) { return rejectWithValue(err.error || 'Failed'); }
});

export const deleteWorkout = createAsyncThunk('workout/delete', async (id, { rejectWithValue }) => {
  try { await workoutAPI.deleteWorkout(id); return id; }
  catch (err) { return rejectWithValue(err.error || 'Failed'); }
});

export const fetchStats = createAsyncThunk('workout/fetchStats', async (days, { rejectWithValue }) => {
  try { const res = await workoutAPI.getStats(days); return res.data.stats; }
  catch (err) { return rejectWithValue(err.error || 'Failed'); }
});

const workoutSlice = createSlice({
  name: 'workout',
  initialState: { workouts: [], stats: null, total: 0, loading: false, error: null },
  reducers: { clearError(state) { state.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkouts.pending, (s) => { s.loading = true; })
      .addCase(fetchWorkouts.fulfilled, (s, a) => { s.loading = false; s.workouts = a.payload.workouts || []; s.total = a.payload.total || 0; })
      .addCase(fetchWorkouts.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(createWorkout.fulfilled, (s, a) => { s.workouts.unshift(a.payload); })
      .addCase(deleteWorkout.fulfilled, (s, a) => { s.workouts = s.workouts.filter(w => w._id !== a.payload); })
      .addCase(fetchStats.fulfilled, (s, a) => { s.stats = a.payload; });
  },
});

export const { clearError } = workoutSlice.actions;
export default workoutSlice.reducer;
