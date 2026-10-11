import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PERMISSIONS = [
  // Users
  { name: 'users:create', resource: 'users', action: 'create', description: 'Create users' },
  { name: 'users:read', resource: 'users', action: 'read', description: 'View users' },
  { name: 'users:update', resource: 'users', action: 'update', description: 'Update users' },
  { name: 'users:delete', resource: 'users', action: 'delete', description: 'Delete users' },

  // Roles
  { name: 'roles:create', resource: 'roles', action: 'create', description: 'Create roles' },
  { name: 'roles:read', resource: 'roles', action: 'read', description: 'View roles' },
  { name: 'roles:update', resource: 'roles', action: 'update', description: 'Update roles' },
  { name: 'roles:delete', resource: 'roles', action: 'delete', description: 'Delete roles' },

  // Terminals
  { name: 'terminals:create', resource: 'terminals', action: 'create', description: 'Create terminals' },
  { name: 'terminals:read', resource: 'terminals', action: 'read', description: 'View terminals' },
  { name: 'terminals:execute', resource: 'terminals', action: 'execute', description: 'Execute terminal commands' },
  { name: 'terminals:delete', resource: 'terminals', action: 'delete', description: 'Delete terminals' },

  // Snapshots
  { name: 'snapshots:create', resource: 'snapshots', action: 'create', description: 'Create snapshots' },
  { name: 'snapshots:read', resource: 'snapshots', action: 'read', description: 'View snapshots' },
  { name: 'snapshots:restore', resource: 'snapshots', action: 'restore', description: 'Restore snapshots' },
  { name: 'snapshots:delete', resource: 'snapshots', action: 'delete', description: 'Delete snapshots' },
];

const ROLES = [
  {
    name: 'admin',
    description: 'Full system access',
    permissions: PERMISSIONS.map((p) => p.name),
  },
  {
    name: 'operator',
    description: 'Can manage terminals and snapshots',
    permissions: [
      'users:read',
      'roles:read',
      'terminals:create',
      'terminals:read',
      'terminals:execute',
      'terminals:delete',
      'snapshots:create',
      'snapshots:read',
      'snapshots:restore',
    ],
  },
  {
    name: 'viewer',
    description: 'Read-only access',
    permissions: ['terminals:read', 'snapshots:read'],
  },
];

const USERS = [
  {
    email: 'admin@cloudshell.local',
    password: 'admin123',
    name: 'Administrator',
    role: 'admin',
  },
  {
    email: 'operator@cloudshell.local',
    password: 'operator123',
    name: 'Operator User',
    role: 'operator',
  },
  {
    email: 'viewer@cloudshell.local',
    password: 'viewer123',
    name: 'Viewer User',
    role: 'viewer',
  },
];

async function main() {
  console.log('Seeding database...');

  // Create permissions
  console.log('Creating permissions...');
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }

  // Create roles with permissions
  console.log('Creating roles...');
  for (const role of ROLES) {
    const permissions = await prisma.permission.findMany({
      where: { name: { in: role.permissions } },
    });

    const createdRole = await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: {
        name: role.name,
        description: role.description,
      },
    });

    // Clear existing permissions and add new ones
    await prisma.rolePermission.deleteMany({
      where: { roleId: createdRole.id },
    });

    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({
        roleId: createdRole.id,
        permissionId: p.id,
      })),
    });
  }

  // Create users
  console.log('Creating users...');
  for (const user of USERS) {
    const role = await prisma.role.findUnique({
      where: { name: user.role },
    });

    if (!role) {
      console.error(`Role ${user.role} not found`);
      continue;
    }

    const passwordHash = await bcrypt.hash(user.password, 10);

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        roleId: role.id,
      },
      create: {
        email: user.email,
        passwordHash,
        name: user.name,
        roleId: role.id,
      },
    });
  }

  console.log('Seeding completed!');
  console.log('\nDefault users:');
  console.log('  admin@cloudshell.local / admin123 (admin)');
  console.log('  operator@cloudshell.local / operator123 (operator)');
  console.log('  viewer@cloudshell.local / viewer123 (viewer)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
