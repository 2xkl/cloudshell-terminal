# CloudShell - Roadmap

## MVP Milestones

### Phase 1: Core Infrastructure (COMPLETED)
- [x] Docker infrastructure (PostgreSQL, Redis)
- [x] Backend scaffold (Express + TypeScript + Prisma)
- [x] Frontend scaffold (React + Vite + TailwindCSS)
- [x] Database schema design
- [x] Basic API structure

### Phase 2: RBAC System (COMPLETED)
- [x] Role model (admin, operator, viewer)
- [x] Permission model (resource:action)
- [x] User management API
- [x] JWT authentication
- [x] Authorization middleware

### Phase 3: Terminal Emulator (COMPLETED)
- [x] Virtual filesystem
- [x] Command execution engine
- [x] 14 emulated commands (ls, cd, cat, etc.)
- [x] Environment variables
- [x] Command history

### Phase 4: Snapshots (COMPLETED)
- [x] Snapshot creation API
- [x] Snapshot restore functionality
- [x] Snapshot listing and management
- [x] State serialization

### Phase 5: Frontend UI (COMPLETED)
- [x] Login page
- [x] Dashboard
- [x] Terminals management
- [x] Terminal view with command input
- [x] Snapshots management
- [x] Users management (admin)

### Phase 6: Testing (IN PROGRESS)
- [x] Unit tests for terminal emulator (28 tests)
- [x] Unit tests for auth store (5 tests)
- [ ] Integration tests for API endpoints
- [ ] Component tests for React
- [ ] E2E tests with Playwright

### Phase 7: Build Agent (COMPLETED)
- [x] RHEL-based Docker image
- [x] Node.js, GCC, Python toolchain
- [x] Health check script

### Phase 8: Production Readiness (TODO)
- [x] CI/CD pipeline
- [ ] Security audit
- [ ] Performance optimization
- [ ] Monitoring and logging
- [ ] Documentation

### Phase 9: AI Native Teamwork (TODO)
- [ ] Claude Code Action - AI code review w GitHub Actions
- [ ] Team Agent SDK - ToolLoopAgent z Vercel AI SDK
- [ ] promptfoo - testowanie agentow i promptow
- [ ] Shared AI Registry - dystrybucja skilli jako npm packages
- [ ] Async/Remote Agents - delegowanie zadan do zdalnych agentow

## Feature Dependencies

```
Infrastructure
    └── RBAC System
         └── Terminal Emulator
              └── Snapshots
                   └── Frontend UI
                        └── Testing
                             └── Production
                                  └── AI Native Teamwork
```

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Security vulnerabilities in deps | High | npm audit fix, regular updates |
| Terminal command injection | High | Input sanitization, sandbox |
| RBAC bypass | High | Integration tests, code review |
| Data loss | Medium | Snapshots, backups |
| AI Agent hallucinations | Medium | promptfoo testing, human review |
| API cost overrun | Medium | maxBudgetUsd, token limits |
| Skill injection | High | Bundle signing, API allowlisting |

## Success Metrics

- [x] User can login with RBAC enforcement
- [x] User can create and manage terminals
- [x] User can execute emulated commands
- [x] User can save and restore snapshots
- [x] All 78 unit tests pass
- [ ] API integration tests coverage > 80%
- [ ] E2E tests for critical paths
- [ ] AI code review on every PR
- [ ] promptfoo eval score > 90%
- [ ] Shared skills distributed via npm
