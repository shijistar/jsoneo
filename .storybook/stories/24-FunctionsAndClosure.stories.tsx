import { useCallback, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { Button, Select } from 'antd';
import { parse, stringify } from '../../src';
import type { ParseOptions, StringifyOptions } from '../../src/types';
import { ResultPanel } from '../components/ResultPanel';
import { TrustedInputNotice } from '../components/TrustedInputNotice';
import { checkRoundTrip, formatValue, getTypeSummary } from '../utils/roundTrip';

const meta: Meta = {
  title: '24 Core API / Functions & Closure',
  parameters: {
    docs: {
      description: {
        component:
          'Function serialization and deserialization. Function bodies are preserved but lexical closures are NOT captured automatically. Use the `closure` option to provide external variables.',
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
    closure: {
      control: 'select',
      options: ['', 'allowedRoles'],
      description: 'Select a predefined trusted closure fixture for parse',
      table: { category: 'ParseOptions' },
    },
  },
};

type StoryArgs = {
  input: unknown;
  closure: string;
};

type FunctionsClosureProps = StoryArgs & { updateArgs: (patch: Partial<StoryArgs>) => void };

const FunctionsClosureStory = (args: FunctionsClosureProps) => {
  const { updateArgs } = args;
  const [originalValue, setOriginalValue] = useState<unknown>(null);
  const [serialized, setSerialized] = useState<string>('');
  const [restored, setRestored] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [roundTripResult, setRoundTripResult] = useState<{ passed: boolean; reason: string } | null>(null);

  const runSerialization = useCallback(() => {
    setError(null);
    try {
      const value = args.input;
      setOriginalValue(value);
      const stringifyOpts: StringifyOptions = {};
      const serializedResult = stringify(value, stringifyOpts);
      setSerialized(serializedResult);
      try {
        const closureObj: Record<string, unknown> | undefined =
          args.closure === 'allowedRoles' ? { allowedRoles: ['admin', 'editor'] } : undefined;
        const parseOpts: ParseOptions = { closure: closureObj, prettyPrint: true };
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
  }, [args.input, args.closure]);

  return (
    <div className="sb-story-container">
      <TrustedInputNotice variant="warning" />

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
        <h3 className="sb-section-title">Parse Options</h3>
        <div className="sb-card">
          <div style={{ fontSize: '0.875rem' }}>
            Closure fixture:
            <Select
              value={args.closure}
              onChange={(next) => updateArgs({ closure: next })}
              options={[
                { value: '', label: 'none' },
                { value: 'allowedRoles', label: 'allowedRoles = [admin, editor]' },
              ]}
              style={{ width: 260, marginLeft: '0.5rem' }}
            />
            <p style={{ margin: '0.5rem 0 0', color: 'var(--storybook-text-muted)' }}>
              Only predefined trusted closure fixtures are available; arbitrary closure input is intentionally
              unavailable.
            </p>
          </div>
        </div>
      </div>

      <div className="sb-section">
        <h3 className="sb-section-title">Actions</h3>
        <Button type="primary" onClick={runSerialization}>
          Run stringify → parse
        </Button>
      </div>

      {originalValue !== null && (
        <div className="sb-section">
          <h3 className="sb-section-title">Original Input</h3>
          <ResultPanel
            label={`Type: ${getTypeSummary(originalValue)}`}
            copyText={formatValue(originalValue)}
            onCopy={() => navigator.clipboard.writeText(formatValue(originalValue))}
          >
            {formatValue(originalValue)}
          </ResultPanel>
        </div>
      )}

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
};

// useArgs 只能在 story render 函数（StoryContext）内调用，组件本体保持纯展示。
const renderWithArgs = (storyArgs: StoryArgs) => {
  const [args, updateArgs] = useArgs<StoryArgs>();
  return <FunctionsClosureStory {...args} updateArgs={updateArgs} />;
};

export default {
  ...meta,
  component: FunctionsClosureStory,
} as Meta;
type Story = StoryObj<typeof meta>;

export const RegularFunction: Story = {
  render: renderWithArgs,
  args: {
    input: {
      regularFunction: function greet(name: string) {
        return `Hello, ${name}!`;
      },
    },
    closure: '',
  },
};

export const ArrowFunction: Story = {
  render: renderWithArgs,
  args: {
    input: {
      arrowFunction: (x: number) => x * 2,
    },
    closure: '',
  },
};

export const AsyncFunction: Story = {
  render: renderWithArgs,
  args: {
    input: {
      asyncFunction: async () => {
        await Promise.resolve();
        return 'done';
      },
    },
    closure: '',
  },
};

export const GeneratorFunction: Story = {
  render: renderWithArgs,
  args: {
    input: {
      generatorFunction: function* numbers() {
        yield 1;
        yield 2;
      },
    },
    closure: '',
  },
};

export const MethodObject: Story = {
  render: renderWithArgs,
  args: {
    input: {
      method: {
        value: 10,
        increment() {
          return ++this.value;
        },
      },
    },
    closure: '',
  },
};

export const FunctionWithClosure: Story = {
  render: renderWithArgs,
  args: {
    input: (() => {
      function canRead(user: { role: string }) {
        // Uses external `allowedRoles` - must be provided via closure option
        return (canRead as any).allowedRoles?.includes(user.role) ?? false;
      }
      return { canRead };
    })(),
    closure: JSON.stringify({ allowedRoles: ['admin', 'editor'] }, null, 2),
  },
};

export const FunctionWithAttachedProperties: Story = {
  render: renderWithArgs,
  args: {
    input: (() => {
      function getConfig() {
        return (getConfig as any).defaults;
      }
      return { getConfig };
    })(),
    closure: '',
  },
};

export const MixedFunctions: Story = {
  render: renderWithArgs,
  args: {
    input: {
      regular: function add(a: number, b: number) {
        return a + b;
      },
      arrow: (x: number) => x * 2,
      async: async () => 'async result',
      generator: function* gen() {
        yield 1;
        yield 2;
      },
      method: {
        count: 0,
        increment() {
          return ++this.count;
        },
      },
    },
    closure: '',
  },
};
