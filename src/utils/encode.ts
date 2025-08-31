export function stringToBase64(str: string) {
  // Node.js environment
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf-8').toString('base64');
  }
  // Browser environment
  return btoa(unescape(encodeURIComponent(str)));
}

export function base64ToString(base64: string) {
  // Node.js environment
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(base64, 'base64').toString('utf-8');
  }
  // Browser environment
  return decodeURIComponent(escape(atob(base64)));
}

/**
 * Escapes special characters in a string for use in a regular expression.
 *
 * @param regExp - The string to escape
 *
 * @returns The escaped string that can be safely used in a RegExp constructor
 */
export function escapeRegExp(
  regExp: string | RegExp,
  options?: { escapeTwice?: boolean; format?: (result: string) => string }
): string {
  const { escapeTwice = false, format } = options ?? {};
  const content = typeof regExp === 'string' ? regExp : regExp.source;
  // $& Indicates the entire matched string
  const result = content.replace(/[.*+?^${}()|[\]\\]/g, escapeTwice ? '\\\\$&' : '\\$&');
  return format ? format(result) : result;
}
