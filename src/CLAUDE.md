# CloudShell - Agent Instructions

## Project Overview
System emulujacy zachowanie CloudShell z RBAC, emulowanymi terminalami i snapshotami statusu.

## Tech Stack
- **Backend**: Node.js + TypeScript + Express + Prisma
- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Database**: PostgreSQL
- **Cache**: Redis
- **Infrastructure**: Docker + Docker Compose
- **Build Agents**: RHEL-based containers

## Project Structure
```
src/
├── backend/           # Express API server
│   ├── src/
│   │   ├── routes/    # API endpoints
│   │   ├── services/  # Business logic
│   │   ├── middleware/# Auth, error handling
│   │   └── types/     # TypeScript types
│   └── prisma/        # Database schema
├── frontend/          # React SPA
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── stores/
│       └── api/
├── shared/            # Shared types/utils
├── context/           # Project context
│   └── foundation/    # PRD, tech-stack, lessons
└── .claude/           # Agent configuration
    └── skills/        # Custom skills
```

## Commands
- `cd docker && docker-compose up -d` - Start infrastructure
- `cd src/backend && npm run dev` - Run backend
- `cd src/frontend && npm run dev` - Run frontend
- `cd src/backend && npm run db:migrate` - Run migrations
- `cd src/backend && npm run db:seed` - Seed database

## Code Conventions

### Backend
- Use Zod for request validation
- Wrap async route handlers in try-catch
- Return consistent error format: `{ error: string }`
- Use `AuthRequest` interface for authenticated routes
- Permission format: `resource:action` (e.g., `terminals:create`)

### Frontend
- Use TanStack Query for data fetching
- Use Zustand for global state
- Components in `components/`, pages in `pages/`
- Use Tailwind CSS utilities
- API calls in `api/client.ts`

### Naming
- Files: kebab-case (`terminal-emulator.ts`)
- Components: PascalCase (`TerminalView.tsx`)
- Functions: camelCase (`executeCommand`)
- Types/Interfaces: PascalCase (`Terminal`, `User`)

## RBAC Model
Three roles: `admin`, `operator`, `viewer`
- Admin: Full access
- Operator: Manage own terminals/snapshots
- Viewer: Read-only access

## Terminal Emulator
Emulated commands: `ls`, `cd`, `cat`, `echo`, `pwd`, `mkdir`, `touch`, `rm`, `env`, `export`, `whoami`, `date`, `help`, `clear`

## Lessons Learned
See: `context/foundation/lessons.md`

## Do NOT
- Add lodash or similar utility libraries (use native JS/TS)
- Modify Docker configs without explicit request
- Push to remote without explicit request
- Add new dependencies without justification
