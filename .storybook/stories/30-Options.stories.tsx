import { useCallback, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { Button, Input, Segmented, Switch } from 'antd';
import { parse, stringify } from '../../src';
import type { ParseOptions, StringifyOptions } from '../../src/types';
import { ResultPanel } from '../components/ResultPanel';
import { TrustedInputNotice } from '../components/TrustedInputNotice';
import { checkRoundTrip, formatValue, getTypeSummary } from '../utils/roundTrip';

const meta: Meta = {
  title: 'Core API / Options',
  parameters: {
    docs: {
      description: {
        component:
          'StringifyOptions and ParseOptions demonstration. Shows how options affect serialization and deserialization behavior. Switch between presets or tune every option interactively.',
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
    startTag: {
      control: 'text',
      description: 'Start token for serialized string',
      table: { category: 'StringifyOptions' },
    },
    endTag: {
      control: 'text',
      description: 'End token for serialized string',
      table: { category: 'StringifyOptions' },
    },
    variablePrefix: {
      control: 'text',
      description: 'Prefix for generated variable names',
      table: { category: 'StringifyOptions' },
    },
    preserveClassConstructor: {
      control: 'boolean',
      description: 'Preserve class constructor code during serialization',
      table: { category: 'StringifyOptions' },
    },
    preserveDescriptors: {
      control: 'boolean',
      description: 'Preserve custom property descriptors',
      table: { category: 'StringifyOptions' },
    },
    debug: {
      control: 'boolean',
      description: 'Print debug information',
      table: { category: 'Options' },
    },
    prettyPrint: {
      control: 'boolean',
      description: 'Pretty print deserialized code',
      table: { category: 'ParseOptions' },
    },
  },
};

type OptionsArgs = {
  input: unknown;
  startTag: string;
  endTag: string;
  variablePrefix: string;
  preserveClassConstructor: boolean;
  preserveDescriptors: boolean;
  debug: boolean;
  prettyPrint: boolean;
};

// Preset data extracted verbatim from the previous five Options stories.
const OPTIONS_PRESETS: Record<string, OptionsArgs> = {
  default: {
    input: { value: 42, nested: { a: 1 } },
    startTag: '',
    endTag: '',
    variablePrefix: '',
    preserveClassConstructor: false,
    preserveDescriptors: true,
    debug: false,
    prettyPrint: true,
  },
};

const OptionsView = ({
  input,
  startTag,
  endTag,
  variablePrefix,
  preserveClassConstructor,
  preserveDescriptors,
  debug,
  prettyPrint,
  updateArgs,
}: OptionsArgs & { updateArgs: (patch: Partial<OptionsArgs>) => void }) => {
  const [originalValue, setOriginalValue] = useState<unknown>(null);
  const [serialized, setSerialized] = useState<string>('');
  const [restored, setRestored] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [roundTripResult, setRoundTripResult] = useState<{ passed: boolean; reason: string } | null>(null);

  const runSerialization = useCallback(() => {
    setError(null);
    try {
      const value = input;
      setOriginalValue(value);
      const stringifyOpts: StringifyOptions = {
        startTag: startTag || undefined,
        endTag: endTag || undefined,
        variablePrefix: variablePrefix || undefined,
        preserveClassConstructor,
        preserveDescriptors,
        debug,
      };
      const serializedResult = stringify(value, stringifyOpts);
      setSerialized(serializedResult);
      try {
        const parseOpts: ParseOptions = {
          prettyPrint,
          debug,
        };
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
  }, [input, startTag, endTag, variablePrefix, preserveClassConstructor, preserveDescriptors, debug, prettyPrint]);

  return (
    <div className="sb-story-container">
      <TrustedInputNotice variant="info" />

      <div className="sb-section">
        <h3 className="sb-section-title">Test Input</h3>
        <ResultPanel
          label={`Type: ${getTypeSummary(input)}`}
          copyText={formatValue(input)}
          onCopy={() => navigator.clipboard.writeText(formatValue(input))}
        >
          {formatValue(input)}
        </ResultPanel>
      </div>

      <div className="sb-section">
        <h3 className="sb-section-title">Stringify Options</h3>
        <div className="sb-grid">
          <div className="sb-card">
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>startTag</label>
            <Input
              value={startTag}
              onChange={(e) => updateArgs({ startTag: e.target.value })}
              placeholder="\$SJS\$_"
              allowClear
            />
          </div>
          <div className="sb-card">
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>endTag</label>
            <Input
              value={endTag}
              onChange={(e) => updateArgs({ endTag: e.target.value })}
              placeholder="_\$SJE\$"
              allowClear
            />
          </div>
          <div className="sb-card">
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>variablePrefix</label>
            <Input
              value={variablePrefix}
              onChange={(e) => updateArgs({ variablePrefix: e.target.value })}
              placeholder="\$SJV\$_"
              allowClear
            />
          </div>
        </div>
        <div className="sb-grid" style={{ marginTop: '0.5rem' }}>
          <label className="sb-card">
            <span style={{ marginRight: '0.5rem' }}>preserveClassConstructor</span>
            <Switch
              checked={preserveClassConstructor}
              onChange={(checked) => updateArgs({ preserveClassConstructor: checked })}
            />
          </label>
          <label className="sb-card">
            <span style={{ marginRight: '0.5rem' }}>preserveDescriptors</span>
            <Switch
              checked={preserveDescriptors}
              onChange={(checked) => updateArgs({ preserveDescriptors: checked })}
            />
          </label>
          <label className="sb-card">
            <span style={{ marginRight: '0.5rem' }}>debug</span>
            <Switch checked={debug} onChange={(checked) => updateArgs({ debug: checked })} />
          </label>
        </div>
      </div>

      <div className="sb-section">
        <h3 className="sb-section-title">Parse Options</h3>
        <div className="sb-grid">
          <label className="sb-card">
            <span style={{ marginRight: '0.5rem' }}>prettyPrint</span>
            <Switch checked={prettyPrint} onChange={(checked) => updateArgs({ prettyPrint: checked })} />
          </label>
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
const renderOptions = () => {
  const [args, updateArgs] = useArgs<OptionsArgs>();
  return <OptionsView {...args} updateArgs={updateArgs} />;
};

export default {
  ...meta,
  component: OptionsView,
} as Meta;
type Story = StoryObj<typeof meta>;

export const Options: Story = {
  args: OPTIONS_PRESETS.default,
  render: renderOptions,
};
