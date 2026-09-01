import type { Meta, StoryObj } from '@storybook/react-vite';
import { RoundTripDemo } from '../components/RoundTripDemo';
import { storyI18n } from '../locales';

const meta: Meta = {
  title: 'Core API / Binary Values',
  // @ts-expect-error: because titleCN is an extension field
  titleCN: '核心 API / 二进制值',
  component: RoundTripDemo,
  parameters: {
    docs: {
      description: {
        component: storyI18n.t('story.meta.binaryValues'),
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

export const Uint8ArrayValue: Story = {
  name: 'Uint8Array Value',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: 'Uint8Array 值',
  args: { input: { data: new Uint8Array([1, 2, 3, 4, 5]) } },
};

export const Int8ArrayValue: Story = {
  name: 'Int8Array Value',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: 'Int8Array 值',
  args: { input: { data: new Int8Array([-1, 2, -3, 4]) } },
};

export const Int16ArrayValue: Story = {
  name: 'Int16Array Value',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: 'Int16Array 值',
  args: { input: { data: new Int16Array([-1234, 2345, -3456]) } },
};

export const Int32ArrayValue: Story = {
  name: 'Int32Array Value',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: 'Int32Array 值',
  args: { input: { data: new Int32Array([-123456, 234567]) } },
};

export const Float32ArrayValue: Story = {
  name: 'Float32Array Value',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: 'Float32Array 值',
  args: { input: { data: new Float32Array([1.5, -2.25, 3.14159]) } },
};

export const Float64ArrayValue: Story = {
  name: 'Float64Array Value',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: 'Float64Array 值',
  args: { input: { data: new Float64Array([Math.PI, -Math.E, 2.71828]) } },
};

export const BigInt64ArrayValue: Story = {
  name: 'BigInt64Array Value',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: 'BigInt64Array 值',
  args: { input: { data: new BigInt64Array([-1n, 2n, -3n]) } },
};

export const BigUint64ArrayValue: Story = {
  name: 'BigUint64Array Value',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: 'BigUint64Array 值',
  args: { input: { data: new BigUint64Array([1n, 2n, 3n]) } },
};

export const ArrayBufferValue: Story = {
  name: 'ArrayBuffer Value',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: 'ArrayBuffer 值',
  args: { input: { buffer: new ArrayBuffer(16) } },
};

export const DataViewValue: Story = {
  name: 'DataView Value',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: 'DataView 值',
  args: { input: { view: new DataView(new ArrayBuffer(8)) } },
};

export const MixedBinaryValues: Story = {
  name: 'Mixed Binary Values',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '混合二进制值',
  args: {
    input: {
      uint8: new Uint8Array([1, 2, 3, 4]),
      int8: new Int8Array([-1, 2]),
      int16: new Int16Array([-1234, 2345]),
      int32: new Int32Array([-123456, 234567]),
      float32: new Float32Array([1.5, -2.25]),
      float64: new Float64Array([Math.PI, -Math.E]),
      bigInt64: new BigInt64Array([-1n, 2n]),
      bigUint64: new BigUint64Array([1n, 2n]),
      buffer: new ArrayBuffer(8),
      view: new DataView(new ArrayBuffer(8)),
    },
  },
};
