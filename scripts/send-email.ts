/**
 * CLI email sender for outreach campaigns.
 *
 * Usage:
 *   op run --env-file=.env.tpl -- tsx scripts/send-email.ts \
 *     --to "founder@example.com" \
 *     --subject "Subject line" \
 *     --body "Plain text body"
 *
 *   # Or read body from a file:
 *   op run --env-file=.env.tpl -- tsx scripts/send-email.ts \
 *     --to "founder@example.com" \
 *     --subject "Subject line" \
 *     --body-file docs/outreach/drafts/email-001.txt
 *
 *   # HTML email:
 *   op run --env-file=.env.tpl -- tsx scripts/send-email.ts \
 *     --to "founder@example.com" \
 *     --subject "Subject line" \
 *     --body "Plain text fallback" \
 *     --html "<p>HTML body</p>"
 *
 *   # Dry run (prints what would be sent, doesn't send):
 *   op run --env-file=.env.tpl -- tsx scripts/send-email.ts \
 *     --to "founder@example.com" \
 *     --subject "Test" \
 *     --body "Test" \
 *     --dry-run
 */

import { Resend } from 'resend';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    to: { type: 'string' },
    subject: { type: 'string' },
    body: { type: 'string' },
    'body-file': { type: 'string' },
    html: { type: 'string' },
    'html-file': { type: 'string' },
    from: { type: 'string', default: 'Julian Finnegan <julian@emithq.com>' },
    'reply-to': { type: 'string', default: 'julian@emithq.com' },
    'dry-run': { type: 'boolean', default: false },
  },
  strict: true,
});

if (!values.to) {
  console.error('Error: --to is required');
  process.exit(1);
}
if (!values.subject) {
  console.error('Error: --subject is required');
  process.exit(1);
}

function readSafeFile(filePath: string): string {
  const projectRoot = resolve(import.meta.dirname, '..');
  const resolved = resolve(filePath);
  if (!resolved.startsWith(projectRoot)) {
    console.error(`Error: file path must be within the project: ${filePath}`);
    process.exit(1);
  }
  if (!existsSync(resolved)) {
    console.error(`Error: file not found: ${filePath}`);
    process.exit(1);
  }
  return readFileSync(resolved, 'utf-8');
}

const body = values['body-file'] ? readSafeFile(values['body-file']) : values.body;

const html = values['html-file'] ? readSafeFile(values['html-file']) : values.html;

if (!body && !html) {
  console.error('Error: --body, --body-file, --html, or --html-file is required');
  process.exit(1);
}

const emailPayload = {
  from: values.from!,
  to: [values.to],
  subject: values.subject!,
  replyTo: values['reply-to'],
  ...(body ? { text: body } : {}),
  ...(html ? { html } : {}),
};

if (values['dry-run']) {
  console.log('DRY RUN — would send:');
  console.log(JSON.stringify(emailPayload, null, 2));
  process.exit(0);
}

if (!process.env.RESEND_API_KEY) {
  console.error(
    'Error: RESEND_API_KEY not set. Run with: op run --env-file=.env.tpl -- tsx scripts/send-email.ts',
  );
  process.exit(1);
}

const resend = new Resend(process.env.RESEND_API_KEY);

const { data, error } = await resend.emails.send(emailPayload);

if (error) {
  console.error('Send failed:', error);
  process.exit(1);
}

console.log(`Sent to ${values.to} — id: ${data?.id}`);
