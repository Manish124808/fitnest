import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { nutritionAPI } from '../../api';

const today = () => new Date().toISOString().split('T')[0];

export const fetchLog = createAsyncThunk('nutrition/fetchLog', async (date, { rejectWithValue }) => {
  try {
    const res = await nutritionAPI.getLog(date || today());
    return res.data.log;
  } catch (err) { return rejectWithValue(err.error || 'Failed to fetch log'); }
});

export const addFood = createAsyncThunk('nutrition/addFood', async (data, { rejectWithValue }) => {
  try {
    const res = await nutritionAPI.addFood(data);
    return res.data.log;
  } catch (err) { return rejectWithValue(err.error || 'Failed to add food'); }
});

export const removeFood = createAsyncThunk('nutrition/removeFood', async (data, { rejectWithValue }) => {
  try {
    const res = await nutritionAPI.removeFood(data);
    return res.data.log;
  } catch (err) { return rejectWithValue(err.error || 'Failed to remove food'); }
});

export const updateWater = createAsyncThunk('nutrition/updateWater', async (data, { rejectWithValue }) => {
  try {
    const res = await nutritionAPI.updateWater(data);
    return res.data.water;
  } catch (err) { return rejectWithValue(err.error || 'Failed to update water'); }
});

export const fetchHistory = createAsyncThunk('nutrition/fetchHistory', async (days, { rejectWithValue }) => {
  try {
    const res = await nutritionAPI.getHistory(days || 7);
    return res.data.history;
  } catch (err) { return rejectWithValue(err.error || 'Failed to fetch history'); }
});

const nutritionSlice = createSlice({
  name: 'nutrition',
  initialState: {
    currentLog: null,
    history: [],
    selectedDate: today(),
    loading: false,
    error: null,
  },
  reducers: {
    setDate(state, action) { state.selectedDate = action.payload; },
    clearError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLog.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchLog.fulfilled, (s, a) => {
        s.loading = false;
        // Ensure totals always exist
        const log = a.payload;
        if (log && !log.totals) {
          log.totals = { calories:0, protein:0, carbs:0, fats:0, fiber:0 };
        }
        s.currentLog = log;
      })
      .addCase(fetchLog.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
        // Don't leave currentLog as null if it was already set
        if (!s.currentLog) {
          s.currentLog = {
            meals: { breakfast:[], lunch:[], dinner:[], snacks:[] },
            totals: { calories:0, protein:0, carbs:0, fats:0, fiber:0 },
            water: 0,
          };
        }
      })
      .addCase(addFood.fulfilled, (s, a) => { s.currentLog = a.payload; })
      .addCase(removeFood.fulfilled, (s, a) => { s.currentLog = a.payload; })
      .addCase(updateWater.fulfilled, (s, a) => {
        if (s.currentLog) s.currentLog.water = a.payload;
      })
      .addCase(fetchHistory.fulfilled, (s, a) => { s.history = a.payload; });
  },
});

export const { setDate, clearError } = nutritionSlice.actions;
export default nutritionSlice.reducer;
