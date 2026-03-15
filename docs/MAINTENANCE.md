# Maintenance — EmitHQ

> Last verified: 2026-03-15

## Documentation Sync

- Update docs during implementation, not after
- `/catchup` detects drift (>10 commits since last `/document` audit)
- `/document` fixes drift and extracts knowledge

## Key Files

| File                 | Purpose                    | Update When                            |
| -------------------- | -------------------------- | -------------------------------------- |
| CLAUDE.md            | Project entry point for AI | Stack or architecture changes          |
| docs/ARCHITECTURE.md | System overview            | New components, data flow changes      |
| docs/CONVENTIONS.md  | Coding patterns            | New patterns established               |
| docs/DECISIONS.md    | Decision log (append-only) | Any architectural or business decision |
| docs/TICKETS.md      | Work tracking              | Every `/build` and `/plan`             |
| docs/MAINTENANCE.md  | This file                  | Process changes                        |

## Dependency Updates

- Review monthly for security patches
- Pin exact versions in package.json
- Test after every dependency update

## Database Migrations

- Use Drizzle ORM migrations (or raw SQL in `migrations/`)
- Never modify existing migrations — always create new ones
- Test migrations against a copy of production data before deploying
