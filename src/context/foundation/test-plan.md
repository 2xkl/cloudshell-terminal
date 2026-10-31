# CloudShell - Test Plan

## Quality Gates

### Gate 1: Unit Tests (MUST PASS)
- Terminal emulator commands
- Auth store functionality
- Utility functions
- **Threshold**: 100% pass rate

### Gate 2: Integration Tests (MUST PASS)
- API endpoint responses
- Database operations
- Authentication flow
- **Threshold**: 100% pass rate

### Gate 3: Component Tests (SHOULD PASS)
- React component rendering
- User interactions
- State management
- **Threshold**: 90% pass rate

### Gate 4: E2E Tests (SHOULD PASS)
- Login flow
- Terminal CRUD
- Command execution
- Snapshot operations
- **Threshold**: 95% pass rate for critical paths

## Test Categories

### Unit Tests

| Component | Tests | Status | Priority |
|-----------|-------|--------|----------|
| terminalEmulator.ts | 28 | PASS | Critical |
| authStore.ts | 5 | PASS | Critical |
| errorHandler.ts | 0 | TODO | High |
| auth.middleware.ts | 0 | TODO | High |
| Zod schemas | 0 | TODO | Medium |

### Integration Tests

| Endpoint | Tests | Status | Priority |
|----------|-------|--------|----------|
| POST /api/auth/login | 4 | PASS | Critical |
| GET /api/auth/me | 3 | PASS | Critical |
| POST /api/auth/logout | 1 | PASS | Low |
| GET /api/terminals | 2 | PASS | Critical |
| POST /api/terminals | 3 | PASS | Critical |
| GET /api/terminals/:id | 2 | PASS | High |
| POST /api/terminals/:id/execute | 5 | PASS | Critical |
| DELETE /api/terminals/:id | 2 | PASS | High |
| GET /api/snapshots | 2 | PASS | High |
| POST /api/snapshots | 4 | PASS | High |
| GET /api/snapshots/:id | 2 | PASS | High |
| POST /api/snapshots/:id/restore | 2 | PASS | High |
| DELETE /api/snapshots/:id | 2 | PASS | High |
| CRUD /api/users | 0 | TODO | Medium |
| GET /api/roles | 0 | TODO | Low |

### Component Tests

| Component | Tests | Status | Priority |
|-----------|-------|--------|----------|
| Login.tsx | 0 | TODO | Critical |
| Layout.tsx | 0 | TODO | High |
| TerminalView.tsx | 0 | TODO | Critical |
| Dashboard.tsx | 0 | TODO | Medium |
| Terminals.tsx | 0 | TODO | High |
| Snapshots.tsx | 0 | TODO | Medium |
| Users.tsx | 0 | TODO | Low |

### E2E Tests (Playwright)

| Flow | Tests | Status | Priority |
|------|-------|--------|----------|
| Login with credentials | 6 | PASS | Critical |
| Terminals CRUD | 6 | PASS | Critical |
| Execute commands | 3 | PASS | Critical |
| Create/Restore Snapshot | 4 | PASS | High |
| RBAC: Viewer restrictions | 3 | PASS | High |
| RBAC: Operator permissions | 3 | PASS | High |
| RBAC: Admin full access | 3 | PASS | High |
| Protected routes | 3 | PASS | High |

## Test Commands

```bash
# Backend
cd src/backend
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report

# Frontend
cd src/frontend
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report

# E2E (when implemented)
cd src/frontend
npx playwright test
```

## Coverage Targets

| Type | Current | Target |
|------|---------|--------|
| Backend Unit | ~30% | 80% |
| Backend Integration | ~60% | 70% |
| Frontend Unit | ~10% | 60% |
| Frontend Component | ~40% | 50% |
| E2E Critical Paths | ~80% | 95% |

## Risk Matrix

| Area | Risk Level | Test Priority | Notes |
|------|------------|---------------|-------|
| Authentication | HIGH | Critical | JWT, password handling |
| Authorization | HIGH | Critical | RBAC permissions |
| Terminal Commands | MEDIUM | High | Input validation |
| Snapshots | MEDIUM | High | State integrity |
| UI Components | LOW | Medium | User experience |

## Test Data

### Demo Users (from seed)
- admin@cloudshell.local / admin123 (admin)
- operator@cloudshell.local / operator123 (operator)
- viewer@cloudshell.local / viewer123 (viewer)

### Test Fixtures
- Default terminal state with /home/user structure
- Sample snapshots for restore testing
- Invalid inputs for validation testing
