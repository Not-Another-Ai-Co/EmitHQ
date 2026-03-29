# X Seed Posts — @EmitHQ

5 initial posts to establish an active technical profile. Non-promotional. Each stands alone as useful content.

Post manually via Postiz UI at http://100.82.36.13:4007 or X directly. Space them out — 1-2 per day over 3 days.

---

## Post 1: Persist-before-enqueue

If your webhook queue loses a job, what happens to the message?

Most queue-first architectures lose it silently. We write every message to PostgreSQL inside a transaction BEFORE touching Redis. The queue is best-effort — the database is the source of truth.

If Redis dies, a recovery sweep re-enqueues pending attempts from the DB. Zero message loss.

---

## Post 2: AGPL licensing

Why AGPL instead of MIT for infrastructure software?

MIT lets AWS clone your project as a managed service. AGPL requires anyone offering it as a service to share their modifications.

Self-hosting? No restrictions. Running it for your own infra? No restrictions. The copyleft only triggers when you offer it _to others_ as a service.

---

## Post 3: Full-jitter backoff

Exponential backoff with decorrelated jitter still clusters retries near the delay cap.

Full jitter: delay = random(0, cap). Spreads retries uniformly across the window. A recovering endpoint gets a steady trickle instead of a synchronized burst.

AWS wrote about this in 2015. Most webhook platforms still don't implement it.

---

## Post 4: SSRF in webhook delivery

Your webhook delivery worker POSTs to customer-provided URLs. Without validation, someone registers http://169.254.169.254/latest/meta-data/ and reads your cloud credentials.

Blocking the IP at registration isn't enough — DNS rebinding attacks resolve to a public IP during validation, then switch to an internal IP at delivery time.

Validate at both points. Resolve DNS twice.

---

## Post 5: The pricing gap

Webhook infrastructure costs ~$400/mo at 50M events. That's enough to serve 400+ customers.

Svix charges $490/mo for their first paid tier. Hookdeck jumps to $499.

The pricing reflects the business model (VC-backed, enterprise-focused), not the cost of delivery. There's room for something in between.
