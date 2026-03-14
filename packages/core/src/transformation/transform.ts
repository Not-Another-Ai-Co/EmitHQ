// @emithq/core — Payload transformation engine
// Zero-dependency JSONPath subset + template interpolation

/** A single field mapping rule */
export interface TransformRule {
  /** JSONPath expression (dot-notation subset): $.data.user.email */
  sourcePath: string;
  /** Output field name */
  targetField: string;
  /** Optional template with {{...}} interpolation */
  template?: string;
}

const MAX_RULES = 20;
const MAX_PATH_LENGTH = 256;
const MAX_TEMPLATE_LENGTH = 512;
const MAX_TARGET_FIELD_LENGTH = 64;
const TARGET_FIELD_RE = /^[a-zA-Z0-9_.-]{1,64}$/;
const BLOCKED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const TEMPLATE_RE = /\{\{([^}]+)\}\}/g;

// ─── Validation ─────────────────────────────────────────────────────────────

/** Validate transformation rules before storage. Throws on invalid input. */
export function validateTransformRules(rules: unknown): TransformRule[] {
  if (!Array.isArray(rules)) {
    throw new TransformValidationError('transformRules must be an array');
  }
  if (rules.length > MAX_RULES) {
    throw new TransformValidationError(`Maximum ${MAX_RULES} transformation rules allowed`);
  }

  return rules.map((rule, i) => {
    if (typeof rule !== 'object' || rule === null) {
      throw new TransformValidationError(`Rule ${i}: must be an object`);
    }
    const r = rule as Record<string, unknown>;

    if (typeof r.sourcePath !== 'string' || !r.sourcePath.startsWith('$')) {
      throw new TransformValidationError(`Rule ${i}: sourcePath must be a string starting with $`);
    }
    if (r.sourcePath.length > MAX_PATH_LENGTH) {
      throw new TransformValidationError(
        `Rule ${i}: sourcePath exceeds ${MAX_PATH_LENGTH} characters`,
      );
    }

    if (typeof r.targetField !== 'string' || !TARGET_FIELD_RE.test(r.targetField)) {
      throw new TransformValidationError(
        `Rule ${i}: targetField must match ${TARGET_FIELD_RE} (max ${MAX_TARGET_FIELD_LENGTH} chars)`,
      );
    }

    if (r.template !== undefined) {
      if (typeof r.template !== 'string') {
        throw new TransformValidationError(`Rule ${i}: template must be a string`);
      }
      if (r.template.length > MAX_TEMPLATE_LENGTH) {
        throw new TransformValidationError(
          `Rule ${i}: template exceeds ${MAX_TEMPLATE_LENGTH} characters`,
        );
      }
    }

    return {
      sourcePath: r.sourcePath,
      targetField: r.targetField,
      template: r.template as string | undefined,
    };
  });
}

export class TransformValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransformValidationError';
  }
}

// ─── JSONPath extraction ────────────────────────────────────────────────────

/**
 * Extract a value from a JSON object using a dot-notation JSONPath subset.
 * Supports: $.key, $.key.nested, $.arr[0], $.obj['key-with-dashes']
 */
export function extractJsonPath(obj: unknown, path: string): unknown {
  if (!path.startsWith('$')) {
    throw new Error('JSONPath must start with $');
  }

  if (path === '$') return obj;

  const tokens = tokenizePath(path.slice(1));
  let current: unknown = obj;

  for (const token of tokens) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    if (typeof token === 'string' && BLOCKED_KEYS.has(token)) {
      return undefined;
    }
    current = (current as Record<string | number, unknown>)[token];
  }

  return current;
}

/** Tokenize a JSONPath suffix into property keys and array indices. */
function tokenizePath(pathSuffix: string): Array<string | number> {
  const tokens: Array<string | number> = [];
  let i = 0;

  while (i < pathSuffix.length) {
    if (pathSuffix[i] === '.') {
      i++; // skip dot
      // Read key until next . or [
      let key = '';
      while (i < pathSuffix.length && pathSuffix[i] !== '.' && pathSuffix[i] !== '[') {
        key += pathSuffix[i];
        i++;
      }
      if (key) tokens.push(key);
    } else if (pathSuffix[i] === '[') {
      i++; // skip [
      if (pathSuffix[i] === "'") {
        // Bracket notation: ['key']
        i++; // skip opening quote
        let key = '';
        while (i < pathSuffix.length && pathSuffix[i] !== "'") {
          key += pathSuffix[i];
          i++;
        }
        i++; // skip closing quote
        i++; // skip ]
        tokens.push(key);
      } else {
        // Array index: [0]
        let numStr = '';
        while (i < pathSuffix.length && pathSuffix[i] !== ']') {
          numStr += pathSuffix[i];
          i++;
        }
        i++; // skip ]
        tokens.push(parseInt(numStr, 10));
      }
    } else {
      i++;
    }
  }

  return tokens;
}

// ─── Template rendering ─────────────────────────────────────────────────────

/** Render a template string, replacing {{...}} expressions with extracted values. */
export function renderTemplate(template: string, payload: unknown): string {
  return template.replace(TEMPLATE_RE, (_, expr: string) => {
    const trimmed = expr.trim();
    const result = evaluateExpression(trimmed, payload);
    if (result === undefined || result === null) return '';
    return String(result);
  });
}

function evaluateExpression(expr: string, payload: unknown): unknown {
  // Function call: formatDate($.path, 'fmt')
  const fnMatch = expr.match(/^(\w+)\((.+)\)$/);
  if (fnMatch) {
    return callBuiltin(fnMatch[1], fnMatch[2], payload);
  }
  // JSONPath extraction
  if (expr.startsWith('$')) {
    return extractJsonPath(payload, expr);
  }
  // Literal string (unquoted)
  return expr;
}

function callBuiltin(name: string, argsStr: string, payload: unknown): unknown {
  // Parse args: split by comma, trim, resolve JSONPath args
  const args = splitArgs(argsStr).map((a) => {
    const trimmed = a.trim();
    if (trimmed.startsWith('$')) return extractJsonPath(payload, trimmed);
    // Strip surrounding quotes
    if (
      (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
      (trimmed.startsWith('"') && trimmed.endsWith('"'))
    ) {
      return trimmed.slice(1, -1);
    }
    return trimmed;
  });

  switch (name) {
    case 'formatDate':
      return formatDate(args[0], String(args[1] ?? 'YYYY-MM-DD'));
    case 'uppercase':
      return args[0] !== undefined && args[0] !== null ? String(args[0]).toUpperCase() : '';
    case 'lowercase':
      return args[0] !== undefined && args[0] !== null ? String(args[0]).toLowerCase() : '';
    case 'concat':
      return args.map((a) => (a === undefined || a === null ? '' : String(a))).join('');
    default:
      return `[unknown function: ${name}]`;
  }
}

/** Split function arguments by comma, respecting quoted strings. */
function splitArgs(argsStr: string): string[] {
  const args: string[] = [];
  let current = '';
  let inQuote: string | null = null;

  for (let i = 0; i < argsStr.length; i++) {
    const ch = argsStr[i];
    if (inQuote) {
      current += ch;
      if (ch === inQuote) inQuote = null;
    } else if (ch === "'" || ch === '"') {
      inQuote = ch;
      current += ch;
    } else if (ch === ',') {
      args.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current) args.push(current);
  return args;
}

/** Format a date value using simple pattern tokens. */
function formatDate(value: unknown, format: string): string {
  const d = new Date(String(value));
  if (isNaN(d.getTime())) return String(value ?? '');
  const pad = (n: number) => String(n).padStart(2, '0');
  return format
    .replace('YYYY', String(d.getUTCFullYear()))
    .replace('MM', pad(d.getUTCMonth() + 1))
    .replace('DD', pad(d.getUTCDate()))
    .replace('HH', pad(d.getUTCHours()))
    .replace('mm', pad(d.getUTCMinutes()))
    .replace('ss', pad(d.getUTCSeconds()));
}

// ─── Transformation engine ──────────────────────────────────────────────────

/**
 * Apply transformation rules to a payload.
 * Returns a new object with fields mapped according to the rules.
 * If rules is null/undefined/empty, returns the original payload (passthrough).
 */
export function applyTransformation(
  payload: unknown,
  rules: TransformRule[] | null | undefined,
): unknown {
  if (!rules || rules.length === 0) return payload;

  const output: Record<string, unknown> = {};
  for (const rule of rules) {
    if (rule.template) {
      output[rule.targetField] = renderTemplate(rule.template, payload);
    } else {
      output[rule.targetField] = extractJsonPath(payload, rule.sourcePath);
    }
  }
  return output;
}

/**
 * Preview a transformation: show the original payload and the transformed result.
 * Used by the preview API endpoint.
 */
export function previewTransformation(
  payload: unknown,
  rules: TransformRule[],
): { original: unknown; transformed: unknown } {
  const validated = validateTransformRules(rules);
  return {
    original: payload,
    transformed: applyTransformation(payload, validated),
  };
}
