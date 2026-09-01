import type { Meta, StoryObj } from '@storybook/react-vite';
import { RoundTripDemo } from '../components/RoundTripDemo';
import { storyI18n } from '../locales';

const meta: Meta = {
  title: 'Core API / Primitive Values',
  // @ts-expect-error: because titleCN is an extension field
  titleCN: '核心 API / 原始值',
  component: RoundTripDemo,
  parameters: {
    docs: {
      description: {
        component: storyI18n.t('story.meta.primitiveValues'),
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

const basePrimitive = {
  string: 'hello world',
  number: 42,
  boolean: true,
  null: null,
  array: [1, 'two', true, null],
  object: { a: 1, b: 'two', c: [true, false], nested: { x: 100 } },
};

export const AllPrimitives: Story = {
  name: 'All Primitives',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '全部原始值',
  args: { input: basePrimitive },
};

export const SimpleString: Story = {
  name: 'Simple String',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '简单字符串',
  args: { input: 'simple string' },
};

export const SimpleNumber: Story = {
  name: 'Simple Number',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '简单数字',
  args: { input: 123.456 },
};

export const SimpleBoolean: Story = {
  name: 'Simple Boolean',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '简单布尔',
  args: { input: true },
};

export const SimpleArray: Story = {
  name: 'Simple Array',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '简单数组',
  args: { input: [1, 2, 3, 'four', true, null] },
};

export const NestedObject: Story = {
  name: 'Nested Object',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '嵌套对象',
  args: { input: { level1: { level2: { level3: 'deep' } }, array: [{ a: 1 }, { b: 2 }] } },
};
