// client/src/context/ThemeContext.js
// Optional: Global Theme Management Context

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('user-profile-theme');
    if (savedTheme) {
      return savedTheme;
    }
    
    // Check for system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  const [autoSwitch, setAutoSwitch] = useState(() => {
    return localStorage.getItem('auto-theme-switch') === 'true';
  });

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('user-profile-theme', theme);
  }, [theme]);

  // Listen for system theme changes when auto-switch is enabled
  useEffect(() => {
    if (autoSwitch) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e) => {
        const newTheme = e.matches ? 'dark' : 'light';
        setTheme(newTheme);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      
      // Set initial theme based on system preference
      handleChange(mediaQuery);
      
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [autoSwitch]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const toggleAutoSwitch = () => {
    const newAutoSwitch = !autoSwitch;
    setAutoSwitch(newAutoSwitch);
    localStorage.setItem('auto-theme-switch', newAutoSwitch.toString());
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
    autoSwitch,
    toggleAutoSwitch,
    systemPreference: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// HOC for theme-aware components
export const withTheme = (Component) => {
  return (props) => {
    const theme = useTheme();
    return <Component {...props} theme={theme} />;
  };
};

// Hook for components that only need theme value
export const useThemeValue = () => {
  const { theme } = useTheme();
  return theme;
};

// Custom hook for theme-aware styling
export const useThemeStyles = (lightStyles, darkStyles) => {
  const { theme } = useTheme();
  return theme === 'dark' ? darkStyles : lightStyles;
};
