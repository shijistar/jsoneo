import type { StringifyOptions } from '../types';
import { TypedArrays } from './binary';
import { getFullKeys } from './get';

/**
 * Picks all prototype properties from the source object, including those from its prototype chain.
 *
 * @param source - The source object to pick properties from.
 * @param options - Options to control the behavior of the picking.
 */
export function pickPrototype(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  source: any,
  options?: Pick<StringifyOptions, 'preserveClassConstructor' | 'debug'>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string | symbol, any> {
  const { preserveClassConstructor = true, debug } = options ?? {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const target: Record<string | symbol, any> = Object.create(null);
  const ignoredKeys = [preserveClassConstructor ? undefined : 'constructor'].filter(Boolean) as (string | symbol)[];
  let proto = Object.getPrototypeOf(source);
  while (
    proto != null &&
    proto !== Object.prototype &&
    proto !== Array.prototype &&
    proto !== Function.prototype &&
    proto !== Map.prototype &&
    proto !== Set.prototype &&
    proto !== ArrayBuffer.prototype &&
    proto !== DataView.prototype &&
    !TypedArrays.some((t) => proto === t.prototype) &&
    (typeof Buffer === 'undefined' || proto !== Buffer.prototype)
  ) {
    const protoKeys = getFullKeys(proto);
    for (const key of protoKeys) {
      if (!(key in target) && !ignoredKeys.includes(key)) {
        try {
          // should use source[key] instead of proto[key], because the member may be a getter which
          // relies on some other members of source object
          target[key] = source[key];
        } catch (error) {
          if (debug) {
            console.warn('Error in expanding prototype chain:', error);
            console.log('key:', key);
            console.log('source:', source);
          }
        }
      }
    }
    proto = Object.getPrototypeOf(proto);
  }
  return target;
}
