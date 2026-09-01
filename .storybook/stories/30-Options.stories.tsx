import { useCallback, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { Button, Input, Space, Switch, Tooltip } from 'antd';
import { parse, stringify } from '../../src';
import type { ParseOptions, StringifyOptions } from '../../src/types';
import { ResultPanel } from '../components/ResultPanel';
import { storyI18n, useStoryT } from '../locales';
import { checkRoundTrip, formatValue, getTypeSummary } from '../utils/roundTrip';

const meta: Meta = {
  title: 'Core API / Options',
  // @ts-expect-error: because titleCN is an extension field
  titleCN: '核心 API / 选项',
  component: OptionsView,
  parameters: {
    docs: {
      description: {
        component: storyI18n.t('story.meta.options'),
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
    startTag: {
      control: 'text',
      description: storyI18n.t('story.argTypes.startTag'),
      table: { category: 'StringifyOptions' },
    },
    endTag: {
      control: 'text',
      description: storyI18n.t('story.argTypes.endTag'),
      table: { category: 'StringifyOptions' },
    },
    variablePrefix: {
      control: 'text',
      description: storyI18n.t('story.argTypes.variablePrefix'),
      table: { category: 'StringifyOptions' },
    },
    preserveClassConstructor: {
      control: 'boolean',
      description: storyI18n.t('story.argTypes.preserveClassConstructor'),
      table: { category: 'StringifyOptions' },
    },
    preserveDescriptors: {
      control: 'boolean',
      description: storyI18n.t('story.argTypes.preserveDescriptors'),
      table: { category: 'StringifyOptions' },
    },
    debug: {
      control: 'boolean',
      description: storyI18n.t('story.argTypes.debug'),
      table: { category: 'Options' },
    },
    prettyPrint: {
      control: 'boolean',
      description: storyI18n.t('story.argTypes.prettyPrint'),
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

function OptionsView({
  input,
  startTag,
  endTag,
  variablePrefix,
  preserveClassConstructor,
  preserveDescriptors,
  debug,
  prettyPrint,
  updateArgs,
}: OptionsArgs & { updateArgs: (patch: Partial<OptionsArgs>) => void }) {
  const t = useStoryT();
  const [serialized, setSerialized] = useState<string>('');
  const [restored, setRestored] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [roundTripResult, setRoundTripResult] = useState<{ passed: boolean; reason: string } | null>(null);

  const runSerialization = useCallback(() => {
    setError(null);
    try {
      const value = input;
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
        setError(
          t('story.common.parseFailed', {
            message: parseError instanceof Error ? parseError.message : String(parseError),
          }),
        );
        setRestored(null);
        setRoundTripResult({ passed: false, reason: t('story.common.parseError') });
      }
    } catch (stringifyError) {
      setError(
        t('story.common.stringifyFailed', {
          message: stringifyError instanceof Error ? stringifyError.message : String(stringifyError),
        }),
      );
      setSerialized('');
      setRestored(null);
      setRoundTripResult(null);
    }
  }, [input, startTag, endTag, variablePrefix, preserveClassConstructor, preserveDescriptors, debug, prettyPrint, t]);

  return (
    <div className="sb-story-container">
      <div className="sb-section">
        <h3 className="sb-section-title">{t('story.common.testInput')}</h3>
        <ResultPanel
          label={t('story.common.typeLabel', { type: getTypeSummary(input) })}
          copyText={formatValue(input)}
          onCopy={() => navigator.clipboard.writeText(formatValue(input))}
        >
          {formatValue(input)}
        </ResultPanel>
      </div>
      <div className="sb-section">
        <h3 className="sb-section-title">{t('story.common.stringifyOptions')}</h3>
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
            <Tooltip title={t('story.options.debugTooltip')}>
              <span style={{ marginRight: '0.5rem' }}>debug</span>
              <Switch checked={debug} onChange={(checked) => updateArgs({ debug: checked })} />
            </Tooltip>
          </label>
        </div>
      </div>
      <div className="sb-section">
        <h3 className="sb-section-title">{t('story.common.parseOptions')}</h3>
        <div className="sb-grid">
          <label className="sb-card">
            <Tooltip title={t('story.options.prettyPrintTooltip')}>
              <span style={{ marginRight: '0.5rem' }}>prettyPrint</span>
              <Switch checked={prettyPrint} onChange={(checked) => updateArgs({ prettyPrint: checked })} />
            </Tooltip>
          </label>
        </div>
      </div>
      <div className="sb-section">
        <h3 className="sb-section-title">{t('story.common.actions')}</h3>
        <Button type="primary" onClick={runSerialization}>
          {t('story.common.runStringifyParse')}
        </Button>
      </div>
      {serialized && (
        <div className="sb-section">
          <h3 className="sb-section-title">{t('story.common.serializedOutput')}</h3>
          <ResultPanel
            label={
              <Space>
                {t('story.common.lengthLabel', { count: serialized.length })}
                <Button size="small" onClick={() => navigator.clipboard.writeText(serialized)}>
                  {t('story.common.copy')}
                </Button>
              </Space>
            }
          >
            <pre className="sb-json-output sb-expandable">{serialized}</pre>
          </ResultPanel>
        </div>
      )}
      {error && (
        <div className="sb-section">
          <h3 className="sb-section-title">{t('story.common.error')}</h3>
          <ResultPanel variant="error" label={error} />
        </div>
      )}
      {restored !== null && (
        <div className="sb-section">
          <h3 className="sb-section-title">{t('story.common.restoredResult')}</h3>
          <ResultPanel
            label={
              <>
                {t('story.common.typeLabel', { type: getTypeSummary(restored) })}
                {roundTripResult && (
                  <>
                    <span className={`sb-badge ${roundTripResult.passed ? 'success' : 'danger'}`}>
                      {roundTripResult.passed ? t('story.common.roundTripOk') : t('story.common.roundTripFail')}
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
const renderOptions = () => {
  const [args, updateArgs] = useArgs<OptionsArgs>();
  return <OptionsView {...args} updateArgs={updateArgs} />;
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Options: Story = {
  name: 'Options',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '选项',
  args: OPTIONS_PRESETS.default,
  render: renderOptions,
};
