// src/context/ThemeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext(null);
export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() =>
    localStorage.getItem('dark_mode') === 'true'
  );
  const { activeCompany } = useAuth();

  const primaryColor = activeCompany?.settings?.primaryColor || '#6366f1';

  useEffect(() => {
    localStorage.setItem('dark_mode', darkMode);
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    // Convert hex to RGB for CSS vars
    const hex = primaryColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    document.documentElement.style.setProperty('--primary', primaryColor);
    document.documentElement.style.setProperty('--primary-rgb', `${r},${g},${b}`);
    // Generate lighter/darker shades
    document.documentElement.style.setProperty('--primary-light', `rgba(${r},${g},${b},0.15)`);
    document.documentElement.style.setProperty('--primary-dark', darkenColor(primaryColor, 20));
  }, [primaryColor]);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDark: () => setDarkMode(d => !d), primaryColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

function darkenColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - percent);
  const g = Math.max(0, ((num >> 8) & 0xff) - percent);
  const b = Math.max(0, (num & 0xff) - percent);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}
