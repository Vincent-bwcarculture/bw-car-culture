import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  menuOpen: false,
  selectedCategory: 'Car News',
  theme: 'dark',
  notifications: []
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleMenu: (state) => {
      state.menuOpen = !state.menuOpen;
    },
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    addNotification: (state, action) => {
      state.notifications.push(action.payload);
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    }
  }
});

export const {
  toggleMenu,
  setSelectedCategory,
  setTheme,
  addNotification,
  removeNotification
} = uiSlice.actions;

export default uiSlice.reducer;