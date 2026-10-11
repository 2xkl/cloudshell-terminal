# CloudShell - Agent Instructions

This file provides guidance to AI Agents when working with code in this repository.

## Quick Reference
- **Type**: Full-stack web application
- **Backend**: TypeScript + Express + Prisma + PostgreSQL
- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Infrastructure**: Docker Compose

## Key Files
- Architecture: `../docs_przeprogramowani/ARCHITECTURE.md`
- PRD: `context/foundation/prd.md`
- Tech Stack: `context/foundation/tech-stack.md`
- Lessons: `context/foundation/lessons.md`

## Commands
```bash
# Development
cd docker && docker-compose up -d    # Start infra
cd src/backend && npm run dev        # Backend
cd src/frontend && npm run dev       # Frontend

# Database
cd src/backend && npm run db:push    # Push schema
cd src/backend && npm run db:seed    # Seed data
```

## Conventions
1. **Error handling**: Always use AppError class, return `{ error: string }`
2. **Auth**: Use `authenticate` middleware, check permissions with `requirePermission`
3. **Validation**: Use Zod schemas for all request bodies
4. **State**: Use Zustand for global state, TanStack Query for server state
5. **Styling**: TailwindCSS utilities only, no custom CSS unless necessary

## Security
- Never commit secrets or .env files
- Always validate user input with Zod
- Check permissions before data access
- Use parameterized queries (Prisma handles this)

## Testing Approach
- Backend: Integration tests with supertest
- Frontend: Component tests with Vitest
- E2E: Playwright (when implemented)
