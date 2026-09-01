import type { Meta, StoryObj } from '@storybook/react-vite';
import { RoundTripDemo } from '../components/RoundTripDemo';
import { storyI18n } from '../locales';

const meta: Meta = {
  title: 'Core API / Circular References',
  // @ts-expect-error: because titleCN is an extension field
  titleCN: '核心 API / 循环引用',
  component: RoundTripDemo,
  parameters: {
    docs: {
      description: {
        component: storyI18n.t('story.meta.circularReferences'),
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

export const SimpleCircular: Story = {
  name: 'Simple Circular',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '简单循环',
  args: {
    input: (() => {
      const circular: any = { name: 'circular', value: 42 };
      circular.self = circular;
      circular.ref = circular;
      return circular;
    })(),
  },
};

export const CircularArray: Story = {
  name: 'Circular Array',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '循环数组',
  args: {
    input: (() => {
      const arr: any = [1, 2, 3];
      arr.push({ ref: arr });
      return arr;
    })(),
  },
};

export const CircularObjectGraph: Story = {
  name: 'Circular Object Graph',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '循环对象图',
  args: {
    input: (() => {
      const a: any = { name: 'a' };
      const b: any = { name: 'b', ref: a };
      a.ref = b;
      return { a, b };
    })(),
  },
};

export const DeepCircular: Story = {
  name: 'Deep Circular',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '深层循环',
  args: {
    input: (() => {
      const root: any = { level: 0 };
      let current = root;
      for (let i = 1; i <= 5; i++) {
        current.next = { level: i, parent: current };
        current = current.next;
      }
      current.next = root;
      return root;
    })(),
  },
};
