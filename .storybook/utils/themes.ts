import { themes, type ThemeVars } from 'storybook/theming';

export const light: ThemeVars = {
  ...themes.light,
  base: 'light',
  brandTitle: 'jsoneo',
  brandUrl: '/jsoneo/',
  colorPrimary: '#e91e63',
  colorSecondary: '#c2185b',
  appBg: '#ffffff',
  appContentBg: '#ffffff',
  appBorderColor: '#e0e0e0',
  appBorderRadius: 4,
  textColor: '#212121',
  textInverseColor: '#ffffff',
  textMutedColor: '#757575',
  barTextColor: '#212121',
  barSelectedColor: '#e91e63',
  barBg: '#fafafa',
  inputBg: '#ffffff',
  inputBorder: '#e0e0e0',
  inputTextColor: '#212121',
  inputBorderRadius: 4,
};

export const dark: ThemeVars = {
  ...themes.dark,
  base: 'dark',
  appBg: '#121212',
  appContentBg: '#1e1e1e',
  appBorderColor: '#333333',
  textColor: '#ffffff',
  textInverseColor: '#000000',
  textMutedColor: '#bdbdbd',
  barTextColor: '#ffffff',
  barSelectedColor: '#f06292',
  barBg: '#1e1e1e',
  inputBg: '#1e1e1e',
  inputBorder: '#333333',
  inputTextColor: '#ffffff',
};

export function getThemeKey(themeName: 'light' | 'dark'): 'light' | 'dark' {
  return themeName;
}
