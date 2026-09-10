import type { NavItem } from './PrevNextNav';

/**
 * Prev/next navigation chain for jsoneo: all docs pages first (01-10), then all demo stories
 * grouped by file (20-90). Each story group uses its first story as the navigation target; the
 * group prefix is used to match any story variant of that demo. Changelog is intentionally NOT part
 * of this chain.
 */
export const NAV_ITEMS: NavItem[] = [
  { key: 'introduce', id: 'introduce--intro', type: 'docs', title: 'Introduce', titleCN: '介绍' },
  { key: 'install', id: 'install--intro', type: 'docs', title: 'Install', titleCN: '安装' },
  { key: 'get-started', id: 'get-started--intro', type: 'docs', title: 'Get Started', titleCN: '快速开始' },
  { key: 'api-guide', id: 'api-guide--intro', type: 'docs', title: 'API Guide', titleCN: 'API 指南' },
  {
    key: 'supported-values',
    id: 'supported-values--intro',
    type: 'docs',
    title: 'Supported Values',
    titleCN: '支持的值类型',
  },
  { key: 'options', id: 'options--intro', type: 'docs', title: 'Options', titleCN: '选项' },
  {
    key: 'advanced-patterns',
    id: 'advanced-patterns--intro',
    type: 'docs',
    title: 'Advanced Patterns',
    titleCN: '高级模式',
  },
  { key: 'limitations', id: 'limitations--intro', type: 'docs', title: 'Limitations', titleCN: '限制' },
  { key: 'security', id: 'security--intro', type: 'docs', title: 'Security', titleCN: '安全' },
  { key: 'faq', id: 'faq--intro', type: 'docs', title: 'FAQ', titleCN: '常见问题' },
  {
    key: 'core-api-primitive-values',
    id: 'core-api-primitive-values--all-primitives',
    type: 'story',
    title: 'Primitive Values',
    titleCN: '原始值',
  },
  {
    key: 'core-api-special-values',
    id: 'core-api-special-values--undefined-value',
    type: 'story',
    title: 'Special Values',
    titleCN: '特殊值',
  },
  {
    key: 'core-api-built-ins-collections',
    id: 'core-api-built-ins-collections--date-value',
    type: 'story',
    title: 'Built-ins & Collections',
    titleCN: '内置与集合',
  },
  {
    key: 'core-api-binary-values',
    id: 'core-api-binary-values--uint-8-array-value',
    type: 'story',
    title: 'Binary Values',
    titleCN: '二进制值',
  },
  {
    key: 'core-api-functions-closure',
    id: 'core-api-functions-closure--regular-function',
    type: 'story',
    title: 'Functions & Closure',
    titleCN: '函数与闭包',
  },
  {
    key: 'core-api-descriptors-prototype',
    id: 'core-api-descriptors-prototype--custom-descriptors',
    type: 'story',
    title: 'Descriptors & Prototype',
    titleCN: '描述符与原型',
  },
  {
    key: 'core-api-circular-references',
    id: 'core-api-circular-references--simple-circular',
    type: 'story',
    title: 'Circular References',
    titleCN: '循环引用',
  },
  {
    key: 'core-api-options',
    id: 'core-api-options--options',
    type: 'story',
    title: 'Options',
    titleCN: '选项',
  },
  {
    key: 'compatibility-runtime-environments',
    id: 'compatibility-runtime-environments--buffer-support',
    type: 'story',
    title: 'Runtime Environments',
    titleCN: '运行时环境',
  },
  {
    key: 'security-concern-security-boundary',
    id: 'security-concern-security-boundary--trusted-round-trip',
    type: 'story',
    title: 'Security Boundary',
    titleCN: '安全边界',
  },
];
