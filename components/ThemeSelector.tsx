import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { themes } from '../constants/themes';

const ThemeSelector: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedThemeName = e.target.value;
    const selectedTheme = themes.find(t => t.name === selectedThemeName);
    if (selectedTheme) {
      setTheme(selectedTheme);
    }
  };

  return (
    <div className="p-4 border-t border-theme-default mt-auto">
      <label htmlFor="theme-select" className="block text-sm font-medium text-theme-secondary mb-2">Select Theme:</label>
      <select
        id="theme-select"
        value={theme.name}
        onChange={handleThemeChange}
        className="block w-full pl-3 pr-10 py-2 text-base bg-theme-secondary border border-theme-default focus:outline-none focus:ring-theme-primary-light focus:border-theme-primary-light sm:text-sm rounded-md"
      >
        {themes.map((t) => (
          <option key={t.name} value={t.name}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ThemeSelector;
