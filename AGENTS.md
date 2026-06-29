# OpenCode Instructions (AGENTS.md)

This file contains high-signal context for AI agents working in the InvoTrack repository.

## Core Architectural Constraints

- **Language**: Strictly **JavaScript (JS/JSX)**. No migration to TypeScript allowed.
- **Project Structure**: Feature-based under `src/features/{feature_name}/`.
- **Imports**: Always use `@/` alias for `src/` (e.g., `import X from '@/lib/...'`). Never use deep relative paths.
- **Responsibility Separation**: 
  - Never import React Contexts (`AuthContext`, `CompanyContext`) directly in `services/`.
  - Pass `company_id` and `user_id` as explicit arguments to service functions.
- **Database/RLS**:
  - Row Level Security (RLS) is mandatory on ALL tables. Never disable it.
  - Every query involving business data must be scoped by `company_id`.
  - Use `NUMERIC(15, 2)` for all monetary fields in PostgreSQL.

## Development Workflow & Commands

- **Start Dev**: `npm run dev`
- **Lint**: `npm run lint`
- **Test**: 
  - `npm run test` (runs all vitest tests)
  - `npm run test:watch` (watch mode)
  - `npm run test:coverage` (with coverage)
- **Database**:
  - Schema definition: `supabase/schema.sql`
  - Migrations: `supabase/migrations/` (Use incremental SQL files).

## Testing Quirks

- **Framework**: Vitest + `fast-check` (property-based testing).
- **Setup**: Tests must be located in `src/features/{feature}/__tests__/`.
- **Property Testing**: When adding complex logic, prioritize property-based tests using `fast-check` to validate invariants (e.g., confidence clamping, CUIT validation).

## Gotchas

- **Environment**: Ensure `.env` is populated with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- **OCR**: New OCR providers must extend `BaseOcrAdapter` and implement `extractText(file)`.
- **Hooks**: Avoid synchronous `setState` calls inside `useEffect` bodies to prevent cascading renders.
