import { configureStore } from '@reduxjs/toolkit';
import newsReducer from './slices/newsSlice.js';
import uiReducer from './slices/uiSlice.js';

export const store = configureStore({
  reducer: {
    news: newsReducer,
    ui: uiReducer,
  },
});