import type { PropsWithChildren } from 'react';
import { useMemo } from 'react';
import { DocsContainer, type DocsContainerProps } from '@storybook/addon-docs/blocks';
import type { ReactRenderer } from '@storybook/react-vite';

interface ThemedDocsContainerProps extends DocsContainerProps<ReactRenderer> {}

export const ThemedDocsContainer = (props: PropsWithChildren<ThemedDocsContainerProps>) => {
  const className = useMemo(() => 'sb-docs-container', []);
  return (
    <div className={className}>
      <DocsContainer {...props}>{props.children}</DocsContainer>
    </div>
  );
};

export default ThemedDocsContainer;
