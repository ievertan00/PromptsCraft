import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Theme, themes, DEFAULT_THEME } from '../constants/themes';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const storedThemeName = localStorage.getItem('app-theme');
    const storedTheme = themes.find(t => t.name === storedThemeName);
    return storedTheme || DEFAULT_THEME;
  });

  useEffect(() => {
    localStorage.setItem('app-theme', theme.name);
    // Apply theme class to body or root element
    document.documentElement.className = theme.className;
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
