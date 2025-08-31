export type PathType = string | number | symbol;
/** Information about a patch applied to an Array or function. */
export interface PatchInfo {
  path: PathType[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  patch: any;
}
export interface DescriptorInfo {
  ownerPath: PathType[];
  key: number | string | symbol;
  descriptor: Omit<PropertyDescriptor, 'value' | 'get' | 'set'> & {
    get?: string;
    set?: string;
  };
}
export interface TypeInfo {
  path: PathType[];
  type: string;
  metadata?: Record<string, unknown>;
}
export interface RefInfo {
  path: PathType[];
  from: PathType[];
}
export interface JsonApi {
  path: PathType[];
  fromJSON?: string;
  toJSON: string;
}

export interface SerializedResult {
  version?: string;
  startTag?: string;
  variablePrefix?: string;
  endTag?: string;
  source: string | undefined;
  types: TypeInfo[];
  apis: JsonApi[];
  patches: PatchInfo[];
  refs: RefInfo[];
  descriptors?: DescriptorInfo[];
}

export interface StringifyOptions {
  /** The start token to mark the start of the serialized string. Default is `$SJS$_`. */
  startTag?: string;
  /** The end token to mark the end of the serialized string. Default is `_$SJE$`. */
  endTag?: string;
  /** The prefix of the variable name to be used in the serialized string. Default is `$SJV$_`. */
  variablePrefix?: string;
  /** Whether to preserve the code of class constructor during serialization. Default is `false`. */
  preserveClassConstructor?: boolean;
  /**
   * Whether to preserve custom property descriptors during serialization. Default is `true`.
   *
   * - `true` - Preserve custom property descriptors of source objects.
   * - `false` - Do not preserve custom property descriptors, and replace with underlying values.
   */
  preserveDescriptors?: boolean;
  /** Whether to print debug information during serialization. Default is `false`. */
  debug?: boolean;
}

export type InternalStringifyOptions = StringifyOptions & {
  parentPath: PathType[] | undefined;
};

export interface ParseOptions {
  /**
   * The global closure variables for deserialization. If the deserialization code contains
   * functions which use some global variables or modules, it's a good idea to pass them here.
   */
  closure?: Record<string, unknown>;
  /**
   * The function to get a child value from source object. It's used to restore the patched values.
   *
   * Strongly recommended to use `lodash.get` method
   */
  get?: GetFunc;
  /**
   * Whether to pretty print the deserialized object. Default is `true`.
   *
   * - `true`: Pretty print the deserialized code with indentation and new lines, which is more
   *   readable, but may be a little different from the real execution code.
   * - `false` - Print the object in a single line, which is more compact and similar to the real
   *   execution code.
   */
  prettyPrint?: boolean;
  /** Whether to print debug information during serialization. Default is `false`. */
  debug?: boolean;
}

export interface InternalParseOptions extends ParseOptions {
  isPrinting?: boolean;
}

export type ExpandPrototypeChainOptions = {
  /** The parent path of the object */
  parentPath?: PathType[];
  /** The output patches to apply to the object after expanding the prototype chain. */
  patches: PatchInfo[];
  /** The output descriptors for the object after expanding the prototype chain. */
  descriptors: DescriptorInfo[];
  /** The output types for the object after expanding the prototype chain. */
  types: TypeInfo[];
  apis: JsonApi[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  circular: WeakMap<any, PathType[]>;
  /** The circular refs for the object after expanding the prototype chain. */
  refs: RefInfo[];
} & Pick<StringifyOptions, 'preserveClassConstructor' | 'preserveDescriptors' | 'debug'>;

/**
 * The function to get a child value from source object
 *
 * @param {any} obj - The object to get the value from.
 * @param {(string | number | symbol)[]} path - The path to the value.
 *
 * @returns {any} The value.
 */
export type GetFunc = (
  /** The object to get the value from */
  obj: unknown,
  /** The path to the value */
  path: (string | number | symbol)[]
) => unknown;
