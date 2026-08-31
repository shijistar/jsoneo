import { useMemo } from 'react';
import type { DocsContainerProps } from '@storybook/addon-docs/blocks';
import type { ReactRenderer } from '@storybook/react-vite';

interface ThemedDocsContainerProps extends DocsContainerProps<ReactRenderer> {}

export const ThemedDocsContainer = ({ children }: ThemedDocsContainerProps) => {
  const className = useMemo(() => 'sb-docs-container', []);
  return <div className={className}>{children}</div>;
};
