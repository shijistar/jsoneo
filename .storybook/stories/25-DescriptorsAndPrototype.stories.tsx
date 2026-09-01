import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { Switch } from 'antd';
import { RoundTripDemo } from '../components/RoundTripDemo';
import { storyI18n, useStoryT } from '../locales';

const meta: Meta = {
  title: 'Core API / Descriptors & Prototype',
  // @ts-expect-error: because titleCN is an extension field
  titleCN: '核心 API / 描述符与原型',
  component: RoundTripDemo,
  parameters: {
    docs: {
      description: {
        component: storyI18n.t('story.meta.descriptorsPrototype'),
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
    preserveDescriptors: {
      control: 'boolean',
      description: storyI18n.t('story.argTypes.preserveDescriptors'),
      table: { category: 'StringifyOptions' },
    },
  },
};

type StoryArgs = {
  input?: unknown;
  preserveDescriptors?: boolean;
};

// useArgs 只能在 story render 函数（StoryContext）内调用。
const renderWithArgs = (storyArgs: StoryArgs) => {
  const [args, updateArgs] = useArgs<StoryArgs>();
  const t = useStoryT();

  return (
    <RoundTripDemo
      input={args.input}
      stringifyOptions={{ preserveDescriptors: args.preserveDescriptors }}
      optionsPanel={
        <div className="sb-section">
          <h3 className="sb-section-title">{t('story.common.stringifyOptions')}</h3>
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
      }
    />
  );
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
