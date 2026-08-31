import type { PropsWithChildren } from 'react';
import { lazy, Suspense } from 'react';
import type { DocsContainerProps } from '@storybook/addon-docs/blocks';
import type { Preview, ReactRenderer } from '@storybook/react-vite';
import './global-styles.css';
import './story-styles.css';

// @ts-expect-error: lazy loaded component
const ThemedDocsContainer = lazy(() => import('./components/StorybookDocsContainer'));

const preview: Preview = {
  initialGlobals: {
    locale: '',
  },
  globalTypes: {
    locale: {
      description: 'Internationalization locale',
      toolbar: {
        icon: 'globe',
        items: [
          { value: 'en-US', title: 'English (US)', right: '🇺🇸' },
          { value: 'zh-CN', title: '简体中文', right: '🇨🇳' },
        ],
      },
    },
  },
  parameters: {
    layout: 'fullscreen',
    controls: {
      expanded: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: { disable: true },
    docs: {
      container: (props: PropsWithChildren<DocsContainerProps<ReactRenderer>>) => (
        <Suspense fallback={null}>
          <ThemedDocsContainer {...props} />
        </Suspense>
      ),
    },
  },
  decorators: [],
};

export default preview;
