import { useCallback, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { Button, Input, Select, Space, Switch, Tooltip } from 'antd';
import { parse, stringify } from '../../src';
import type { ParseOptions, StringifyOptions } from '../../src/types';
import { ResultPanel } from '../components/ResultPanel';
import { TrustedInputNotice } from '../components/TrustedInputNotice';
import { storyI18n, useStoryT } from '../locales';
import { checkRoundTrip, formatValue, getTypeSummary } from '../utils/roundTrip';
import { createFixture, FIXTURE_TYPES } from './shared/fixtures';

const FIXTURE_LABEL_KEYS: Record<string, string> = {
  primitives: 'story.options.fixture.primitives',
  'special-values': 'story.options.fixture.specialValues',
  'builtins-collections': 'story.options.fixture.builtinsCollections',
  'binary-values': 'story.options.fixture.binaryValues',
  'functions-closure': 'story.options.fixture.functionsClosure',
  'descriptors-prototype': 'story.options.fixture.descriptorsPrototype',
  'circular-references': 'story.options.fixture.circularReferences',
  'complex-object': 'story.options.fixture.complexObject',
};

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
  // tags: ['autodocs'],
  argTypes: {
    fixture: {
      control: 'select',
      options: [...FIXTURE_TYPES],
      description: storyI18n.t('story.options.inputFixture'),
      table: { category: 'Input' },
    },
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
    closure: {
      control: 'select',
      options: ['', 'allowedRoles'],
      description: storyI18n.t('story.argTypes.closure'),
      table: { category: 'ParseOptions' },
    },
    prettyPrint: {
      control: 'boolean',
      description: storyI18n.t('story.argTypes.prettyPrint'),
      table: { category: 'ParseOptions' },
    },
  },
};

type OptionsArgs = {
  fixture: string;
  input: unknown;
  startTag: string;
  endTag: string;
  variablePrefix: string;
  preserveClassConstructor: boolean;
  preserveDescriptors: boolean;
  debug: boolean;
  closure: string;
  prettyPrint: boolean;
};

const DEFAULT_ARGS: OptionsArgs = {
  fixture: 'primitives',
  input: createFixture('primitives'),
  startTag: '',
  endTag: '',
  variablePrefix: '',
  preserveClassConstructor: false,
  preserveDescriptors: true,
  debug: false,
  closure: '',
  prettyPrint: true,
};

function OptionsView({
  fixture,
  input,
  startTag,
  endTag,
  variablePrefix,
  preserveClassConstructor,
  preserveDescriptors,
  debug,
  closure,
  prettyPrint,
  updateArgs,
}: OptionsArgs & { updateArgs: (patch: Partial<OptionsArgs>) => void }) {
  const t = useStoryT();
  const [originalValue, setOriginalValue] = useState<unknown>(null);
  const [serialized, setSerialized] = useState<string>('');
  const [restored, setRestored] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [roundTripResult, setRoundTripResult] = useState<{ passed: boolean; reason: string } | null>(null);

  const handleFixtureChange = useCallback(
    (nextFixture: string) => {
      const nextInput = createFixture(nextFixture);
      updateArgs({ fixture: nextFixture, input: nextInput });
    },
    [updateArgs],
  );

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
        const closureObj: Record<string, unknown> | undefined =
          closure === 'allowedRoles' ? { allowedRoles: ['admin', 'editor'] } : undefined;
        const parseOpts: ParseOptions = {
          closure: closureObj,
          prettyPrint,
          debug,
        };
        const restoredValue = parse(serializedResult, parseOpts);
        setRestored(restoredValue);
        // window.x = restoredValue;
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
  }, [
    input,
    startTag,
    endTag,
    variablePrefix,
    preserveClassConstructor,
    preserveDescriptors,
    debug,
    closure,
    prettyPrint,
    t,
  ]);

  const fixtureOptions = FIXTURE_TYPES.map((type) => ({
    value: type,
    label: t(FIXTURE_LABEL_KEYS[type] || type),
  }));

  const closureOptions = [
    { value: '', label: t('story.functions.none') },
    { value: 'allowedRoles', label: t('story.functions.allowedRoles') },
  ];

  return (
    <div className="sb-story-container">
      <TrustedInputNotice variant="info" />
      <div className="sb-section">
        <h3 className="sb-section-title">{t('story.options.fixtureSelection')}</h3>
        <div className="sb-grid">
          <div className="sb-card">
            <div className="sb-card-title">{t('story.options.inputFixture')}</div>
            <Select value={fixture} onChange={handleFixtureChange} options={fixtureOptions} style={{ width: '100%' }} />
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: 'var(--storybook-text-muted)' }}>
              {t(FIXTURE_LABEL_KEYS[fixture] || fixture)}
            </p>
          </div>
        </div>
      </div>
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
        </div>
      </div>
      {(fixture === 'functions-closure' || fixture === 'descriptors-prototype') && (
        <div className="sb-section">
          <h3 className="sb-section-title">{t('story.common.parseOptions')}</h3>
          <div className="sb-grid">
            <div className="sb-card">
              <div style={{ fontSize: '0.875rem' }}>
                {t('story.functions.closureFixture')}
                <Select
                  value={closure}
                  onChange={(next) => updateArgs({ closure: next })}
                  options={closureOptions}
                  style={{ width: 260, marginLeft: '0.5rem' }}
                />
                <p style={{ margin: '0.5rem 0 0', color: 'var(--storybook-text-muted)' }}>
                  {t('story.functions.closureNotice')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="sb-section">
        <h3 className="sb-section-title">{t('story.common.parseOptions')}</h3>
        <div className="sb-grid">
          <label className="sb-card">
            <Tooltip title={t('story.options.debugTooltip')}>
              <span style={{ marginRight: '0.5rem' }}>debug</span>
              <Switch checked={debug} onChange={(checked) => updateArgs({ debug: checked })} />
            </Tooltip>
          </label>
          {debug && (
            <label className="sb-card">
              <Tooltip title={t('story.options.prettyPrintTooltip')}>
                <span style={{ marginRight: '0.5rem' }}>prettyPrint</span>
                <Switch checked={prettyPrint} onChange={(checked) => updateArgs({ prettyPrint: checked })} />
              </Tooltip>
            </label>
          )}
        </div>
      </div>
      <div className="sb-section">
        <h3 className="sb-section-title">{t('story.common.actions')}</h3>
        <Button type="primary" onClick={runSerialization}>
          {t('story.common.runStringifyParse')}
        </Button>
      </div>
      {originalValue !== null && (
        <div className="sb-section">
          <h3 className="sb-section-title">{t('story.options.originalInput')}</h3>
          <ResultPanel
            label={t('story.common.typeLabel', { type: getTypeSummary(originalValue) })}
            copyText={formatValue(originalValue)}
            onCopy={() => navigator.clipboard.writeText(formatValue(originalValue))}
          >
            {formatValue(originalValue)}
          </ResultPanel>
        </div>
      )}
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
  args: DEFAULT_ARGS,
  render: renderOptions,
};
