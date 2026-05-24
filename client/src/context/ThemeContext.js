// client/src/context/ThemeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const THEMES = ['dark', 'blue'];

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('bwcc-theme');
    if (saved && THEMES.includes(saved)) return saved;
    return 'dark'; // default to dark (light mode removed)
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('bwcc-theme', theme);
  }, [theme]);

  const cycleTheme = () => {
    setTheme(prev => THEMES[(THEMES.indexOf(prev) + 1) % THEMES.length]);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeValue = () => useTheme().theme;
