import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import nutritionReducer from './slices/nutritionSlice';
import workoutReducer from './slices/workoutSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    nutrition: nutritionReducer,
    workout: workoutReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export default store;
