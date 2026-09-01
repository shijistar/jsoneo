import type { Meta, StoryObj } from '@storybook/react-vite';
import { RoundTripDemo } from '../components/RoundTripDemo';
import { storyI18n } from '../locales';

const meta: Meta = {
  title: 'Core API / Special Values',
  // @ts-expect-error: because titleCN is an extension field
  titleCN: '核心 API / 特殊值',
  component: RoundTripDemo,
  parameters: {
    docs: {
      description: {
        component: storyI18n.t('story.meta.specialValues'),
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

export const UndefinedValue: Story = {
  name: 'Undefined Value',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: 'Undefined 值',
  args: { input: { value: undefined } },
};

export const NaNValue: Story = {
  name: 'NaN Value',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: 'NaN 值',
  args: { input: { value: NaN } },
};

export const PositiveInfinity: Story = {
  name: 'Positive Infinity',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '正无穷大',
  args: { input: { value: Infinity } },
};

export const NegativeInfinity: Story = {
  name: 'Negative Infinity',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '负无穷大',
  args: { input: { value: -Infinity } },
};

export const NegativeZero: Story = {
  name: 'Negative Zero',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '负零',
  args: { input: { value: -0 } },
};

export const BigIntValue: Story = {
  name: 'BigInt Value',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: 'BigInt 值',
  args: { input: { value: 9007199254740991n } },
};

export const MixedSpecialValues: Story = {
  name: 'Mixed Special Values',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '混合特殊值',
  args: {
    input: {
      undefined: undefined,
      NaN: NaN,
      Infinity: Infinity,
      negativeInfinity: -Infinity,
      negativeZero: -0,
      bigInt: 12345678901234567890n,
    },
  },
};
