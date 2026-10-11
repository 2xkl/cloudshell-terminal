# CloudShell RBAC Skill

## Description
Skill for managing Role-Based Access Control in the CloudShell system. Use when adding new permissions, modifying roles, or implementing authorization checks.

## Activation
- "add permission"
- "modify role"
- "check authorization"
- "RBAC"

## Current RBAC Model

### Roles
| Role | Description |
|------|-------------|
| admin | Full system access |
| operator | Manage own resources |
| viewer | Read-only access |

### Permission Format
`resource:action` (e.g., `terminals:create`, `snapshots:restore`)

### Current Permissions Matrix

| Resource | admin | operator | viewer |
|----------|-------|----------|--------|
| users:read | ✓ | - | - |
| users:create | ✓ | - | - |
| users:delete | ✓ | - | - |
| terminals:read | ✓ | ✓ | ✓ |
| terminals:create | ✓ | ✓ | - |
| terminals:execute | ✓ | ✓ | - |
| terminals:delete | ✓ | ✓ | - |
| snapshots:read | ✓ | ✓ | ✓ |
| snapshots:create | ✓ | ✓ | - |
| snapshots:restore | ✓ | ✓ | - |
| snapshots:delete | ✓ | - | - |

## Implementation Files

- **Permission definitions**: `prisma/seed.ts`
- **Authorization middleware**: `src/middleware/authorize.ts`
- **Frontend check**: `src/stores/authStore.ts` (`hasPermission`)

## Adding New Permission

1. **Database Seed** - Add to `prisma/seed.ts`:
```typescript
{ resource: 'newresource', action: 'newaction' }
```

2. **Backend Route** - Use middleware:
```typescript
router.post('/path', authorize('newresource', 'newaction'), handler);
```

3. **Frontend Check**:
```typescript
const canDoAction = hasPermission('newresource', 'newaction');
```

4. **Re-seed Database**:
```bash
cd src/backend && npm run db:seed
```

## Authorization Middleware Pattern

```typescript
export const authorize = (resource: string, action: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const hasPermission = req.permissions?.some(
      p => p.resource === resource && p.action === action
    );
    if (!hasPermission) {
      throw new AppError('Forbidden', 403);
    }
    next();
  };
};
```

## Testing RBAC

Test with different user roles:
- admin@cloudshell.local / admin123
- operator@cloudshell.local / operator123
- viewer@cloudshell.local / viewer123
