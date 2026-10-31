import { prisma } from '../index.js';
import bcrypt from 'bcryptjs';

export async function setupTestDatabase() {
  // Clean up existing test data
  await prisma.terminalCommand.deleteMany();
  await prisma.terminal.deleteMany();
  await prisma.snapshot.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();

  // Create roles
  const adminRole = await prisma.role.create({
    data: { name: 'admin', description: 'Full system access' },
  });

  const operatorRole = await prisma.role.create({
    data: { name: 'operator', description: 'Manage own resources' },
  });

  const viewerRole = await prisma.role.create({
    data: { name: 'viewer', description: 'Read-only access' },
  });

  // Create permissions
  const resources = ['users', 'terminals', 'snapshots', 'roles'];
  const actions = ['create', 'read', 'update', 'delete', 'execute', 'restore'];

  const permissions = await Promise.all(
    resources.flatMap((resource) =>
      actions.map((action) =>
        prisma.permission.create({
          data: { resource, action },
        })
      )
    )
  );

  // Assign all permissions to admin
  await Promise.all(
    permissions.map((perm) =>
      prisma.rolePermission.create({
        data: { roleId: adminRole.id, permissionId: perm.id },
      })
    )
  );

  // Assign limited permissions to operator
  const operatorPerms = permissions.filter(
    (p) =>
      (p.resource === 'terminals' && ['create', 'read', 'update', 'delete', 'execute'].includes(p.action)) ||
      (p.resource === 'snapshots' && ['create', 'read', 'update', 'restore'].includes(p.action)) ||
      (p.resource === 'users' && p.action === 'read')
  );
  await Promise.all(
    operatorPerms.map((perm) =>
      prisma.rolePermission.create({
        data: { roleId: operatorRole.id, permissionId: perm.id },
      })
    )
  );

  // Assign read permissions to viewer
  const viewerPerms = permissions.filter((p) => p.action === 'read');
  await Promise.all(
    viewerPerms.map((perm) =>
      prisma.rolePermission.create({
        data: { roleId: viewerRole.id, permissionId: perm.id },
      })
    )
  );

  // Create test users
  const passwordHash = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@test.local',
      passwordHash,
      name: 'Test Admin',
      roleId: adminRole.id,
    },
  });

  const operatorUser = await prisma.user.create({
    data: {
      email: 'operator@test.local',
      passwordHash,
      name: 'Test Operator',
      roleId: operatorRole.id,
    },
  });

  const viewerUser = await prisma.user.create({
    data: {
      email: 'viewer@test.local',
      passwordHash,
      name: 'Test Viewer',
      roleId: viewerRole.id,
    },
  });

  return {
    adminRole,
    operatorRole,
    viewerRole,
    adminUser,
    operatorUser,
    viewerUser,
  };
}

export async function cleanupTestDatabase() {
  await prisma.terminalCommand.deleteMany();
  await prisma.terminal.deleteMany();
  await prisma.snapshot.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
}
