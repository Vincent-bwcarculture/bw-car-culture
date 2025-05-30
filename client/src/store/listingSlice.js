// src/store/listingSlice.js
import { createSlice } from '@reduxjs/toolkit';

const listingSlice = createSlice({
  name: 'listings',
  initialState: {
    items: [],
    loading: false,
    error: null
  },
  reducers: {
    updateListingSuccess(state, action) {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    }
  }
});