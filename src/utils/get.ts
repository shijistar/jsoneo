/**
 * Gets the value at path of object. If the resolved value is undefined, the defaultValue is
 * returned in its place.
 *
 * @param obj - The object to query
 * @param path - The path of the property to get (accepts strings, numbers, and symbols)
 * @param defaultValue - The value returned for undefined resolved values
 *
 * @returns The resolved value
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getByPath(obj: any, path: (string | number | symbol)[], defaultValue?: any): any {
  // Handle null/undefined objects
  if (obj == null) {
    return defaultValue;
  }

  // Handle empty path
  if (!path || path.length === 0) {
    return obj;
  }

  let current = obj;
  for (const key of path) {
    if (current == null) {
      return defaultValue;
    }
    current = current[key];
  }
  return current === undefined ? defaultValue : current;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getFullKeys(obj: any): (string | symbol)[] {
  if (obj == null) {
    return [];
  }
  return [...Object.getOwnPropertyNames(obj), ...Object.getOwnPropertySymbols(obj)].filter((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(obj, key);
    return descriptor && ('value' in descriptor || descriptor.get);
  });
}
