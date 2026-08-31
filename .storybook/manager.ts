import type { API_ComponentEntry } from 'storybook/internal/types';
import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';
import docTitles from './docs/titles.json';
import storyTitles from './stories/titles.json';
import { getGlobalValueFromUrl } from './utils/global';
import { dark, light } from './utils/themes';
import './global-styles.css';

const globalTheme = getGlobalValueFromUrl('theme');
const globalLocale = getGlobalValueFromUrl('storyLocale');
const isPreferDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const theme = (!globalTheme && isPreferDark) || globalTheme === 'dark' ? 'dark' : 'light';

document.documentElement.dataset.theme = theme;

addons.setConfig({
  layoutCustomisations: {
    showPanel: () => false,
    sidebar: {
      renderLabel: (options) => {
        if (globalLocale !== 'zh-CN') return options.name;

        const importPath = (options as API_ComponentEntry).importPath;
        if (!importPath) return options.name;

        const matchItem = docTitles.find((d) => d.fileName === importPath);
        if (matchItem && options.name === matchItem.title) return matchItem.titleCN;

        const storyMatch = storyTitles.find((s) => s.fileName === importPath);
        if (storyMatch && options.name === storyMatch.title) return storyMatch.titleCN;

        return options.name;
      },
    },
    theme: createManagerTheme(theme),
  },
});

function createManagerTheme(themeName: 'light' | 'dark') {
  return create({
    base: themeName === 'dark' ? 'dark' : 'light',
    brandTitle: 'jsoneo',
    brandUrl: '/jsoneo/',
    colorPrimary: '#e91e63',
    colorSecondary: '#c2185b',
  });
}

function monitorTitleChanges() {
  const observer = new MutationObserver(() => {
    const titleEl = document.querySelector('title');
    if (titleEl && titleEl.textContent?.endsWith('⋅ Storybook')) {
      titleEl.textContent = titleEl.textContent.replace('⋅ Storybook', `⋅ ${light.brandTitle}`);
    }
  });
  observer.observe(document.head, { childList: true, subtree: true });
}

monitorTitleChanges();
