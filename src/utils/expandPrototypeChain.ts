/**
 * Expands the prototype chain of the source object, including all properties from the prototype
 * chain.
 *
 * @param source - The source object to expand.
 * @param options - Options to control the expansion behavior.
 */
import type {
  DescriptorInfo,
  ExpandPrototypeChainOptions,
  JsonApi,
  PatchInfo,
  PathType,
  StringifyOptions,
} from '../types';
import type { TypedArrays } from './binary';
import { serializeBinary, TypedArrayNames } from './binary';
import { SymbolForGetDescriptor, SymbolForSetDescriptor } from './consts';
import { stringToBase64 } from './encode';
import { getFullKeys } from './get';
import { pickPrototype } from './pickPrototype';
import { serializeFunction } from './serializeRecursively';
import { toSymbolString } from './symbol';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function expandPrototypeChain(
  source: unknown,
  options: ExpandPrototypeChainOptions = {} as ExpandPrototypeChainOptions
): typeof source {
  const {
    parentPath,
    patches = [],
    descriptors = [],
    types = [],
    refs = [],
    apis = [],
    circular = new WeakMap(),
  } = options;
  return expandPrototypeChainRecursively(source, {
    ...options,
    paths: parentPath ?? [],
    patches,
    descriptors,
    types,
    refs,
    apis,
    circular,
  });
}

function expandPrototypeChainRecursively(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  source: any,
  options: {
    paths: PathType[];
  } & Pick<ExpandPrototypeChainOptions, 'patches' | 'descriptors' | 'types' | 'refs' | 'apis' | 'circular'> &
    Pick<StringifyOptions, 'preserveClassConstructor' | 'preserveDescriptors' | 'debug'>
): typeof source {
  const { debug, patches, preserveDescriptors = true, descriptors, types, paths, refs, apis, circular } = options;
  if (source == null || source === Array.prototype || source === Object.prototype) {
    return source;
  }
  const typeName = Object.prototype.toString.call(source);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assertCircular = (obj: any, path: PathType[]) => {
    const toSymbolStrings = (paths: PathType[]) => {
      return paths.map((p) =>
        /* v8 ignore next -- anonymous symbol circular paths cannot be represented in serialized refs */
        typeof p === 'symbol' ? ((toSymbolString(p) ? `[${toSymbolString(p)}]` : undefined) ?? 'undefined') : p
      );
    };
    if (circular.has(obj)) {
      refs.push({
        path: toSymbolStrings(path),
        from: circular.get(obj)!,
      });
      return true;
    } else {
      circular.set(obj, toSymbolStrings(path));
      return false;
    }
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: any;
  /* v8 ignore next -- @preserve */
  const isError = 'isError' in Error && typeof Error.isError === 'function' && Error.isError(source);
  if (
    Array.isArray(source) ||
    (typeof source === 'object' &&
      typeName !== '[object Date]' &&
      typeName !== '[object RegExp]' &&
      typeName !== '[object Error]' &&
      !isError &&
      typeName !== '[object Symbol]')
  ) {
    if (assertCircular(source, paths)) {
      // should return `null` instead of `undefined`, since undefined will be ignored in JSON.stringify
      return null;
    }
    /* v8 ignore next -- @preserve */
    if ('isRawJSON' in JSON && typeof JSON.isRawJSON === 'function' && JSON.isRawJSON(source)) {
      /* v8 ignore next -- @preserve */
      return source;
    } else if (typeof URL !== 'undefined' && typeName === '[object URL]') {
      result = source.toString();
      types.push({ path: paths, type: 'URL' });
      return result;
    } else if (typeof URLSearchParams !== 'undefined' && typeName === '[object URLSearchParams]') {
      result = source.toString();
      types.push({ path: paths, type: 'URLSearchParams' });
      return result;
    } else if (typeName === '[object Map]') {
      const sourceMap: Map<unknown, unknown> = source;
      result = Array.from(source.keys()).reduce<Record<string, unknown>>((acc, key) => {
        acc[key as string] = sourceMap.get(key);
        return acc;
      }, {});
      types.push({ path: paths, type: 'Map' });
    } else if (typeName === '[object Set]') {
      result = Array.from(source);
      types.push({ path: paths, type: 'Set' });
    } else if (typeName === '[object WeakMap]') {
      result = {};
    } else if (typeName === '[object WeakSet]') {
      result = [];
    } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(source)) {
      result = Array.from(source);
      types.push({ path: paths, type: 'Buffer' });
      return result;
    } else if (TypedArrayNames.includes(typeName)) {
      result = serializeBinary(source as InstanceType<(typeof TypedArrays)[number]>);
      types.push({ path: paths, type: source.constructor.name });
    } else if (typeName === '[object ArrayBuffer]') {
      result = serializeBinary(source);
      types.push({ path: paths, type: 'ArrayBuffer' });
    } else if (typeName === '[object DataView]') {
      result = serializeBinary(source);
      types.push({ path: paths, type: 'DataView' });
    } else if (Array.isArray(source)) {
      result = [...source];
    } else if (source.toJSON && typeof source.toJSON === 'function') {
      const api: JsonApi = {
        path: paths,
        toJSON: stringToBase64(serializeFunction(source.toJSON.toString())!),
      };
      if (source.fromJSON && typeof source.fromJSON === 'function') {
        api.fromJSON = stringToBase64(serializeFunction(source.fromJSON.toString())!);
      }
      apis.push(api);
      result = source.toJSON();
      if (result != null && typeof result !== 'object' && typeof result !== 'function') {
        return result;
      } else {
        // continue to expand the prototype chain
        source = result;
      }
    } else if (source[Symbol.iterator]) {
      result = Array.from(source);
    } else {
      result = {};
    }

    // Expand prototype properties to newSource
    const proto = pickPrototype(source, options);
    const destWithProto = pickPrototype(result);
    const destDescriptors = Object.getOwnPropertyDescriptors(destWithProto);
    Object.setPrototypeOf(destDescriptors, null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const checkDescriptor = (key: keyof any, descriptor: PropertyDescriptor) => {
      if (
        descriptor &&
        (!descriptor.writable || !descriptor.enumerable || !descriptor.configurable || descriptor.get || descriptor.set)
      ) {
        if (typeof key === 'symbol') {
          /* v8 ignore next -- anonymous symbol descriptors remain symbol-keyed and are not stringified */
          key = toSymbolString(key) ? `[${toSymbolString(key)}]` : '';
        }
        const copied = { ...descriptor };
        delete copied.value;
        const result = copied as DescriptorInfo['descriptor'];
        if (descriptor.get) {
          result.get = stringToBase64(serializeFunction(descriptor.get.toString())!);
        }
        if (descriptor.set) {
          result.set = stringToBase64(serializeFunction(descriptor.set.toString())!);
        }
        descriptors.push({
          ownerPath: paths,
          key,
          descriptor: result,
        });
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const assign = (source: Record<string | symbol, any>) => {
      const sourceDescriptors = Object.getOwnPropertyDescriptors(source);
      Object.setPrototypeOf(sourceDescriptors, null);
      getFullKeys(source).forEach((key) => {
        let index: number;
        // Always skip array length and indices
        if (
          Array.isArray(source) &&
          typeof key === 'string' &&
          (key === 'length' || ((index = Number(key)) >= 0 && index < source.length))
        ) {
          return;
        }
        const descriptor = sourceDescriptors[key];
        const destDescriptor = destDescriptors[key as string];
        /* v8 ignore start -- defensive branch for descriptors that getFullKeys intentionally filters out */
        if (descriptor && !descriptor.get && !('value' in descriptor)) {
          // If the descriptor is not readable, skip it
          if (debug) {
            console.log('------------------ expandPrototypeChain [SKIPPED] ------------------');
            console.log('The source descriptor is not readable, skipped!');
            console.log([...paths, key], descriptor);
          }
          return;
        }
        /* v8 ignore stop */
        // If the destination descriptor is not writable, skip it
        /* v8 ignore start -- defensive branch for non-writable accessors on generated destinations */
        if (destDescriptor && !destDescriptor.writable && !('value' in destDescriptor)) {
          if (debug) {
            console.log('------------------ expandPrototypeChain [SKIPPED] ------------------');
            console.log('The destination descriptor is not writable, skipped!');
            console.log([...paths, key], destDescriptor);
          }
          return;
        }
        /* v8 ignore stop */
        try {
          result[key] = source[key];
        } catch (error) {
          // Silent failure
        }
        if (preserveDescriptors) {
          checkDescriptor(key, descriptor);
        }
      });
    };

    assign(proto);
    assign(source);

    const childDescriptors = Object.getOwnPropertyDescriptors(source);
    for (const key of getFullKeys(result)) {
      result[key] = expandPrototypeChainRecursively(result[key], {
        ...options,
        patches,
        descriptors,
        types,
        circular,
        refs,
        paths: [...paths, typeof key === 'string' && key.match(/^\d+$/) ? Number(key) : key],
      });
      const descriptor = childDescriptors[key as string];
      if (descriptor) {
        if (descriptor.get) {
          expandPrototypeChainRecursively(descriptor.get, {
            ...options,
            patches,
            descriptors,
            types,
            circular,
            refs,
            paths: [...paths, key, SymbolForGetDescriptor],
          });
        }
        if (descriptor.set) {
          expandPrototypeChainRecursively(descriptor.set, {
            ...options,
            patches,
            descriptors,
            types,
            circular,
            refs,
            paths: [...paths, key, SymbolForSetDescriptor],
          });
        }
      }
    }
  } else {
    // For primitive types, just return the source
    result = source;
  }

  // Copy extra context, only for function and array, which can't hold custom properties in JSON format
  addPatch(result, { paths, patches });
  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addPatch(result: any, options: { paths: PathType[]; patches: PatchInfo[] }) {
  const { paths, patches } = options;
  if (Array.isArray(result) || typeof result === 'function') {
    let skipKeys: string[] = [];
    if (Array.isArray(result)) {
      skipKeys = ['length'];
    } else {
      skipKeys = ['length', 'name', 'arguments', 'caller'];
    }
    const patchValueKeys = getFullKeys(result).filter((key) => !skipKeys.includes(key as string));
    if (patchValueKeys.length > 0) {
      const patchValue: Record<string | symbol, unknown> = {};
      let hasExtra = false;
      patchValueKeys.forEach((key) => {
        // should not copy the constructor, because it's always Function and not a regular property
        if (key === 'constructor') return;
        if (typeof key === 'symbol' || !key.match(/^\d+$/)) {
          hasExtra = true;
          patchValue[key] = result[key];
        }
      });
      if (hasExtra) {
        patches.push({
          path: paths,
          patch: patchValue,
        });
        for (const key of getFullKeys(result)) {
          addPatch(result[key], {
            paths: [...paths, key],
            patches,
          });
        }
      }
    }
  }
}
