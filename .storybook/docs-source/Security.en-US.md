# Security

## Overview

jsoneo can restore functions, accessors, descriptors, prototype-related data, and other complex JavaScript structures. During `parse`, it generates and evaluates JavaScript code to rebuild the original value.

For this reason, **jsoneo is NOT a sandbox or security boundary**.

## Security Rules

### ✅ Safe Usage

```ts
// Only parse data produced by jsoneo.stringify()
const serialized = stringify(myTrustedObject);
const restored = parse(serialized); // Safe
```

### ❌ Unsafe Usage

```ts
// NEVER parse untrusted data
const userInput = getUserInput(); // From network, user, etc.
const result = parse(userInput); // DANGEROUS!

// NEVER parse arbitrary strings
const arbitrary = '{"malicious": "code"}';
const result = parse(arbitrary); // DANGEROUS!
```

## Why It's Unsafe

`parse()` uses `new Function()` to evaluate generated JavaScript code:

```ts
// Simplified internal logic
const code = generateDeserializationCode(serializedData);
return new Function('context', 'options', code)(closure, { get });
```

This means **any valid JavaScript code** in the serialized data will execute during parsing.

## Attack Vectors

### Code Injection

An attacker who controls the serialized string can execute arbitrary code:

```json
{
  "startTag": "$SJS$_",
  "endTag": "_$SJE$",
  "source": "{\"__proto__\":{\"constructor\":\"process.exit()\"}}"
}
```

### Prototype Pollution

Maliciously crafted data could exploit prototype chain restoration.

### Function Constructor Abuse

Since functions are reconstructed via `Function` constructor, an attacker could inject constructor calls.

## Mitigations

1. **Only parse trusted data** — from your own application, test fixtures, or controlled sources
2. **Validate before parsing** — if you must accept external data, validate its structure first
3. **Use native JSON for untrusted data** — `JSON.parse()` is safe for data-only exchange
4. **Don't expose parse to users** — never build an API that accepts arbitrary strings to parse
5. **Audit dependencies** — ensure your serialized data pipeline is secure end-to-end

## When to Use Native JSON Instead

| Scenario                              | Recommendation                     |
| ------------------------------------- | ---------------------------------- |
| User input / form data                | `JSON.parse()`                     |
| API responses from untrusted services | `JSON.parse()`                     |
| Configuration files from users        | `JSON.parse()`                     |
| Inter-service communication           | `JSON.parse()` or protocol buffers |
| Test fixtures you control             | `jsoneo.parse()`                   |
| Internal object snapshots             | `jsoneo.parse()`                   |
| Cross-runtime test sharing            | `jsoneo.parse()`                   |

## Reporting Security Issues

If you discover a security vulnerability, please report it responsibly:

- Email: shijistar@gmail.com
- GitHub Security Advisories: https://github.com/shijistar/jsoneo/security/advisories

Do NOT open public issues for security vulnerabilities.
