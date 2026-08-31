import { useEffect } from 'react';
import type { ReactRenderer } from '@storybook/react-vite';
import type { StoryContext } from 'storybook/internal/csf';
import { storyI18n } from '../locales';

/**
 * jsoneo story decorator: keeps the manager theme in sync and reloads the iframe when the locale
 * toolbar is toggled, so docs/stories pick up the new language without stale i18next state.
 */
function useStorybookDecorator(Story: React.ComponentType, context: StoryContext<ReactRenderer>) {
  const localeKey = context.globals.storyLocale === 'zh-CN' ? 'zh-CN' : 'en-US';

  useEffect(() => {
    if (storyI18n.language !== localeKey) {
      void storyI18n.changeLanguage(localeKey).then(() => {
        (window.top ?? window.parent ?? window).location.reload();
      });
    }
  }, [localeKey]);

  return <Story />;
}

export { useStorybookDecorator };
export default useStorybookDecorator;
