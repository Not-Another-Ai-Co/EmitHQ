import { describe, it, expect } from 'vitest';
import {
  extractJsonPath,
  renderTemplate,
  applyTransformation,
  previewTransformation,
  validateTransformRules,
  TransformValidationError,
} from './transform';
import type { TransformRule } from './transform';

// ─── JSONPath extraction ────────────────────────────────────────────────────

describe('extractJsonPath', () => {
  const payload = {
    data: {
      user: { name: 'Alice', email: 'alice@example.com' },
      items: [
        { id: 1, name: 'Widget' },
        { id: 2, name: 'Gadget' },
      ],
      'hyphen-key': 'value',
      nested: { deep: { value: 42 } },
    },
    type: 'order.created',
  };

  it('extracts root object with $', () => {
    expect(extractJsonPath(payload, '$')).toEqual(payload);
  });

  it('extracts top-level field', () => {
    expect(extractJsonPath(payload, '$.type')).toBe('order.created');
  });

  it('extracts nested field', () => {
    expect(extractJsonPath(payload, '$.data.user.name')).toBe('Alice');
  });

  it('extracts deeply nested field', () => {
    expect(extractJsonPath(payload, '$.data.nested.deep.value')).toBe(42);
  });

  it('extracts array element by index', () => {
    expect(extractJsonPath(payload, '$.data.items[0].name')).toBe('Widget');
    expect(extractJsonPath(payload, '$.data.items[1].id')).toBe(2);
  });

  it('extracts bracket-notation key with hyphens', () => {
    expect(extractJsonPath(payload, "$.data['hyphen-key']")).toBe('value');
  });

  it('returns undefined for missing path', () => {
    expect(extractJsonPath(payload, '$.data.nonexistent')).toBeUndefined();
    expect(extractJsonPath(payload, '$.data.user.age')).toBeUndefined();
  });

  it('returns undefined for path through non-object', () => {
    expect(extractJsonPath(payload, '$.type.nested')).toBeUndefined();
  });

  it('returns undefined for out-of-bounds array index', () => {
    expect(extractJsonPath(payload, '$.data.items[99]')).toBeUndefined();
  });

  it('blocks __proto__ access', () => {
    expect(extractJsonPath(payload, '$.__proto__')).toBeUndefined();
  });

  it('blocks constructor access', () => {
    expect(extractJsonPath(payload, '$.constructor')).toBeUndefined();
  });

  it('blocks prototype access', () => {
    expect(extractJsonPath(payload, '$.prototype')).toBeUndefined();
  });

  it('handles null payload', () => {
    expect(extractJsonPath(null, '$.key')).toBeUndefined();
  });

  it('throws if path does not start with $', () => {
    expect(() => extractJsonPath(payload, 'data.user')).toThrow('JSONPath must start with $');
  });
});

// ─── Template rendering ─────────────────────────────────────────────────────

describe('renderTemplate', () => {
  const payload = {
    user: { name: 'Bob', email: 'bob@test.com' },
    amount: 9900,
    created: '2026-03-13T12:00:00Z',
    empty: null,
  };

  it('interpolates simple JSONPath expressions', () => {
    expect(renderTemplate('Hello {{$.user.name}}!', payload)).toBe('Hello Bob!');
  });

  it('interpolates multiple expressions', () => {
    expect(renderTemplate('{{$.user.name}} - {{$.user.email}}', payload)).toBe(
      'Bob - bob@test.com',
    );
  });

  it('renders missing values as empty string', () => {
    expect(renderTemplate('Hi {{$.user.missing}}!', payload)).toBe('Hi !');
  });

  it('renders null values as empty string', () => {
    expect(renderTemplate('Val: {{$.empty}}', payload)).toBe('Val: ');
  });

  it('renders numeric values as strings', () => {
    expect(renderTemplate('Amount: {{$.amount}}', payload)).toBe('Amount: 9900');
  });

  it('returns literal text when no expressions', () => {
    expect(renderTemplate('plain text', payload)).toBe('plain text');
  });

  it('handles formatDate function', () => {
    const result = renderTemplate("{{formatDate($.created, 'YYYY-MM-DD')}}", payload);
    expect(result).toBe('2026-03-13');
  });

  it('handles formatDate with time', () => {
    const result = renderTemplate("{{formatDate($.created, 'YYYY-MM-DD HH:mm:ss')}}", payload);
    expect(result).toBe('2026-03-13 12:00:00');
  });

  it('handles uppercase function', () => {
    expect(renderTemplate('{{uppercase($.user.name)}}', payload)).toBe('BOB');
  });

  it('handles lowercase function', () => {
    expect(renderTemplate('{{lowercase($.user.email)}}', payload)).toBe('bob@test.com');
  });

  it('handles concat function', () => {
    expect(renderTemplate("{{concat($.user.name, ' <', $.user.email, '>')}}", payload)).toBe(
      'Bob <bob@test.com>',
    );
  });

  it('handles unknown function gracefully', () => {
    expect(renderTemplate('{{unknownFn($.user.name)}}', payload)).toBe(
      '[unknown function: unknownFn]',
    );
  });

  it('handles formatDate with invalid date', () => {
    const data = { ts: 'not-a-date' };
    expect(renderTemplate("{{formatDate($.ts, 'YYYY-MM-DD')}}", data)).toBe('not-a-date');
  });
});

// ─── Transformation engine ──────────────────────────────────────────────────

describe('applyTransformation', () => {
  const payload = {
    event: 'invoice.paid',
    data: {
      invoice: { id: 'inv_123', amount: 4999, currency: 'usd' },
      customer: { email: 'alice@example.com', name: 'Alice' },
    },
  };

  it('maps fields using sourcePath', () => {
    const rules: TransformRule[] = [
      { sourcePath: '$.data.customer.email', targetField: 'email' },
      { sourcePath: '$.data.invoice.amount', targetField: 'amount' },
      { sourcePath: '$.event', targetField: 'type' },
    ];

    const result = applyTransformation(payload, rules) as Record<string, unknown>;
    expect(result.email).toBe('alice@example.com');
    expect(result.amount).toBe(4999);
    expect(result.type).toBe('invoice.paid');
  });

  it('maps fields using templates', () => {
    const rules: TransformRule[] = [
      {
        sourcePath: '$',
        targetField: 'message',
        template: 'Invoice {{$.data.invoice.id}} paid by {{$.data.customer.name}}',
      },
    ];

    const result = applyTransformation(payload, rules) as Record<string, unknown>;
    expect(result.message).toBe('Invoice inv_123 paid by Alice');
  });

  it('returns original payload when rules is null (passthrough)', () => {
    expect(applyTransformation(payload, null)).toBe(payload);
  });

  it('returns original payload when rules is empty array (passthrough)', () => {
    expect(applyTransformation(payload, [])).toBe(payload);
  });

  it('returns original payload when rules is undefined (passthrough)', () => {
    expect(applyTransformation(payload, undefined)).toBe(payload);
  });

  it('handles missing source values', () => {
    const rules: TransformRule[] = [{ sourcePath: '$.data.nonexistent', targetField: 'missing' }];
    const result = applyTransformation(payload, rules) as Record<string, unknown>;
    expect(result.missing).toBeUndefined();
  });

  it('handles mixed sourcePath and template rules', () => {
    const rules: TransformRule[] = [
      { sourcePath: '$.data.customer.email', targetField: 'email' },
      {
        sourcePath: '$',
        targetField: 'summary',
        template: '{{$.data.invoice.currency}} {{$.data.invoice.amount}}',
      },
    ];
    const result = applyTransformation(payload, rules) as Record<string, unknown>;
    expect(result.email).toBe('alice@example.com');
    expect(result.summary).toBe('usd 4999');
  });
});

// ─── Preview ────────────────────────────────────────────────────────────────

describe('previewTransformation', () => {
  it('returns original and transformed payloads', () => {
    const payload = { user: { name: 'Alice', email: 'a@b.com' } };
    const rules: TransformRule[] = [{ sourcePath: '$.user.email', targetField: 'email' }];

    const result = previewTransformation(payload, rules);
    expect(result.original).toEqual(payload);
    expect((result.transformed as Record<string, unknown>).email).toBe('a@b.com');
  });

  it('validates rules and throws on invalid', () => {
    expect(() =>
      previewTransformation({}, [{ sourcePath: 'no-dollar', targetField: 'x' }]),
    ).toThrow(TransformValidationError);
  });
});

// ─── Validation ─────────────────────────────────────────────────────────────

describe('validateTransformRules', () => {
  it('accepts valid rules', () => {
    const rules = [
      { sourcePath: '$.data.email', targetField: 'email' },
      { sourcePath: '$.data.name', targetField: 'name', template: 'Hi {{$.data.name}}' },
    ];
    const result = validateTransformRules(rules);
    expect(result).toHaveLength(2);
    expect(result[0].sourcePath).toBe('$.data.email');
  });

  it('rejects non-array input', () => {
    expect(() => validateTransformRules('not an array')).toThrow('must be an array');
  });

  it('rejects too many rules', () => {
    const rules = Array.from({ length: 21 }, (_, i) => ({
      sourcePath: `$.field${i}`,
      targetField: `field${i}`,
    }));
    expect(() => validateTransformRules(rules)).toThrow('Maximum 20');
  });

  it('rejects sourcePath not starting with $', () => {
    expect(() =>
      validateTransformRules([{ sourcePath: 'data.email', targetField: 'email' }]),
    ).toThrow('starting with $');
  });

  it('rejects sourcePath exceeding max length', () => {
    const longPath = '$.' + 'a'.repeat(260);
    expect(() => validateTransformRules([{ sourcePath: longPath, targetField: 'x' }])).toThrow(
      'exceeds',
    );
  });

  it('rejects invalid targetField characters', () => {
    expect(() =>
      validateTransformRules([{ sourcePath: '$.x', targetField: 'field with spaces' }]),
    ).toThrow('targetField');
  });

  it('rejects template exceeding max length', () => {
    const longTemplate = 'x'.repeat(520);
    expect(() =>
      validateTransformRules([{ sourcePath: '$.x', targetField: 'x', template: longTemplate }]),
    ).toThrow('template exceeds');
  });

  it('accepts rules with no template', () => {
    const result = validateTransformRules([{ sourcePath: '$.x', targetField: 'y' }]);
    expect(result[0].template).toBeUndefined();
  });

  it('rejects null rule in array', () => {
    expect(() => validateTransformRules([null])).toThrow('must be an object');
  });
});
