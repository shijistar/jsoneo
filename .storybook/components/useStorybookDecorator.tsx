import { lazy, Suspense, useEffect } from 'react';
import type { ReactRenderer } from '@storybook/react-vite';
import type { StoryContext } from 'storybook/internal/csf';
import darkAlgorithm from 'antd/es/theme/themes/dark';
import defaultAlgorithm from 'antd/es/theme/themes/default';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import { storyI18n } from '../locales';
import { dark, getThemeKey, light } from '../utils/themes';

const AppLazy = lazy(() => import('antd/es/app'));
const ConfigProviderLazy = lazy(() => import('antd/es/config-provider'));

/**
 * jsoneo story decorator: keeps the manager theme in sync and reloads the iframe when the locale
 * toolbar is toggled, so docs/stories pick up the new language without stale i18next state.
 */
function useStorybookDecorator(Story: React.ComponentType, context: StoryContext<ReactRenderer>) {
  const localeKey = context.globals.storyLocale === 'zh-CN' ? 'zh-CN' : 'en-US';
  const locale = localeKey === 'zh-CN' ? zhCN : enUS;
  const themeKey = getThemeKey(context.globals.theme);
  const isDark = themeKey === 'dark';
  const themeName = isDark ? 'dark' : 'light';

  useEffect(() => {
    if (storyI18n.language !== localeKey) {
      void storyI18n.changeLanguage(localeKey).then(() => {
        (window.top ?? window.parent ?? window).location.reload();
      });
    }
  }, [localeKey]);

  return (
    <Suspense fallback={null}>
      <ConfigProviderLazy
        locale={locale}
        theme={{
          algorithm: isDark ? darkAlgorithm : defaultAlgorithm,
          token: {
            colorPrimary: isDark ? dark.colorPrimary : light.colorPrimary,
            fontSize: 16,
            fontFamily: 'SF Pro Display, Segoe UI, PingFang SC, Helvetica Neue, Arial, sans-serif',
          },
        }}
      >
        <AppLazy>
          <Story />
        </AppLazy>
      </ConfigProviderLazy>
    </Suspense>
  );
}

export { useStorybookDecorator };
export default useStorybookDecorator;
