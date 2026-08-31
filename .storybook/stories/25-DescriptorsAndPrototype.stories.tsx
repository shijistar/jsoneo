import { useCallback, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { Button, Switch } from 'antd';
import { parse, stringify } from '../../src';
import type { ParseOptions, StringifyOptions } from '../../src/types';
import { ResultPanel } from '../components/ResultPanel';
import { TrustedInputNotice } from '../components/TrustedInputNotice';
import { checkRoundTrip, formatValue, getTypeSummary } from '../utils/roundTrip';

const meta: Meta = {
  title: 'Core API / Descriptors & Prototype',
  // @ts-expect-error: because titleCN is an extension field
  titleCN: '核心 API / 描述符与原型',
  component: DescriptorsPrototypeStory,
  parameters: {
    docs: {
      description: {
        component:
          'Custom property descriptors (writable, enumerable, configurable, getters/setters) and prototype chain handling.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    input: {
      control: 'object',
      description: 'Input value to serialize',
      table: { category: 'Input' },
    },
    preserveDescriptors: {
      control: 'boolean',
      description: 'Whether to preserve custom property descriptors',
      table: { category: 'StringifyOptions' },
    },
  },
};

type StoryArgs = {
  input?: unknown;
  preserveDescriptors?: boolean;
};

type DescriptorsPrototypeProps = StoryArgs & { updateArgs: (patch: Partial<StoryArgs>) => void };

function DescriptorsPrototypeStory(args: DescriptorsPrototypeProps) {
  const { updateArgs } = args;
  const [serialized, setSerialized] = useState<string>('');
  const [restored, setRestored] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [roundTripResult, setRoundTripResult] = useState<{ passed: boolean; reason: string } | null>(null);

  const runSerialization = useCallback(() => {
    setError(null);
    try {
      const value = args.input;
      const stringifyOpts: StringifyOptions = {
        preserveDescriptors: args.preserveDescriptors,
      };
      const serializedResult = stringify(value, stringifyOpts);
      setSerialized(serializedResult);
      try {
        const parseOpts: ParseOptions = { prettyPrint: true };
        const restoredValue = parse(serializedResult, parseOpts);
        setRestored(restoredValue);
        const rt = checkRoundTrip(value, restoredValue);
        setRoundTripResult(rt);
      } catch (parseError) {
        setError(`Parse failed: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
        setRestored(null);
        setRoundTripResult({ passed: false, reason: 'Parse error' });
      }
    } catch (stringifyError) {
      setError(
        `Stringify failed: ${stringifyError instanceof Error ? stringifyError.message : String(stringifyError)}`,
      );
      setSerialized('');
      setRestored(null);
      setRoundTripResult(null);
    }
  }, [args.input, args.preserveDescriptors]);

  return (
    <div className="sb-story-container">
      <TrustedInputNotice variant="info" />

      <div className="sb-section">
        <h3 className="sb-section-title">Test Input</h3>
        <ResultPanel
          label={`Type: ${getTypeSummary(args.input)}`}
          copyText={formatValue(args.input)}
          onCopy={() => navigator.clipboard.writeText(formatValue(args.input))}
        >
          {formatValue(args.input)}
        </ResultPanel>
      </div>

      <div className="sb-section">
        <h3 className="sb-section-title">Stringify Options</h3>
        <div className="sb-grid">
          <label className="sb-card">
            <span style={{ marginRight: '0.5rem' }}>preserveDescriptors</span>
            <Switch
              checked={args.preserveDescriptors}
              onChange={(checked) => updateArgs({ preserveDescriptors: checked })}
            />
          </label>
        </div>
      </div>

      <div className="sb-section">
        <h3 className="sb-section-title">Actions</h3>
        <Button type="primary" onClick={runSerialization}>
          Run stringify → parse
        </Button>
      </div>

      {serialized && (
        <div className="sb-section">
          <h3 className="sb-section-title">Serialized Output (stringify)</h3>
          <ResultPanel
            label={
              <>
                Length: {serialized.length} chars
                <Button size="small" onClick={() => navigator.clipboard.writeText(serialized)}>
                  Copy
                </Button>
              </>
            }
          >
            <pre className="sb-json-output sb-expandable">{serialized}</pre>
          </ResultPanel>
        </div>
      )}

      {error && (
        <div className="sb-section">
          <h3 className="sb-section-title">Error</h3>
          <ResultPanel variant="error" label={error} />
        </div>
      )}

      {restored !== null && (
        <div className="sb-section">
          <h3 className="sb-section-title">Restored Result (parse)</h3>
          <ResultPanel
            label={
              <>
                Type: {getTypeSummary(restored)}
                {roundTripResult && (
                  <>
                    <span className={`sb-badge ${roundTripResult.passed ? 'success' : 'danger'}`}>
                      {roundTripResult.passed ? '✓ Round-trip OK' : '✗ Round-trip FAIL'}
                    </span>
                    <span className="sb-badge warning">{roundTripResult.reason}</span>
                  </>
                )}
              </>
            }
          >
            {formatValue(restored)}
          </ResultPanel>
        </div>
      )}
    </div>
  );
}

// useArgs 只能在 story render 函数（StoryContext）内调用，组件本体保持纯展示。
const renderWithArgs = (storyArgs: StoryArgs) => {
  const [args, updateArgs] = useArgs<StoryArgs>();
  return <DescriptorsPrototypeStory {...args} updateArgs={updateArgs} />;
};

export default meta;
type Story = StoryObj<typeof meta>;

export const CustomDescriptors: Story = {
  name: 'Custom Descriptors',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '自定义描述符',
  render: renderWithArgs,
  args: {
    input: (() => {
      const obj = { value: 1 };
      Object.defineProperties(obj, {
        readonly: { value: 'constant', writable: false, enumerable: true },
        nonEnumerable: { value: 'hidden', writable: true, enumerable: false },
        accessor: {
          get() {
            return this.value;
          },
          set(v: number) {
            this.value = v;
          },
          enumerable: true,
        },
      });
      return { descriptors: obj };
    })(),
    preserveDescriptors: true,
  },
};

export const DescriptorsDisabled: Story = {
  name: 'Descriptors Disabled',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '禁用描述符',
  render: renderWithArgs,
  args: {
    input: (() => {
      const obj = { value: 1 };
      Object.defineProperties(obj, {
        readonly: { value: 'constant', writable: false, enumerable: true },
        nonEnumerable: { value: 'hidden', writable: true, enumerable: false },
        accessor: {
          get() {
            return this.value;
          },
          set(v: number) {
            this.value = v;
          },
          enumerable: true,
        },
      });
      return { descriptors: obj };
    })(),
    preserveDescriptors: false,
  },
};

export const PrototypeChain: Story = {
  name: 'Prototype Chain',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '原型链',
  render: renderWithArgs,
  args: {
    input: (() => {
      const parent = {
        parentMethod() {
          return 'parent';
        },
      };
      const child = Object.create(parent);
      child.childMethod = () => 'child';
      return { prototype: child };
    })(),
    preserveDescriptors: true,
  },
};

export const MixedDescriptorsAndPrototype: Story = {
  name: 'Mixed Descriptors And Prototype',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '描述符与原型混合',
  render: renderWithArgs,
  args: {
    input: (() => {
      const obj = { value: 1 };
      Object.defineProperties(obj, {
        readonly: { value: 'constant', writable: false, enumerable: true },
        accessor: {
          get() {
            return this.value;
          },
          set(v: number) {
            this.value = v;
          },
          enumerable: true,
        },
      });
      const parent = {
        parentMethod() {
          return 'parent';
        },
      };
      const child = Object.create(parent);
      child.childMethod = () => 'child';
      return { descriptors: obj, prototype: child };
    })(),
    preserveDescriptors: true,
  },
};
