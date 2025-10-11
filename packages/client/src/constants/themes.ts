export interface Theme {
  name: string;
  className: string;
}

export const themes: Theme[] = [
  {
    name: 'Light',
    className: 'theme-light',
  },
  {
    name: 'Dark',
    className: 'theme-dark',
  },
  {
    name: 'Google Code Light',
    className: 'theme-google-code-light',
  },
  {
    name: 'GitHub Light',
    className: 'theme-github-light',
  },
  {
    name: 'GitHub Dark',
    className: 'theme-github-dark',
  },
];

export const DEFAULT_THEME = themes[1]; // Dark theme as default
