# Outreach Targets — Webhook Platform Users

> Generated: 2026-03-19
> Sources: GitHub code search for Svix, Hookdeck, and Convoy SDK usage
> Repos found: 50+ across all three platforms
> High-priority targets: 20 (email confirmed, active, startup/growth tier)

## Target List (Top 20)

| #   | Company       | Competitor | Repo                        | Maintainer         | Email                   | Segment        | Subject Line              |
| --- | ------------- | ---------- | --------------------------- | ------------------ | ----------------------- | -------------- | ------------------------- |
| 1   | Trigger.dev   | Svix       | triggerdotdev/trigger.dev   | Matt Aitken        | matt@mattaitken.com     | Dev tooling    | re: svix at trigger.dev   |
| 2   | Inbound Email | Svix       | inboundemail/inbound        | Ryan Vogel         | ryan@inbound.new        | API infra      | re: svix at inbound       |
| 3   | Meteroid      | Svix       | meteroid-oss/meteroid       | Artur Jurat        | artur@meteroid.com      | Billing        | re: svix at meteroid      |
| 4   | Notifuse      | Svix       | Notifuse/notifuse           | Pierre B.          | pierre@bazoge.com       | Email platform | re: svix at notifuse      |
| 5   | Autumn        | Svix       | useautumn/autumn            | John Yeo           | johnyeocx@gmail.com     | Billing        | re: svix at autumn        |
| 6   | FlexPrice     | Svix       | flexprice/flexprice         | Naveen Mishra      | nkmishra1997@gmail.com  | Billing        | re: svix at flexprice     |
| 7   | Superplane    | Svix       | superplanehq/superplane     | Igor Šarčević      | igisar@gmail.com        | DevOps         | re: svix at superplane    |
| 8   | Tesseral      | Svix       | tesseral-labs/tesseral      | Ulysse Carion      | ulyssecarion@gmail.com  | Auth           | re: svix at tesseral      |
| 9   | Hoop          | Svix       | hoophq/hoop                 | Rogerio Moura      | roger0.rm@gmail.com     | Security       | re: svix at hoop          |
| 10  | OpenMeter     | Svix       | openmeterio/openmeter       | Márk Sági-Kazár    | mark@sagikazarmark.com  | Billing        | re: svix at openmeter     |
| 11  | Checkmarble   | Convoy     | checkmarble/marble          | Pascal Delange     | pascal@checkmarble.com  | Fraud/AML      | re: convoy at checkmarble |
| 12  | ImportCSV     | Svix       | importcsv/importcsv         | Abhishek Ray       | abhishekray07@gmail.com | SaaS           | re: svix at importcsv     |
| 13  | Mangosqueezy  | Svix       | cluwise/mangosqueezy        | Amit Mirgal        | amit.s.mirgal@gmail.com | Affiliate      | re: svix at mangosqueezy  |
| 14  | Flanksource   | Svix       | flanksource/mission-control | Aditya Thebe       | contact@adityathebe.com | DevOps         | re: svix at flanksource   |
| 15  | KibaMail      | Hookdeck   | kibamail/kibamail           | Frantz Kati        | hey@katifrantz.com      | Email infra    | re: hookdeck at kibamail  |
| 16  | HandleUI      | Hookdeck   | handleui/detent             | Rodrigo Jiménez    | rodrigo@handleui.com    | CI/CD          | re: hookdeck at handleui  |
| 17  | Lotus         | Svix       | uselotus/lotus              | Diego Escobedo     | diego@escobedo.com      | Billing        | re: svix at lotus         |
| 18  | ColiVara      | Svix       | tjmlabs/ColiVara            | Jonathan Adly      | gadly0123@gmail.com     | AI/RAG         | re: svix at colivara      |
| 19  | Subsignal     | Hookdeck   | wizenheimer/subsignal       | Nayan Kumar        | xNayanKumar@gmail.com   | VC tooling     | re: hookdeck at subsignal |
| 20  | Hatchet       | Svix       | hatchet-dev/hatchet         | Alexander Belanger | belanger@sas.upenn.edu  | Dev tooling    | re: svix at hatchet       |

## Segments

| Segment                 | Targets                                        | Pricing Angle                                                     |
| ----------------------- | ---------------------------------------------- | ----------------------------------------------------------------- |
| Billing/Pricing infra   | Meteroid, Autumn, FlexPrice, Lotus, OpenMeter  | Sending billing webhooks to customers — reliability + cost matter |
| Dev tooling / workflows | Trigger.dev, Hatchet, Superplane               | High event volume, need retries + DLQ                             |
| API / integration infra | Inbound, ImportCSV, Checkmarble                | Webhook delivery is core product feature                          |
| Auth / security         | Tesseral, Hoop                                 | Auth event webhooks, compliance-adjacent                          |
| Email / notifications   | Notifuse, KibaMail                             | Email delivery → webhook delivery crossover                       |
| AI platforms            | ColiVara                                       | Processing completion webhooks                                    |
| Other SaaS              | Mangosqueezy, HandleUI, Subsignal, Flanksource | General webhook usage                                             |

## Subject Line A/B Plan

| Batch     | Targets                        | Subject Pattern                   |
| --------- | ------------------------------ | --------------------------------- |
| A (1-7)   | Trigger.dev through Superplane | `re: svix at {company}`           |
| B (8-14)  | Tesseral through Flanksource   | `webhook costs at {company}?`     |
| C (15-20) | KibaMail through Hatchet       | `noticed your {competitor} setup` |

## Follow-Up Schedule

- **Day 0:** Send initial email (from `docs/outreach/drafts/`)
- **Day 3:** Send follow-up (from `docs/outreach/templates/day3.txt`, personalize)
- **Day 10:** Send final touch (from `docs/outreach/templates/day10.txt`, personalize)

## Sending Command

```bash
export OP_CONNECT_HOST="http://localhost:8888"
export OP_CONNECT_TOKEN="$(grep OP_CONNECT_TOKEN ~/.bashrc | cut -d'"' -f2)"
export RESEND_API_KEY=$(op read "op://EmitHQ/resend/api-key" | tr -d '\n\r')
npx tsx scripts/send-email.ts \
  --to "target@example.com" \
  --subject "re: svix at company" \
  --body-file docs/outreach/drafts/001-trigger-dev.txt
```
