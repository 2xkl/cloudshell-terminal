import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../index.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth.js';

const router = Router();

const createSnapshotSchema = z.object({
  name: z.string().min(1).max(100),
  terminalId: z.string().uuid(),
});

// List snapshots
router.get(
  '/',
  authenticate,
  requirePermission('snapshots', 'read'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const where =
        req.userRole === 'admin'
          ? {}
          : { userId: req.userId };

      const snapshots = await prisma.snapshot.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          terminal: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(
        snapshots.map((s) => ({
          id: s.id,
          name: s.name,
          terminal: s.terminal,
          user: s.user,
          metadata: s.metadata,
          createdAt: s.createdAt,
        }))
      );
    } catch (error) {
      next(error);
    }
  }
);

// Create snapshot
router.post(
  '/',
  authenticate,
  requirePermission('snapshots', 'create'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = createSnapshotSchema.parse(req.body);

      const terminal = await prisma.terminal.findUnique({
        where: { id: data.terminalId },
        include: {
          commands: {
            orderBy: { executedAt: 'desc' },
            take: 100,
          },
        },
      });

      if (!terminal) {
        throw new AppError('Terminal not found', 404);
      }

      if (req.userRole !== 'admin' && terminal.userId !== req.userId) {
        throw new AppError('Forbidden', 403);
      }

      const state = {
        workingDir: terminal.workingDir,
        environment: terminal.environment,
        fileSystem: terminal.fileSystem,
        status: terminal.status,
        commands: terminal.commands.map((c) => ({
          command: c.command,
          output: c.output,
          exitCode: c.exitCode,
          executedAt: c.executedAt,
        })),
      };

      const metadata = {
        terminalName: terminal.name,
        commandCount: terminal.commands.length,
        snapshotType: 'full',
        version: '1.0',
      };

      const snapshot = await prisma.snapshot.create({
        data: {
          name: data.name,
          terminalId: data.terminalId,
          userId: req.userId!,
          state,
          metadata,
        },
        include: {
          terminal: { select: { id: true, name: true } },
        },
      });

      res.status(201).json({
        id: snapshot.id,
        name: snapshot.name,
        terminal: snapshot.terminal,
        metadata: snapshot.metadata,
        createdAt: snapshot.createdAt,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get snapshot
router.get(
  '/:id',
  authenticate,
  requirePermission('snapshots', 'read'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const snapshot = await prisma.snapshot.findUnique({
        where: { id: req.params.id },
        include: {
          user: { select: { id: true, name: true, email: true } },
          terminal: { select: { id: true, name: true } },
        },
      });

      if (!snapshot) {
        throw new AppError('Snapshot not found', 404);
      }

      if (req.userRole !== 'admin' && snapshot.userId !== req.userId) {
        throw new AppError('Forbidden', 403);
      }

      res.json({
        id: snapshot.id,
        name: snapshot.name,
        terminal: snapshot.terminal,
        user: snapshot.user,
        state: snapshot.state,
        metadata: snapshot.metadata,
        createdAt: snapshot.createdAt,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Restore snapshot
router.post(
  '/:id/restore',
  authenticate,
  requirePermission('snapshots', 'restore'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const snapshot = await prisma.snapshot.findUnique({
        where: { id: req.params.id },
        include: {
          terminal: true,
        },
      });

      if (!snapshot) {
        throw new AppError('Snapshot not found', 404);
      }

      if (req.userRole !== 'admin' && snapshot.userId !== req.userId) {
        throw new AppError('Forbidden', 403);
      }

      const state = snapshot.state as {
        workingDir: string;
        environment: Record<string, string>;
        fileSystem: Record<string, unknown>;
        status: string;
      };

      const updated = await prisma.terminal.update({
        where: { id: snapshot.terminalId },
        data: {
          workingDir: state.workingDir,
          environment: state.environment,
          fileSystem: JSON.parse(JSON.stringify(state.fileSystem)),
          status: state.status === 'RUNNING' ? 'RUNNING' : 'STOPPED',
        },
      });

      res.json({
        message: 'Snapshot restored successfully',
        terminal: {
          id: updated.id,
          name: updated.name,
          status: updated.status,
          workingDir: updated.workingDir,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete snapshot
router.delete(
  '/:id',
  authenticate,
  requirePermission('snapshots', 'delete'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const snapshot = await prisma.snapshot.findUnique({
        where: { id: req.params.id },
      });

      if (!snapshot) {
        throw new AppError('Snapshot not found', 404);
      }

      if (req.userRole !== 'admin' && snapshot.userId !== req.userId) {
        throw new AppError('Forbidden', 403);
      }

      await prisma.snapshot.delete({
        where: { id: req.params.id },
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export { router as snapshotsRouter };
