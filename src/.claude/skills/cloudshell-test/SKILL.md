# CloudShell Test Skill

## Description
Skill for writing tests in the CloudShell project. Covers unit tests, component tests, and integration patterns.

## Activation
- "write test"
- "add tests"
- "test coverage"

## Test Stack

| Layer | Tool | Location |
|-------|------|----------|
| Unit (Backend) | Vitest | `src/backend/src/__tests__/` |
| Unit (Frontend) | Vitest | `src/frontend/src/**/*.test.ts` |
| Component | React Testing Library | `src/frontend/src/**/*.test.tsx` |
| E2E | Playwright (TODO) | `e2e/` |

## Running Tests

```bash
# All tests
cd src && npm test

# Backend only
cd src/backend && npm test

# Frontend only
cd src/frontend && npm test

# Watch mode
cd src/backend && npm run test:watch
cd src/frontend && npm run test:watch

# Coverage
cd src/backend && npm run test:coverage
cd src/frontend && npm run test:coverage
```

## Backend Test Pattern

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Feature Name', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('specific function', () => {
    it('should do expected behavior', () => {
      const result = functionToTest(input);
      expect(result).toBe(expected);
    });

    it('should handle edge case', () => {
      expect(() => functionToTest(badInput)).toThrow();
    });
  });
});
```

## Frontend Component Test Pattern

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, setAuthState, mockAdminUser } from '../test/utils';
import { ComponentName } from './ComponentName';

vi.mock('../api/client');

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAuthState(mockAdminUser);
  });

  it('should render correctly', () => {
    renderWithProviders(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    renderWithProviders(<ComponentName />);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Result')).toBeInTheDocument();
    });
  });
});
```

## Test Utilities

Located in `src/frontend/src/test/utils.tsx`:

- `renderWithProviders(ui, options)` - Wraps with QueryClient + Router
- `setAuthState(user)` - Sets auth store state
- `clearAuthState()` - Clears auth store
- `mockAdminUser` - Admin user fixture
- `mockOperatorUser` - Operator user fixture
- `mockViewerUser` - Viewer user fixture

## Mocking API Calls

```typescript
import * as apiClient from '../api/client';

vi.mock('../api/client');

// In test:
vi.mocked(apiClient.getTerminals).mockResolvedValueOnce([
  { id: '1', name: 'Terminal 1', status: 'RUNNING' }
]);
```

## Current Test Coverage

| Area | Tests | Status |
|------|-------|--------|
| Terminal Emulator | 28 | ✅ |
| Auth Store | 5 | ✅ |
| Login Component | 10 | ✅ |
| Dashboard Component | 10 | ✅ |
| Layout Component | 12 | ✅ |
| TerminalView Component | 13 | ✅ |
| **Total** | **78** | ✅ |

## Quality Gates

Before commit:
1. TypeScript check passes
2. All tests pass
3. No new warnings

```bash
# Pre-commit check
cd src/backend && ./node_modules/.bin/tsc --noEmit && npm test
cd src/frontend && ./node_modules/.bin/tsc --noEmit && npm test
```
