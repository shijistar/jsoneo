import { useCallback } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { Input, Select, Switch, Tooltip, Typography } from 'antd';
import type { ParseOptions, StringifyOptions } from '../../src/types';
import { RoundTripDemo } from '../components/RoundTripDemo';
import { TrustedInputNotice } from '../components/TrustedInputNotice';
import { storyI18n, useStoryT } from '../locales';
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
const FIXTURE_DESCRIPTION_KEYS: Record<string, string> = {
  primitives: 'story.meta.primitiveValues',
  'special-values': 'story.meta.specialValues',
  'builtins-collections': 'story.meta.builtinsCollections',
  'binary-values': 'story.meta.binaryValues',
  'functions-closure': 'story.meta.functionsClosure',
  'descriptors-prototype': 'story.meta.descriptorsPrototype',
  'circular-references': 'story.meta.circularReferences',
  'complex-object': 'story.meta.complexObject',
};

const meta: Meta = {
  title: 'Core API / Options',
  // @ts-expect-error: because titleCN is an extension field
  titleCN: '核心 API / 选项',
  component: RoundTripDemo,
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

// useArgs 只能在 story render 函数（StoryContext）内调用。
const renderOptions = () => {
  const [args, updateArgs] = useArgs<OptionsArgs>();
  const t = useStoryT();

  const handleFixtureChange = useCallback(
    (nextFixture: string) => {
      const nextInput = createFixture(nextFixture);
      updateArgs({ fixture: nextFixture, input: nextInput });
    },
    [updateArgs],
  );

  const stringifyOpts: StringifyOptions = {
    startTag: args.startTag || undefined,
    endTag: args.endTag || undefined,
    variablePrefix: args.variablePrefix || undefined,
    preserveClassConstructor: args.preserveClassConstructor,
    preserveDescriptors: args.preserveDescriptors,
    debug: args.debug,
  };

  const closureObj: Record<string, unknown> | undefined =
    args.closure === 'allowedRoles' ? { allowedRoles: ['admin', 'editor'] } : undefined;
  const parseOpts: ParseOptions = {
    closure: closureObj,
    prettyPrint: args.prettyPrint,
    debug: args.debug,
  };

  const fixtureOptions = FIXTURE_TYPES.map((type) => {
    const text = t(FIXTURE_LABEL_KEYS[type] || type);
    const match = text.match(/(.+?)([（\(].*[）\)])/);
    const name = match?.[1] ?? text;
    const description = match?.[2];
    return {
      value: type,
      label: (
        <>
          {name}
          {description && <Typography.Text type="secondary">{description}</Typography.Text>}
        </>
      ),
    };
  });
  const closureOptions = [
    { value: '', label: t('story.functions.none') },
    { value: 'allowedRoles', label: t('story.functions.allowedRoles') },
  ];
  const showClosurePanel = args.fixture === 'functions-closure' || args.fixture === 'descriptors-prototype';

  return (
    <RoundTripDemo
      input={args.input}
      stringifyOptions={stringifyOpts}
      parseOptions={parseOpts}
      showOriginalInput
      beforeInput={
        <>
          <TrustedInputNotice variant="info" />
          <div className="sb-section">
            <h3 className="sb-section-title">{t('story.options.fixtureSelection')}</h3>
            <div className="sb-grid">
              <div className="sb-card">
                <div className="sb-card-title">{t('story.options.inputFixture')}</div>
                <Select
                  value={args.fixture}
                  onChange={handleFixtureChange}
                  options={fixtureOptions}
                  style={{ width: '100%' }}
                />
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: 'var(--storybook-text-muted)' }}>
                  {t(FIXTURE_DESCRIPTION_KEYS[args.fixture] || args.fixture)}
                </p>
              </div>
            </div>
          </div>
        </>
      }
      optionsPanel={
        <>
          <div className="sb-section">
            <h3 className="sb-section-title">{t('story.common.stringifyOptions')}</h3>
            <div className="sb-grid">
              <div className="sb-card">
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>startTag</label>
                <Input
                  value={args.startTag}
                  onChange={(e) => updateArgs({ startTag: e.target.value })}
                  placeholder="\$SJS\$_"
                  allowClear
                />
              </div>
              <div className="sb-card">
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>endTag</label>
                <Input
                  value={args.endTag}
                  onChange={(e) => updateArgs({ endTag: e.target.value })}
                  placeholder="_\$SJE\$"
                  allowClear
                />
              </div>
              <div className="sb-card">
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  variablePrefix
                </label>
                <Input
                  value={args.variablePrefix}
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
                  checked={args.preserveClassConstructor}
                  onChange={(checked) => updateArgs({ preserveClassConstructor: checked })}
                />
              </label>
              <label className="sb-card">
                <span style={{ marginRight: '0.5rem' }}>preserveDescriptors</span>
                <Switch
                  checked={args.preserveDescriptors}
                  onChange={(checked) => updateArgs({ preserveDescriptors: checked })}
                />
              </label>
            </div>
          </div>
          {showClosurePanel && (
            <div className="sb-section">
              <h3 className="sb-section-title">{t('story.common.parseOptions')}</h3>
              <div className="sb-grid">
                <div className="sb-card">
                  <div style={{ fontSize: '0.875rem' }}>
                    {t('story.functions.closureFixture')}
                    <Select
                      value={args.closure}
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
              <div className="sb-grid" style={{ marginTop: '0.5rem' }}>
                <label className="sb-card">
                  <Tooltip title={t('story.options.debugTooltip')}>
                    <span style={{ marginRight: '0.5rem' }}>debug</span>
                    <Switch checked={args.debug} onChange={(checked) => updateArgs({ debug: checked })} />
                  </Tooltip>
                </label>
                {args.debug && (
                  <label className="sb-card">
                    <Tooltip title={t('story.options.prettyPrintTooltip')}>
                      <span style={{ marginRight: '0.5rem' }}>prettyPrint</span>
                      <Switch checked={args.prettyPrint} onChange={(checked) => updateArgs({ prettyPrint: checked })} />
                    </Tooltip>
                  </label>
                )}
              </div>
            </div>
          )}
        </>
      }
    />
  );
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
