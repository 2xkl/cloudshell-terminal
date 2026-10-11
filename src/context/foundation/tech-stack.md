# CloudShell - Tech Stack

## Stack Selection
```yaml
starter_id: custom-fullstack-typescript
bootstrapper_confidence: first-class
path_taken: standard
has_auth: true
has_ai: false
has_payments: false
has_realtime: false
has_background_jobs: false
```

## Why This Stack

### Backend: Node.js + TypeScript + Express + Prisma
- **TypeScript**: Strong typing for better agent understanding
- **Express**: Well-documented, convention-based routing
- **Prisma**: Type-safe database access, great DX

### Frontend: React + TypeScript + Vite + TailwindCSS
- **React**: Popular in training data, well-documented
- **Vite**: Fast development, modern tooling
- **TailwindCSS**: Utility-first, no custom CSS needed
- **TanStack Query**: Server state management
- **Zustand**: Simple global state

### Database: PostgreSQL
- Relational model fits RBAC well
- JSON support for terminal state
- Prisma integration

### Infrastructure: Docker Compose
- Local development parity
- Easy service orchestration
- RHEL-based agents possible

## Agent-Friendly Assessment
| Criterion | Status |
|-----------|--------|
| Typed | PASS - Full TypeScript |
| Convention-based | PASS - Clear structure |
| Popular in training | PASS - React, Express, Prisma |
| Well-documented | PASS - All components |

## Verdict: READY
Stack spełnia wszystkie quality gates dla pracy z agentem AI.
