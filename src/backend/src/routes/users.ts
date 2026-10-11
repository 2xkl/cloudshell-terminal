import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../index.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth.js';

const router = Router();

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  roleId: z.string().uuid(),
});

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  name: z.string().min(1).optional(),
  roleId: z.string().uuid().optional(),
});

// List users
router.get(
  '/',
  authenticate,
  requirePermission('users', 'read'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const users = await prisma.user.findMany({
        include: { role: true },
        orderBy: { createdAt: 'desc' },
      });

      res.json(
        users.map((user) => ({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role.name,
          createdAt: user.createdAt,
        }))
      );
    } catch (error) {
      next(error);
    }
  }
);

// Create user
router.post(
  '/',
  authenticate,
  requirePermission('users', 'create'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = createUserSchema.parse(req.body);

      const existing = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existing) {
        throw new AppError('Email already exists', 400);
      }

      const passwordHash = await bcrypt.hash(data.password, 10);

      const user = await prisma.user.create({
        data: {
          email: data.email,
          passwordHash,
          name: data.name,
          roleId: data.roleId,
        },
        include: { role: true },
      });

      res.status(201).json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.name,
        createdAt: user.createdAt,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get user
router.get(
  '/:id',
  authenticate,
  requirePermission('users', 'read'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        include: { role: true },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.name,
        createdAt: user.createdAt,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update user
router.put(
  '/:id',
  authenticate,
  requirePermission('users', 'update'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = updateUserSchema.parse(req.body);

      const updateData: Record<string, unknown> = {};
      if (data.email) updateData.email = data.email;
      if (data.name) updateData.name = data.name;
      if (data.roleId) updateData.roleId = data.roleId;
      if (data.password) {
        updateData.passwordHash = await bcrypt.hash(data.password, 10);
      }

      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: updateData,
        include: { role: true },
      });

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.name,
        createdAt: user.createdAt,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete user
router.delete(
  '/:id',
  authenticate,
  requirePermission('users', 'delete'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await prisma.user.delete({
        where: { id: req.params.id },
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export { router as usersRouter };
