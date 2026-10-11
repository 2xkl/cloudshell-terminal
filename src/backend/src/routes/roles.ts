import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../index.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth.js';

const router = Router();

const createRoleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  permissionIds: z.array(z.string().uuid()).optional(),
});

const updateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  permissionIds: z.array(z.string().uuid()).optional(),
});

// List roles
router.get(
  '/',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const roles = await prisma.role.findMany({
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      res.json(
        roles.map((role) => ({
          id: role.id,
          name: role.name,
          description: role.description,
          permissions: role.permissions.map((rp) => ({
            id: rp.permission.id,
            name: rp.permission.name,
            resource: rp.permission.resource,
            action: rp.permission.action,
          })),
        }))
      );
    } catch (error) {
      next(error);
    }
  }
);

// List permissions
router.get(
  '/permissions',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const permissions = await prisma.permission.findMany({
        orderBy: [{ resource: 'asc' }, { action: 'asc' }],
      });

      res.json(permissions);
    } catch (error) {
      next(error);
    }
  }
);

// Create role
router.post(
  '/',
  authenticate,
  requirePermission('roles', 'create'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = createRoleSchema.parse(req.body);

      const role = await prisma.role.create({
        data: {
          name: data.name,
          description: data.description,
          permissions: data.permissionIds
            ? {
                create: data.permissionIds.map((permissionId) => ({
                  permissionId,
                })),
              }
            : undefined,
        },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      res.status(201).json({
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions.map((rp) => ({
          id: rp.permission.id,
          name: rp.permission.name,
          resource: rp.permission.resource,
          action: rp.permission.action,
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update role
router.put(
  '/:id',
  authenticate,
  requirePermission('roles', 'update'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = updateRoleSchema.parse(req.body);

      // Update role permissions
      if (data.permissionIds) {
        await prisma.rolePermission.deleteMany({
          where: { roleId: req.params.id },
        });

        await prisma.rolePermission.createMany({
          data: data.permissionIds.map((permissionId) => ({
            roleId: req.params.id,
            permissionId,
          })),
        });
      }

      const role = await prisma.role.update({
        where: { id: req.params.id },
        data: {
          name: data.name,
          description: data.description,
        },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      res.json({
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions.map((rp) => ({
          id: rp.permission.id,
          name: rp.permission.name,
          resource: rp.permission.resource,
          action: rp.permission.action,
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete role
router.delete(
  '/:id',
  authenticate,
  requirePermission('roles', 'delete'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Check if role has users
      const usersCount = await prisma.user.count({
        where: { roleId: req.params.id },
      });

      if (usersCount > 0) {
        throw new AppError('Cannot delete role with assigned users', 400);
      }

      await prisma.role.delete({
        where: { id: req.params.id },
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export { router as rolesRouter };
