export function formatValue(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function getTypeSummary(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return `Array[${value.length}]`;
  const typeName = Object.prototype.toString.call(value).slice(8, -1);
  if (typeName !== 'Object') return typeName;
  return `Object{${Object.keys(value as object).length}}`;
}

export interface RoundTripResult {
  passed: boolean;
  reason: string;
}

export function checkRoundTrip(original: unknown, restored: unknown): RoundTripResult {
  if (original === restored) return { passed: true, reason: 'Identical references' };
  if (typeof original === 'function' && typeof restored === 'function') {
    return { passed: true, reason: 'Both functions (bodies may differ, closure not captured)' };
  }
  if (typeof original !== typeof restored)
    return { passed: false, reason: `Type mismatch: ${typeof original} vs ${typeof restored}` };
  try {
    const origStr = JSON.stringify(original);
    const restStr = JSON.stringify(restored);
    if (origStr === restStr) return { passed: true, reason: 'JSON stringify match' };
  } catch {}
  return { passed: false, reason: 'Values differ after round-trip' };
}

// Type definitions for the jsoneo API - actual imports done in stories
export type StringifyFn = (value: unknown, options?: { preserveDescriptors?: boolean; debug?: boolean }) => string;
export type ParseFn = (
  input: string,
  options?: { closure?: Record<string, unknown>; debug?: boolean; prettyPrint?: boolean },
) => unknown;
