// client/src/components/shared/ThemeToggle/ThemeToggle.js
import React from 'react';
import { Moon, Layers } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext.js';
import './ThemeToggle.css';

const THEME_CONFIG = [
  { id: 'dark',  icon: Moon,   label: 'Dark' },
  { id: 'blue',  icon: Layers, label: 'Blue' },
];

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="theme-toggle" role="group" aria-label="Choose theme">
      {THEME_CONFIG.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          className={`theme-toggle-btn theme-toggle-${id}${theme === id ? ' active' : ''}`}
          onClick={() => setTheme(id)}
          aria-label={`${label} mode`}
          title={`${label} mode`}
          type="button"
        >
          <Icon size={12} strokeWidth={2} />
        </button>
      ))}
    </div>
  );
};

export default ThemeToggle;
