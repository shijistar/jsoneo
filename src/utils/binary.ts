const TYPED_ARRAY_CTORS = {
  Int8Array,
  Uint8Array,
  Uint8ClampedArray,
  Int16Array,
  Uint16Array,
  Int32Array,
  Uint32Array,
  Float32Array,
  Float64Array,
  BigInt64Array: typeof BigInt64Array !== 'undefined' ? BigInt64Array : undefined!,
  BigUint64Array: typeof BigUint64Array !== 'undefined' ? BigUint64Array : undefined!,
};

export const TypedArrays = Object.values(TYPED_ARRAY_CTORS).filter(Boolean);

/** ArrayBuffer -> Base64 */
export function arrayBufferToBase64(buf: ArrayBuffer): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(buf).toString('base64');
  }
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    const sub = bytes.subarray(i, i + chunk);
    binary += String.fromCharCode.apply(null, Array.from(sub));
  }
  return btoa(binary);
}

/** Base64 -> ArrayBuffer */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  // Remove dataURL prefix
  const comma = base64.indexOf(',');
  if (base64.startsWith('data:') && comma !== -1) {
    base64 = base64.slice(comma + 1);
  }
  if (typeof Buffer !== 'undefined') {
    const b = Buffer.from(base64, 'base64');
    return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
  }
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/* Slice ArrayBufferView to a new ArrayBuffer in a safe way */
function sliceArrayBuffer(view: ArrayBufferView): ArrayBuffer {
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer;
}

/* Serialize TypedArray to a serialized result */
export function serializeTypedArray<T extends AnyTypedArray>(data: T): SerializedTypedArray<GetTypedArrayName<T>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctorName: TypedArrayNames = data.constructor && (data.constructor as any).name;
  if (!ctorName || !(ctorName in TYPED_ARRAY_CTORS)) {
    throw new Error('Unsupported TypedArray type: ' + ctorName);
  }
  const ab = sliceArrayBuffer(data);
  return {
    kind: 'TypedArray',
    type: ctorName,
    base64: arrayBufferToBase64(ab),
    byteLength: data.byteLength,
    length: data.length,
  } as SerializedTypedArray<GetTypedArrayName<T>>;
}

/** Serialize ArrayBuffer, DataView, TypedArray to a serialized result */
export function serializeBinary<T extends AnyTypedArray | ArrayBuffer | DataView>(
  value: T | ArrayBuffer | DataView
): T extends ArrayBuffer | DataView
  ? SerializedArrayBuffer
  : T extends AnyTypedArray
    ? SerializedTypedArray<GetTypedArrayName<T>>
    : never {
  if (value instanceof DataView) {
    const ab = sliceArrayBuffer(value);
    return {
      kind: 'DataView',
      base64: arrayBufferToBase64(ab),
      byteLength: ab.byteLength,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } satisfies SerializedArrayBuffer as any;
  }
  if (value instanceof ArrayBuffer) {
    return {
      kind: 'ArrayBuffer',
      base64: arrayBufferToBase64(value),
      byteLength: value.byteLength,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } satisfies SerializedArrayBuffer as any;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return serializeTypedArray(value) as any;
}

export function deserializeBinary<T extends AnyTypedArray>(
  obj: SerializedTypedArray<GetTypedArrayName<T>> | SerializedArrayBuffer
): T extends never ? ArrayBuffer | DataView : T {
  if (obj.kind === 'ArrayBuffer') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return base64ToArrayBuffer(obj.base64) as any;
  } else if (obj.kind === 'DataView') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new DataView(base64ToArrayBuffer(obj.base64)) as any;
  }
  if (obj.kind !== 'TypedArray') throw new Error('Invalid serialized typed array');
  const Ctor = TYPED_ARRAY_CTORS[obj.type];
  if (!Ctor) throw new Error('TypedArray constructor not available: ' + obj.type);
  const ab = base64ToArrayBuffer(obj.base64);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Ctor(ab) as any;
}

type TypedArrayNames = keyof typeof TYPED_ARRAY_CTORS;

type AnyTypedArray = InstanceType<(typeof TypedArrays)[number]>;

interface SerializedTypedArray<N extends TypedArrayNames> {
  kind: 'TypedArray';
  type: N;
  base64: string;
  byteLength: number;
  length: number;
}

interface SerializedArrayBuffer {
  kind: 'ArrayBuffer' | 'DataView';
  base64: string;
  byteLength: number;
}

type GetTypedArrayName<T extends AnyTypedArray> = {
  [K in keyof typeof TYPED_ARRAY_CTORS]: InstanceType<(typeof TYPED_ARRAY_CTORS)[K]> extends T ? K : never;
}[keyof typeof TYPED_ARRAY_CTORS];
