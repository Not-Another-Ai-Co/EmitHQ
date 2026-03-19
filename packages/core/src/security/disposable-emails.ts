/**
 * Disposable/temporary email domain blocklist.
 * Prevents free-tier abuse via throwaway email signups.
 */
const DISPOSABLE_DOMAINS = new Set([
  // Major disposable email providers
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'tempmail.com',
  'temp-mail.org',
  'throwaway.email',
  'throwaway.email',
  'yopmail.com',
  'yopmail.fr',
  'sharklasers.com',
  'grr.la',
  'guerrillamailblock.com',
  'maildrop.cc',
  'mailnesia.com',
  'dispostable.com',
  'trashmail.com',
  'trashmail.net',
  'trashmail.me',
  'tempail.com',
  'tempr.email',
  'temp-mail.io',
  'fakeinbox.com',
  'mailcatch.com',
  'discard.email',
  'harakirimail.com',
  'mailexpire.com',
  'mohmal.com',
  'burnermail.io',
  'mytemp.email',
  'tempmailaddress.com',
  'emailondeck.com',
  'getnada.com',
  'inboxes.com',
  'jetable.org',
  'moakt.com',
  'tempinbox.com',
  'tmpmail.net',
  'tmpmail.org',
  'boun.cr',
  'mailsac.com',
  'tmail.ws',
  'tempmailo.com',
  'spamgourmet.com',
  'nada.email',
  'mailnull.com',
  'trashymail.com',
  'mintemail.com',
  'tempmailgen.com',
  'safetymail.info',
  '10minutemail.com',
  '10minute.email',
  'minutemail.com',
  'emailfake.com',
  'crazymailing.com',
  'mailtemp.net',
]);

/**
 * Check if an email address uses a disposable/temporary email domain.
 * @returns null if OK, or error message string if blocked
 */
export function isDisposableEmail(email: string): string | null {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return 'Invalid email format';
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return 'Disposable email addresses are not allowed. Please use a permanent email.';
  }
  return null;
}
