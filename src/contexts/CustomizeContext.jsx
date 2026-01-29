import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCustomColors, saveCustomColors, resetColors as resetColorsLib, getDefaultColors } from '../lib/customization';
import { useTheme } from './ThemeContext';

const CustomizeContext = createContext(null);

export function CustomizeProvider({ children }) {
  const [customColors, setCustomColorsState] = useState({});
  const { theme } = useTheme();

  // Load custom colors on mount
  useEffect(() => {
    const colors = getCustomColors();
    setCustomColorsState(colors);
  }, []);

  // Apply custom colors to CSS variables
  useEffect(() => {
    if (!theme) return;

    const themeColors = customColors[theme];
    if (!themeColors) {
      // Remove custom styles if no customization for this theme
      const existingStyle = document.getElementById('custom-theme-colors');
      if (existingStyle) {
        existingStyle.remove();
      }
      return;
    }

    // Create or update style tag
    let styleTag = document.getElementById('custom-theme-colors');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'custom-theme-colors';
      document.head.appendChild(styleTag);
    }

    // Generate CSS for current theme
    const cssVariables = Object.entries(themeColors)
      .map(([key, value]) => `    --${key}: ${value};`)
      .join('\n');

    styleTag.textContent = `
  :root[data-theme="${theme}"] {
${cssVariables}
  }
`;
  }, [customColors, theme]);

  const setCustomColors = (colors) => {
    setCustomColorsState(colors);
    saveCustomColors(colors);
  };

  const resetThemeColors = (themeName) => {
    resetColorsLib(themeName);
    const colors = getCustomColors();
    setCustomColorsState(colors);
  };

  const resetAllColors = () => {
    resetColorsLib();
    setCustomColorsState({});
  };

  const getThemeColors = (themeName) => {
    return customColors[themeName] || getDefaultColors(themeName);
  };

  return (
    <CustomizeContext.Provider
      value={{
        customColors,
        setCustomColors,
        resetThemeColors,
        resetAllColors,
        getThemeColors
      }}
    >
      {children}
    </CustomizeContext.Provider>
  );
}

export function useCustomize() {
  const context = useContext(CustomizeContext);
  if (!context) {
    throw new Error('useCustomize must be used within a CustomizeProvider');
  }
  return context;
}
