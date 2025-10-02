import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { themes } from '../constants/themes';
import { SparklesIcon } from './icons/SparklesIcon';

interface ThemeSelectorProps {
  className?: string;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ className }) => {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedThemeName = e.target.value;
    const selectedTheme = themes.find(t => t.name === selectedThemeName);
    if (selectedTheme) {
      setTheme(selectedTheme);
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-2">
        <SparklesIcon className="w-5 h-5 text-theme-secondary" />
        <h4 className="text-sm font-semibold text-theme-secondary">Select Theme</h4>
      </div>
      <select
        id="theme-select"
        value={theme.name}
        onChange={handleThemeChange}
        className="bg-theme-tertiary text-theme-default rounded-md px-2 py-1 text-sm w-full"
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
