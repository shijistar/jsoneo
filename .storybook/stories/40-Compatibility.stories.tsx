import type { Meta, StoryObj } from '@storybook/react-vite';
import { ResultPanel } from '../components/ResultPanel';
import { RoundTripDemo } from '../components/RoundTripDemo';
import { storyI18n, useStoryT } from '../locales';

const meta: Meta = {
  title: 'Compatibility / Runtime Environments',
  // @ts-expect-error: because titleCN is an extension field
  titleCN: '兼容性 / 运行时环境',
  component: RoundTripDemo,
  parameters: {
    docs: {
      description: {
        component: storyI18n.t('story.meta.compatibility'),
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

function RuntimeEnvironmentPanel() {
  const t = useStoryT();
  const isNode = typeof process !== 'undefined' && process.versions?.node;
  const hasBuffer = typeof Buffer !== 'undefined' && Buffer.isBuffer;
  const hasBigIntTypedArrays = typeof BigInt64Array !== 'undefined';
  const envText = JSON.stringify({ isNode, hasBuffer, hasBigIntTypedArrays }, null, 2);

  return (
    <div className="sb-section">
      <h3 className="sb-section-title">{t('story.compatibility.runtimeEnvironment')}</h3>
      <ResultPanel
        label={t('story.compatibility.environmentDetection')}
        copyText={envText}
        onCopy={() => navigator.clipboard.writeText(envText)}
      >
        <pre className="sb-json-output">{envText}</pre>
      </ResultPanel>
    </div>
  );
}

export default meta;
type Story = StoryObj<typeof meta>;

export const BufferSupport: Story = {
  name: 'Buffer Support',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: 'Buffer 支持',
  args: {
    input: (() => {
      if (typeof Buffer !== 'undefined') {
        return { buffer: Buffer.from('hello world') };
      }
      return { buffer: new Uint8Array([104, 101, 108, 108, 111]) };
    })(),
  },
  render: (args) => <RoundTripDemo input={args.input} beforeInput={<RuntimeEnvironmentPanel />} />,
};

export const BigIntTypedArrays: Story = {
  name: 'BigInt Typed Arrays',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: 'BigInt 类型化数组',
  args: {
    input: {
      bigInt64: new BigInt64Array([-1n, 2n, -3n]),
      bigUint64: new BigUint64Array([1n, 2n, 3n]),
    },
  },
  render: (args) => <RoundTripDemo input={args.input} beforeInput={<RuntimeEnvironmentPanel />} />,
};

export const CrossEnvironmentObject: Story = {
  name: 'Cross Environment Object',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '跨环境对象',
  args: {
    input: {
      string: 'test',
      number: 42,
      date: new Date('2026-01-01T00:00:00.000Z'),
      regexp: /test/gi,
      map: new Map([['key', 'value']]),
      set: new Set(['a', 'b']),
      typedArray: new Uint8Array([1, 2, 3]),
      arrayBuffer: new ArrayBuffer(8),
      dataView: new DataView(new ArrayBuffer(8)),
    },
  },
  render: (args) => <RoundTripDemo input={args.input} beforeInput={<RuntimeEnvironmentPanel />} />,
};

export const SymbolSupport: Story = {
  name: 'Symbol Support',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: 'Symbol 支持',
  args: {
    input: {
      globalSymbol: Symbol.for('global.key'),
      localSymbol: Symbol('local'),
      wellKnownSymbol: Symbol.iterator,
      symbolKeyed: {
        [Symbol.for('metadata')]: 'value',
      },
    },
  },
  render: (args) => <RoundTripDemo input={args.input} beforeInput={<RuntimeEnvironmentPanel />} />,
};

export const ErrorObject: Story = {
  name: 'Error Object',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: 'Error 对象',
  args: {
    input: {
      error: new Error('Test error'),
      typeError: new TypeError('Type error'),
      rangeError: new RangeError('Range error'),
    },
  },
  render: (args) => <RoundTripDemo input={args.input} beforeInput={<RuntimeEnvironmentPanel />} />,
};

export const IterablesAndGenerators: Story = {
  name: 'Iterables And Generators',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '可迭代与生成器',
  args: {
    input: {
      // generator: (function* () {
      //   yield 1;
      //   yield 2;
      // })(),
      iterable: {
        *[Symbol.iterator]() {
          yield 'a';
          yield 'b';
        },
      },
    },
  },
  render: (args) => <RoundTripDemo input={args.input} beforeInput={<RuntimeEnvironmentPanel />} />,
};
