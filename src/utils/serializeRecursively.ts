import type { InternalStringifyOptions } from '../types';
import { DefaultEndTag, DefaultStartTag } from './consts';
import { toSymbolString, WellKnownSymbols } from './symbol';

export function serializeRecursively(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  source: any,
  options: InternalStringifyOptions & {
    printLabel?: string;
    printPath?: (options: Pick<InternalStringifyOptions, 'parentPath'> & { key: string }) => void;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<keyof any, any> | any[] | string | undefined {
  const {
    startTag: ST = DefaultStartTag,
    endTag: ET = DefaultEndTag,
    parentPath = [],
    debug,
    printLabel,
    printPath,
  } = options ?? {};
  // const source = obj;
  if (debug && !parentPath.length) {
    console.log(
      `------------------ serializeRecursively${printLabel ? ` (${printLabel})` : ''}`,
      ['BEGIN'],
      ' ------------------'
    );
    console.log(source);
  }
  if (source === null) {
    return `${ST}null${ET}`;
  } else if (source === undefined) {
    return undefined;
  } else if ('isRawJSON' in JSON && typeof JSON.isRawJSON === 'function' && JSON.isRawJSON(source)) {
    return source;
  } else if (typeof source === 'number') {
    if (Number.isNaN(source)) {
      return `${ST}NaN${ET}`;
    } else if (source === Number.POSITIVE_INFINITY) {
      return `${ST}Infinity${ET}`;
    } else if (source === Number.NEGATIVE_INFINITY) {
      return `${ST}-Infinity${ET}`;
    } else {
      return `${ST}${source}${ET}`;
    }
  } else if (source instanceof Date) {
    if (Number.isNaN(source.getTime())) {
      return `${ST}new Date(NaN)${ET}`;
    }
    return `${ST}new Date('${source.toISOString()}')${ET}`;
  } else if (typeof source === 'bigint') {
    return `${ST}BigInt('${source.toString()}')${ET}`;
  } else if (source instanceof RegExp) {
    return `${ST}new RegExp('${source.source.replace(/\\\\/g, '\\')}', '${source.flags ?? ''}')${ET}`;
    // `value instanceof Date` never works, try testing date format instead
  } else if (typeof source === 'symbol') {
    if (WellKnownSymbols.includes(source)) {
      return `${ST}${source.description}${ET}`;
    } else if (Symbol.keyFor(source)) {
      return `${ST}Symbol.for('${Symbol.keyFor(source)}')${ET}`;
    }
    return `${ST}Symbol('${source.description}')${ET}`;
  } else if (source instanceof Error) {
    return `${ST}new Error('${source.message}')${ET}`;
  } else {
    if (typeof source === 'object') {
      // todo: 反序列化时，需要反解析两次，第一次作为source，第二个作为target。避免在处理types或apis时，source被修改从而导致patches获取不到子代的值
      // Save the symbol keys to a string property, because symbol keys are not serializable.
      // They will be restored in the deserialization process.

      for (const symbol of Object.getOwnPropertySymbols(source)) {
        // only predefined symbols and keyed symbols are preserved
        const symbolString = toSymbolString(symbol);
        const subValue = source[symbol];
        if (!symbolString || subValue === null) {
          continue;
        }
        source[symbolString] = subValue;
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete source[symbol];
      }
      Object.keys(source).forEach((key) => {
        const subValue = source[key];
        const serializedValue = serializeRecursively(subValue, {
          ...options,
          parentPath: [...parentPath, key],
          printLabel,
        });
        if (debug) {
          console.log(
            `------------------ serializeRecursively${printLabel ? ` (${printLabel})` : ''}`,
            printPath ? printPath({ parentPath, key }) : [...parentPath, key],
            ' ------------------'
          );
          console.log('value:', subValue);
          console.log('result:');
          console.log(serializedValue);
        }
        source[key] = serializedValue;
      });
      return source;
    } else if (typeof source === 'function') {
      let funcStr = serializeFunction(source.toString());
      if (funcStr === undefined) {
        return undefined;
      }
      funcStr = funcStr.replace(/"/g, "'");
      return `${ST}(${funcStr})${ET}`;
    } else {
      // rest primitive types, including boolean and string
      return source;
    }
  }
}

export function serializeFunction(funcStr: string) {
  if (funcStr.includes('{ [native code] }')) {
    return undefined;
  }
  if (
    // function () {}
    !funcStr.startsWith('function') &&
    // async function () {}
    !funcStr.startsWith('async function') &&
    // class {}
    !funcStr.startsWith('class') &&
    // function* () {}
    !funcStr.startsWith('function*') &&
    // async function* () {}
    !funcStr.startsWith('async function*') &&
    // () => {}
    !funcStr.replace(/\s/g, '').match(/^\(?[^)]+\)?=>/)
  ) {
    // If it's a computed property function, for example: { [Symbol.toPrimitive]() { return 1; } }
    // the funcStr is like: `[Symbol.toPrimitive]() { return 1; }`, so we can safely remove it.
    funcStr = funcStr.replace(/^\[[^\]]+\]/, '');
    funcStr = `function ${funcStr}`;
  }
  return funcStr;
}
