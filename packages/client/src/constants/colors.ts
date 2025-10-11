export const tagColors: { [key: string]: { light: string; dark: string } } = {
  blue: {
    light: "bg-blue-100 text-blue-800",
    dark: "dark:bg-blue-900 dark:text-blue-300",
  },
  green: {
    light: "bg-green-100 text-green-800",
    dark: "dark:bg-green-900 dark:text-green-300",
  },
  yellow: {
    light: "bg-yellow-100 text-yellow-800",
    dark: "dark:bg-yellow-900 dark:text-yellow-300",
  },
  indigo: {
    light: "bg-indigo-100 text-indigo-800",
    dark: "dark:bg-indigo-900 dark:text-indigo-300",
  },
  purple: {
    light: "bg-purple-100 text-purple-800",
    dark: "dark:bg-purple-900 dark:text-purple-300",
  },
  pink: {
    light: "bg-pink-100 text-pink-800",
    dark: "dark:bg-pink-900 dark:text-pink-300",
  },
  red: {
    light: "bg-red-100 text-red-800",
    dark: "dark:bg-red-900 dark:text-red-300",
  },
  orange: {
    light: "bg-orange-100 text-orange-800",
    dark: "dark:bg-orange-900 dark:text-orange-300",
  },
  gray: {
    light: "bg-gray-200 text-gray-800",
    dark: "dark:bg-gray-700 dark:text-gray-300",
  },
  teal: {
    light: "bg-teal-100 text-teal-800",
    dark: "dark:bg-teal-900 dark:text-teal-300",
  },
  cyan: {
    light: "bg-cyan-100 text-cyan-800",
    dark: "dark:bg-cyan-900 dark:text-cyan-300",
  },
  lime: {
    light: "bg-lime-100 text-lime-800",
    dark: "dark:bg-lime-900 dark:text-lime-300",
  },
};

export const getTagColorClasses = (tag: string) => {
  const colorNames = Object.keys(tagColors).filter(color => color !== 'gray');
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colorNames.length;
  const colorName = colorNames[index];
  const colorSet = tagColors[colorName];

  if (!colorSet) {
    return `${tagColors.gray.light} ${tagColors.gray.dark}`;
  }
  return `${colorSet.light} ${colorSet.dark}`;
};