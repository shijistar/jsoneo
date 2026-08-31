import { useCallback, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { Button, Select, Switch } from 'antd';
import { parse, stringify } from '../../src';
import type { ParseOptions, StringifyOptions } from '../../src/types';
import { ResultPanel } from '../components/ResultPanel';
import { TrustedInputNotice } from '../components/TrustedInputNotice';
import { checkRoundTrip, formatValue, getTypeSummary } from '../utils/roundTrip';
import { createFixture, FIXTURE_LABELS, FIXTURE_TYPES } from './shared/fixtures';

const meta: Meta = {
  title: '10 Workbench / Playground',
  parameters: {
    docs: {
      description: {
        component:
          'Interactive playground for `jsoneo.stringify()` and `jsoneo.parse()`. Select a fixture or use the custom value to see real serialization and round-trip results.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    fixture: {
      control: 'select',
      options: FIXTURE_TYPES,
      description: 'Predefined fixture to serialize/parse',
      table: {
        category: 'Input',
      },
    },
    preserveDescriptors: {
      control: 'boolean',
      description: 'Whether to preserve custom property descriptors',
      table: {
        category: 'StringifyOptions',
      },
    },
    debug: {
      control: 'boolean',
      description: 'Print debug information during serialization/deserialization',
      table: {
        category: 'Options',
      },
    },
    closure: {
      control: 'select',
      options: ['', 'allowedRoles'],
      description: 'Select a predefined trusted closure fixture for parse',
      table: {
        category: 'ParseOptions',
      },
    },
  },
};

const FIXTURE_OPTIONS = FIXTURE_TYPES.map((type) => ({ value: type, label: type }));
const CLOSURE_OPTIONS = [
  { value: '', label: 'none' },
  { value: 'allowedRoles', label: 'allowedRoles = [admin, editor]' },
];

type WorkbenchArgs = {
  fixture: string;
  preserveDescriptors: boolean;
  debug: boolean;
  closure: string;
};

const WorkbenchView = ({
  fixture,
  preserveDescriptors,
  debug,
  closure,
  updateArgs,
}: WorkbenchArgs & { updateArgs: (patch: Partial<WorkbenchArgs>) => void }) => {
  const [originalValue, setOriginalValue] = useState<unknown>(null);
  const [serialized, setSerialized] = useState<string>('');
  const [restored, setRestored] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [roundTripResult, setRoundTripResult] = useState<{ passed: boolean; reason: string } | null>(null);

  const runSerialization = useCallback(() => {
    setError(null);
    try {
      const value = createFixture(fixture);
      setOriginalValue(value);
      const stringifyOpts: StringifyOptions = {
        preserveDescriptors,
        debug,
      };
      const serializedResult = stringify(value, stringifyOpts);
      setSerialized(serializedResult);
      try {
        const closureObj: Record<string, unknown> | undefined =
          closure === 'allowedRoles' ? { allowedRoles: ['admin', 'editor'] } : undefined;
        const parseOpts: ParseOptions = {
          closure: closureObj,
          debug,
          prettyPrint: true,
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
  }, [fixture, preserveDescriptors, debug, closure]);

  return (
    <div className="sb-story-container">
      <TrustedInputNotice />

      <div className="sb-section">
        <h3 className="sb-section-title">Fixture Selection</h3>
        <div className="sb-grid">
          <div className="sb-card">
            <div className="sb-card-title">Input Fixture</div>
            <Select
              value={fixture}
              onChange={(next) => updateArgs({ fixture: next })}
              options={FIXTURE_OPTIONS}
              style={{ width: '100%' }}
            />
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: 'var(--storybook-text-muted)' }}>
              {FIXTURE_LABELS[fixture]}
            </p>
          </div>
        </div>
      </div>

      <div className="sb-section">
        <h3 className="sb-section-title">Stringify Options</h3>
        <div className="sb-grid">
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
        <div className="sb-card">
          <div style={{ fontSize: '0.875rem' }}>
            Closure fixture:
            <Select
              value={closure}
              onChange={(next) => updateArgs({ closure: next })}
              options={CLOSURE_OPTIONS}
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
const renderWorkbench = () => {
  const [args, updateArgs] = useArgs<WorkbenchArgs>();
  return <WorkbenchView {...args} updateArgs={updateArgs} />;
};

export default {
  ...meta,
  component: WorkbenchView,
} as Meta;
type Story = StoryObj<typeof meta>;

export const Workbench: Story = {
  args: {
    fixture: 'primitives',
    preserveDescriptors: true,
    debug: false,
    closure: '',
  },
  render: renderWorkbench,
};
