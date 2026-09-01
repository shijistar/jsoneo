import type { Meta, StoryObj } from '@storybook/react-vite';
import { RoundTripDemo } from '../components/RoundTripDemo';
import { storyI18n } from '../locales';

const meta: Meta = {
  title: 'Core API / Built-ins & Collections',
  // @ts-expect-error: because titleCN is an extension field
  titleCN: '核心 API / 内置与集合',
  component: RoundTripDemo,
  parameters: {
    docs: {
      description: {
        component: storyI18n.t('story.meta.builtinsCollections'),
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    input: {
      control: 'object',
      description: storyI18n.t('story.argTypes.input'),
      table: { category: 'Input' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const DateValue: Story = {
  name: 'Date Value',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: 'Date 值',
  args: { input: { date: new Date('2026-01-01T00:00:00.000Z') } },
};

export const RegExpValue: Story = {
  name: 'RegExp Value',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: 'RegExp 值',
  args: { input: { regexp: /abc/gi } },
};

export const URLValue: Story = {
  name: 'URL Value',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: 'URL 值',
  args: { input: { url: new URL('https://example.com?id=123') } },
};

export const URLSearchParamsValue: Story = {
  name: 'URLSearchParams Value',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: 'URLSearchParams 值',
  args: { input: { params: new URLSearchParams('id=123&tab=profile') } },
};

export const MapValue: Story = {
  name: 'Map Value',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: 'Map 值',
  args: {
    input: {
      map: new Map<string, unknown>([
        ['key1', 'value1'],
        ['key2', { nested: true }],
      ]),
    },
  },
};

export const SetValue: Story = {
  name: 'Set Value',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: 'Set 值',
  args: { input: { set: new Set(['a', 'b', 'c']) } },
};

export const MixedCollections: Story = {
  name: 'Mixed Collections',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '混合集合',
  args: {
    input: {
      date: new Date('2026-01-01T00:00:00.000Z'),
      regexp: /abc/gi,
      url: new URL('https://example.com?id=123'),
      params: new URLSearchParams('id=123&tab=profile'),
      map: new Map<string, unknown>([
        ['key1', 'value1'],
        ['key2', { nested: true }],
      ]),
      set: new Set(['a', 'b', 'c']),
    },
  },
};
