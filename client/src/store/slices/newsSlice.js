import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  featuredArticle: {
    title: "Car Review Title",
    description: "Author | I3w Car Culture News Desk",
    image: "/images/GTR35.jpg"
  },
  newsItems: [
    {
      id: 1,
      image: '/images/Revuelto.jpg',
      title: 'Lamborghini Revuelto breaks surface with 1015Nm!',
      description: 'Author | I3w Car Culture News Desk',
      content: 'What a sight delight, the latest 2024 V12 Plug-In Hybrid Lamborghini Revuelto!...'
    },
    // Add more initial news items
  ],
  selectedArticle: null,
  loading: false,
  error: null
};

export const newsSlice = createSlice({
  name: 'news',
  initialState,
  reducers: {
    setFeaturedArticle: (state, action) => {
      state.featuredArticle = action.payload;
    },
    addNewsItem: (state, action) => {
      state.newsItems.push(action.payload);
    },
    selectArticle: (state, action) => {
      state.selectedArticle = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    }
  }
});

export const { 
  setFeaturedArticle, 
  addNewsItem, 
  selectArticle,
  setLoading,
  setError
} = newsSlice.actions;

export default newsSlice.reducer;