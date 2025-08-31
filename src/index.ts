import type {
  DescriptorInfo,
  JsonApi,
  ParseOptions,
  PatchInfo,
  PathType,
  RefInfo,
  SerializedResult,
  StringifyOptions,
  TypeInfo,
} from './types';
import { DefaultEndTag, DefaultStartTag, VariablePrefix } from './utils/consts';
import { expandPrototypeChain } from './utils/expandPrototypeChain';
import { generateDeserializationCode } from './utils/format';
import { getByPath } from './utils/get';
import { serializeRecursively } from './utils/serializeRecursively';
import { version } from './version';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Notes:
 *
 * 1. Do not use 'closure' in the function, the function body can be serialized but the closure
 *    reference can't. If it's a class, set the closures to the class properties, and use 'this' to
 *    access them. If it's a normal function, set the closures to the function reference, and use
 *    the function name to access them.
 * 2. Do not use anonymous Symbols in both object keys and values. Use system predefined Symbols
 *    instead or use `Symbol.for` to create a Symbol. The anonymous Symbols can't be serialized and
 *    event cannot be created.
 * 3. No direct or indirect circular references are allowed.
 * 4. For classes, should avoid private properties and methods, because they are not accessible from
 *    outside and can't be serialized. Please use a normal property or method instead, and starts
 *    with `_` to indicate it's a private member. If you are using TypeScript, you can use the
 *    `private` keyword to declare as private, which looks a little better.
 * 5. Class constructors will be dropped.
 * 6. All native methods will be dropped, as `toString` method just returns `[native code]`.
 * 7. Do not use `function.bind`, because the bound functions become native methods.
 * 8. Respect `toJSON` and `fromJSON` method, if the object has a `toJSON` method, it will be called to
 *    get the serialized value. If the object has a `fromJSON` method, it will be called with
 *    serialized json to restore the original value.
 * 9. Make sure you trust the source of the serialized string, because the deserialization need to
 *    evaluate script codes. A carefully crafted strings may embed malicious code, thus posing a
 *    security threat.
 * 10. Buffer is supported in Node.js environment, and will be converted to Uint8Array in web browsers.
 */
/**
 * Advantages:
 *
 * 1. Supports serialization of complex JavaScript objects, including functions and prototypes.
 * 2. Supports serialization of Map, Set, ArrayBuffer, DataView, Blob, and other complex types.
 * 3. Supports serialization of circular references.
 * 4. Supports serialization of Symbol keys and values.
 * 5. Supports serialization of custom property descriptors.
 * 6. Supports serialization of non-enumerable properties.
 * 7. Supports toJSON and fromJSON methods for custom serialization and deserialization.
 * 8. Supports raw JSON objects (via JSON.rawJSON() method).
 */

/**
 * Serialize JavaScript object to string, support functions. Should including all fields of both
 * object and prototype.
 *
 * @param {any} value - The value to serialize.
 *
 * @returns The serialized string.
 */
export function stringify(value: any, options?: StringifyOptions): string {
  const { debug, preserveDescriptors = true } = options ?? {};
  const patches: PatchInfo[] = [];
  const descriptors: DescriptorInfo[] = [];
  const types: TypeInfo[] = [];
  const circular = new WeakMap<any, PathType[]>();
  const refs: RefInfo[] = [];
  const apis: JsonApi[] = [];
  const source = expandPrototypeChain(value, { ...options, patches, descriptors, types, apis, circular, refs });
  const serialized = serializeRecursively(source, {
    ...options,
    parentPath: [],
  });
  const result: SerializedResult = {
    startTag: options?.startTag ?? DefaultStartTag,
    endTag: options?.endTag ?? DefaultEndTag,
    version,
    source: JSON.stringify(serialized),
    patches: serializeRecursively(patches, {
      parentPath: [],
      debug,
      printLabel: 'patches',
      printPath: (options) => {
        const index = Number(options.parentPath?.[0]);
        if (index >= 0) {
          const patch = patches[index];
          return ['.patches', ...patch.path, options.key === 'path' ? '[path]' : options.key];
        }
        return ['.patches', ...(options.parentPath ?? []), options.key];
      },
    }) as PatchInfo[],
    types,
    apis,
    refs,
  };
  if (preserveDescriptors) {
    result.descriptors = descriptors;
  }
  if (debug) {
    console.log('------------------ stringify ', ['.types'], ' ------------------');
    console.log(types);
    console.log('------------------ stringify ', ['.patches'], ' ------------------');
    console.log(patches);
    if (preserveDescriptors) {
      console.log('------------------ stringify ', ['.descriptors'], ' ------------------');
    }
    console.log(descriptors);
    console.log('------------------ stringify ', ['.refs'], ' ------------------');
    console.log(refs);
    console.log('------------------ stringify ', ['FINAL'], ' ------------------');
    console.log(JSON.stringify(serialized));
  }
  return JSON.stringify(result);
}

/**
 * Deserialize JavaScript object from string, support functions. Should including all fields of both
 * object and prototype.
 *
 * @param {string} input - The string to deserialize.
 * @param {object} options - The options to deserialize.
 * @param {function} [options.closure] - The closure to use when deserializing the object.
 *
 * @returns The deserialized object.
 */
export function parse(input: string, options?: ParseOptions) {
  const { closure, get = getByPath, debug, prettyPrint = true } = options ?? {};
  if (!input) {
    return undefined;
  }
  const inputResult = JSON.parse(input) as SerializedResult;
  if (inputResult.source === undefined) {
    return undefined;
  }
  // return deserialize(inputResult, { ...options, closure });
  const { variablePrefix: VP = VariablePrefix } = inputResult;
  const code = generateDeserializationCode(inputResult, options ?? {});
  if (debug) {
    const printSourceCode = generateDeserializationCode(inputResult, { ...options, isPrinting: true });
    const prettyPrintCode = `\`${printSourceCode.replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\``;
    const realCode = `'${printSourceCode.replace(/\n/g, '\\n').replace(/'/g, "\\'")}'`;
    const printCode = prettyPrint ? prettyPrintCode : realCode;
    console.log('------------------ deserialize ------------------');
    console.log(
      `new Function('${VP}context', '${VP}options', ${printCode})(${closure ? 'closure' : 'undefined'}, { get: getByPath });
      ${getByPath.toString()}
      `,
      'closure =',
      closure
    );
  }
  return new Function(`${VP}context`, `${VP}options`, code)(closure, { get });
}
