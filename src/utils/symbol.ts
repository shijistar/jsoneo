export const WellKnownSymbols = getWellKnownSymbols();

export function getWellKnownSymbols() {
  return Object.keys(Object.getOwnPropertyDescriptors(Symbol))
    .map((key) => {
      if (typeof Symbol[key as keyof typeof Symbol] === 'symbol') {
        return Symbol[key as keyof typeof Symbol];
      }
      return undefined;
    })
    .filter(Boolean) as symbol[];
}

export function toSymbolString(symbol: symbol): string | undefined {
  if (WellKnownSymbols.includes(symbol)) {
    return `[${symbol.description}]`;
  } else if (Symbol.keyFor(symbol)) {
    return `[Symbol.for('${Symbol.keyFor(symbol)}')]`;
  } else if (symbol.description) {
    return `[Symbol('${symbol.description}')]`;
  }
  return undefined;
}
