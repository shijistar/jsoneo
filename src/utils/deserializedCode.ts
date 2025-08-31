import type { InternalParseOptions, SerializedResult, StringifyOptions } from '../types';
import { base64ToArrayBuffer, deserializeBinary, TypedArrays } from './binary';
import {
  DefaultEndTag,
  DefaultStartTag,
  SymbolKeyPrefixRegExp,
  SymbolKeyRegExps,
  SymbolKeySuffixRegExp,
  VariablePrefix,
} from './consts';
import { base64ToString, escapeRegExp } from './encode';

export function deserializedCode(result: SerializedResult, options: InternalParseOptions) {
  const { closure, isPrinting } = options ?? {};
  const {
    startTag: ST = DefaultStartTag,
    endTag: ET = DefaultEndTag,
    variablePrefix: VP = VariablePrefix,
    source: sourceCode,
    patches,
    descriptors,
    types,
    apis,
    refs,
  } = result;
  const escapeSingleQuote = (str: string) => str.replace(/'/g, isPrinting ? "\\\\'" : "\\'");
  const content = `${closure ? `const { ${Object.keys(closure ?? {}).join(', ')} } = ${VP}context || {};` : ''}
  const { get } = ${VP}options;
  const deserializeResult = (\n${decodeFormat(sourceCode, { startTag: ST, endTag: ET })}\n);
  const types = ${decodeFormat(JSON.stringify(types), { startTag: ST, endTag: ET })} ?? [];
  const patches = ${decodeFormat(JSON.stringify(patches), { startTag: ST, endTag: ET })} ?? [];
  const refs = ${decodeFormat(JSON.stringify(refs), { startTag: ST, endTag: ET })} ?? [];
  const apis = ${decodeFormat(
    JSON.stringify(
      apis.map((api) => ({
        ...api,
        toJSON: `${ST}${base64ToString(api.toJSON)}${ET}`,
        fromJSON: api.fromJSON ? `${ST}${base64ToString(api.fromJSON)}${ET}` : undefined,
      }))
    ),
    { startTag: ST, endTag: ET }
  )} ?? [];
  const descriptors = ${decodeFormat(
    JSON.stringify(
      descriptors?.map((d) => ({
        ...d,
        descriptor: {
          ...d.descriptor,
          get: d.descriptor.get ? `${ST}${base64ToString(d.descriptor.get)}${ET}` : undefined,
          set: d.descriptor.set ? `${ST}${base64ToString(d.descriptor.set)}${ET}` : undefined,
        },
      }))
    ),
    { startTag: ST, endTag: ET }
  )} ?? [];
  const TYPED_ARRAY_CTORS = {
    ${TypedArrays.map((ctor) => ctor.name).join(',\n    ')}
  };
  const symbolKeyRegExps = [
    ${SymbolKeyRegExps.map(
      (regExp) => `new RegExp('^${escapeRegExp(regExp, { escapeTwice: isPrinting, format: escapeSingleQuote })}$')`
    ).join(',\n    ')}
  ]
  const symbolKeyPrefixRegExp = new RegExp('^${escapeRegExp(SymbolKeyPrefixRegExp, { escapeTwice: isPrinting })}');
  const symbolKeySuffixRegExp = new RegExp('${escapeRegExp(SymbolKeySuffixRegExp, { escapeTwice: isPrinting })}$');

  // 1. Should be the first step.
  // Restore to the original types, except the root object.
  restoreOriginalTypes(deserializeResult, types.filter((t) => t.path.length > 0), apis.filter((t) => t.path.length > 0));

  // 2. Should be before restoreSymbolKeys, because the symbol-strings may be broken to Symbols.
  // Restore patches
  restorePatches(deserializeResult, patches);

  // 3. Should be before restoreDescriptors, because symbol-strings may be changed to readonly.
  // Restore values for Symbol keys.
  restoreSymbolKeys(deserializeResult);

  // 4-1. Should be after restoreSymbolKeys because may produce circular references 
  //    which lead to infinite loops in restoreSymbolKeys
  // 4-2. Should be before restoreDescriptors, because related fields may be changed to readonly.
  // Restore references to solve circular dependencies
  restoreRefs(deserializeResult, refs);

  // 5. Should be after restoreRefs.
  // Restore custom property descriptors
  restoreDescriptors(deserializeResult, descriptors);

  // 6. Should be the last step.
  // Restore the root object type.
  if (types.some((t) => t.path.length === 0) || apis.some((t) => t.path.length === 0)) {
    const rootResult = restoreOriginalTypes(deserializeResult, types.filter((t) => t.path.length === 0), apis.filter((t) => t.path.length === 0));
    const newRoot = rootResult.root;
    if (refs.some((t) => t.from.length === 0)) {
      // Remap the refs to the root
      const rootRefs = refs.filter((t) => t.from.length === 0);
      rootRefs.forEach(({ path, from }) => {
        const parent = getParent(deserializeResult, path);
        const keyName = getLastKey(path);
        if (parent != null && keyName) {
          parent[keyName] = newRoot;
        }
      });
    }
    return newRoot;
  }

  function restoreOriginalTypes(root, types = [], apis = []) {
    const returnResult = {};
    // Apply types to the deserialized object
    types.forEach(({ path, type, metadata }) => {
      const value = get(root, path);
      let newResult;
      if (type === 'URL' && typeof value === 'string') {
        newResult = new URL(value);
      }
      else if (type === 'URLSearchParams' && typeof value === 'string') {
        newResult = new URLSearchParams(value);
      }
      else if (type === 'Map' && typeof value === 'object') {
        // Convert array to Map
        const map = new Map();
        Object.keys(value).forEach((key) => {
          map.set(key, value[key]);
        });
        newResult = map;
      }
      else if (type === 'Set' && Array.isArray(value)) {
        // Convert array to Set
        const set = new Set(value);
        newResult = set;
      } 
      else if ([${TypedArrays.map((t) => `'${t.name}'`).join(', ')}].includes(type) && 
        typeof globalThis[type] === 'function') {
        newResult = deserializeBinary(value);
      }
      else if (type === 'ArrayBuffer' && typeof ArrayBuffer === 'function') {
        newResult = deserializeBinary(value);
      }
      else if (type === 'DataView' && typeof DataView === 'function' && typeof ArrayBuffer === 'function') {
        newResult = deserializeBinary(value);
      }
      else if (type === 'Buffer' && Array.isArray(value)) {
        if (typeof Buffer !== 'undefined') {
          newResult = Buffer.from(value);
        }
        else if (typeof Uint8Array === 'function') {
          newResult = new Uint8Array(value);
        }
      }

      if (newResult) {
        if (path.length === 0) {
          returnResult.root = newResult;
        }
        else {
          const keyName = getLastKey(path);
          const parent = getParent(root, path);
          if (parent) {
            parent[keyName] = newResult;
          }
        }
      }
    });

    apis.forEach(({ path, toJSON, fromJSON }) => {
      if (typeof fromJSON === 'function') {
        const value = get(root, path);
        const result = fromJSON(value);
        const keyName = getLastKey(path);
        const parent = getParent(root, path);
        if (result != null && typeof result === 'object') {
          if (result.toJSON == null) {
            result.toJSON = toJSON;
          }
          if (result.fromJSON == null) {
            result.fromJSON = fromJSON;
          }
        }
        if (path.length === 0) {
          returnResult.root = result;
        }
        else {
          if (parent && keyName != null) {
            parent[keyName] = result;
          }
        }
      }
    });
    return returnResult;
  }

  function restorePatches(root, patches = []) {
    // Apply patches to the deserialized object
    patches.forEach(({ path, patch }) => {
      const sourceObj = get(root, path);
      if (sourceObj) {
        const sourceKeys = getFullKeys(sourceObj);
        getFullKeys(patch).forEach((key) => {
          if (!sourceKeys.includes(key) || sourceObj[key] == null) {
            sourceObj[key] = patch[key];
          }
        });
      }
    });
  }

  function restoreSymbolKeys(root, paths = []) {
    if (root && !paths.includes(root)) {
      if (typeof root === 'object') {
        Object.keys(root).forEach((key) => {
          if (typeof root[key] === 'object') {
            restoreSymbolKeys(root[key], [...paths, key]);
          }
          if (isSymbolFieldName(key)) {
            root[keyToSymbol(key)] = root[key];
            delete root[key];
          }
        });
      }
    }
  }

  function restoreRefs(root, refs = []) {
    refs.forEach(({ path, from }) => {
      const pathParsed = parseSymbolKeys(path);
      const fromParsed = parseSymbolKeys(from);
      const parent = getParent(root, pathParsed);
      const keyName = getLastKey(pathParsed);
      const target = get(root, fromParsed);
      if (parent && keyName != null) {
        parent[keyName] = target;
      }
    });
  }

  function restoreDescriptors(root, descriptors = []) {
    // Apply descriptors to the deserialized object
    descriptors.forEach(({ ownerPath, key, descriptor: sourceDescriptor }) => {
      const owner = get(root, ownerPath);
      if (owner) {
        let realKey = key;
        if (isSymbolFieldName(key)) {
          realKey = keyToSymbol(key);
        }
        const value = owner[realKey];
        const copied = { ...sourceDescriptor };
        if (!copied.get && !copied.set) {
          copied.value = value;
        }
        Object.defineProperty(owner, realKey, copied);
      }
    });
  }

  ${deserializeBinary.toString()}
  ${base64ToArrayBuffer.toString()}

  function getFullKeys(obj) {
    if (obj == null) {
      return [];
    }
    return [...Object.getOwnPropertyNames(obj), ...Object.getOwnPropertySymbols(obj)].filter((key) => {
      const descriptor = Object.getOwnPropertyDescriptor(obj, key);
      return descriptor && ('value' in descriptor || descriptor.get);
    });
  }

  function getLastKey(path) {
    return path && path.length ? path[path.length - 1] : undefined;
  }

  function getParent(root, path) {
    if (path.length <= 1) {
      return root;
    }
    return get(root, path.slice(0, -1));
  }

  function isSymbolFieldName(key) {
    return symbolKeyRegExps.some((regExp) => regExp.test(key));
  }

  function keyToSymbol(key) {
    const expression = key.replace(symbolKeyPrefixRegExp, '').replace(symbolKeySuffixRegExp, '');
    return new Function('return ' + expression)();
  }

  function parseSymbolKeys(path) {
    return path.map((p) => isSymbolFieldName(p) ? keyToSymbol(p) : p);
  }

  return deserializeResult;`;
  return content;
}
function decodeFormat(
  content: string | undefined,
  options: Pick<StringifyOptions, 'startTag' | 'endTag'> = {}
): string | undefined {
  const { startTag: ST = '', endTag: ET = '' } = options ?? {};
  const escapedTS = escapeRegExp(ST);
  const escapedTE = escapeRegExp(ET);
  return content
    ?.replace(new RegExp(`\\\\?['"]${escapedTS}`, 'g'), '')
    .replace(new RegExp(`${escapedTE}\\\\?['"]`, 'g'), '')
    .replace(/\\n/g, '\n');
}
