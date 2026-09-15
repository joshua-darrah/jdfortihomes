# Maintenance Rules

## Code quality

Keep code simple, vertically formatted and easy to debug.

Prefer:

```ts
const value = records.filter((record) => record.active);
```

over compressed expressions that hide business rules.

Use comments for decisions and security-sensitive behavior.

## Database changes

- Never add a duplicate source of truth for an existing fact.
- Prefer foreign keys over repeated text values.
- Add constraints for rules the database can enforce.
- Add indexes only for real query patterns.
- Use focused migrations for existing production databases.
- Do not edit production data from a migration unless the migration is explicitly designed for that data change.

## Authentication and authorization

Authentication identifies the user. RLS and database functions authorize what that user can access or change.

Never rely on route hiding, disabled buttons or client-side role checks as the only security boundary.

## Dependencies

Do not add a package for a small feature that can be implemented reliably with existing platform APIs.

When upgrading Next.js, React or other core dependencies:

1. read the release notes;
2. update the lockfile;
3. run typecheck;
4. run a production build;
5. test authentication and booking flows;
6. test mobile Safari; and
7. review security advisories.

Do not run `npm audit fix --force` on production code without reviewing the resulting major-version changes.

## Mobile

Avoid desktop-only assumptions. Test layout at narrow widths and on Safari. Keep tap targets usable, respect safe-area insets and use local assets for core branding.

## Analytics

Do not add tracking scripts just to make the dashboard look more advanced. Use business records for operational analytics and add an explicit event model only when a new metric genuinely requires it.
