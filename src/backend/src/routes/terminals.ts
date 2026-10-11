import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../index.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth.js';
import {
  executeCommand,
  getDefaultState,
  getTerminalState,
} from '../services/terminalEmulator.js';

const router = Router();

const createTerminalSchema = z.object({
  name: z.string().min(1).max(100),
});

const executeCommandSchema = z.object({
  command: z.string().min(1).max(1000),
});

// List terminals
router.get(
  '/',
  authenticate,
  requirePermission('terminals', 'read'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const where =
        req.userRole === 'admin'
          ? {}
          : { userId: req.userId };

      const terminals = await prisma.terminal.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          _count: { select: { commands: true, snapshots: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(
        terminals.map((t) => ({
          id: t.id,
          name: t.name,
          status: t.status,
          workingDir: t.workingDir,
          user: t.user,
          commandCount: t._count.commands,
          snapshotCount: t._count.snapshots,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        }))
      );
    } catch (error) {
      next(error);
    }
  }
);

// Create terminal
router.post(
  '/',
  authenticate,
  requirePermission('terminals', 'create'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = createTerminalSchema.parse(req.body);
      const defaultState = getDefaultState();

      const terminal = await prisma.terminal.create({
        data: {
          name: data.name,
          userId: req.userId!,
          status: 'RUNNING',
          workingDir: defaultState.workingDir,
          environment: defaultState.environment,
          fileSystem: defaultState.fileSystem,
        },
      });

      res.status(201).json({
        id: terminal.id,
        name: terminal.name,
        status: terminal.status,
        workingDir: terminal.workingDir,
        createdAt: terminal.createdAt,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get terminal
router.get(
  '/:id',
  authenticate,
  requirePermission('terminals', 'read'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const terminal = await prisma.terminal.findUnique({
        where: { id: req.params.id },
        include: {
          user: { select: { id: true, name: true, email: true } },
          commands: {
            orderBy: { executedAt: 'desc' },
            take: 50,
          },
        },
      });

      if (!terminal) {
        throw new AppError('Terminal not found', 404);
      }

      // Check ownership for non-admins
      if (req.userRole !== 'admin' && terminal.userId !== req.userId) {
        throw new AppError('Forbidden', 403);
      }

      res.json({
        id: terminal.id,
        name: terminal.name,
        status: terminal.status,
        workingDir: terminal.workingDir,
        environment: terminal.environment,
        user: terminal.user,
        commands: terminal.commands.reverse(),
        createdAt: terminal.createdAt,
        updatedAt: terminal.updatedAt,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Execute command
router.post(
  '/:id/execute',
  authenticate,
  requirePermission('terminals', 'execute'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { command } = executeCommandSchema.parse(req.body);

      const terminal = await prisma.terminal.findUnique({
        where: { id: req.params.id },
      });

      if (!terminal) {
        throw new AppError('Terminal not found', 404);
      }

      if (req.userRole !== 'admin' && terminal.userId !== req.userId) {
        throw new AppError('Forbidden', 403);
      }

      if (terminal.status !== 'RUNNING') {
        throw new AppError('Terminal is not running', 400);
      }

      const state = getTerminalState(
        terminal.workingDir,
        terminal.environment as Record<string, string>,
        terminal.fileSystem as Record<string, { type: 'file' | 'directory'; content?: string; children?: string[] }>
      );

      const result = executeCommand(command, state);

      // Update terminal state
      const updateData: Record<string, unknown> = {};
      if (result.newState?.workingDir) {
        updateData.workingDir = result.newState.workingDir;
      }
      if (result.newState?.environment) {
        updateData.environment = result.newState.environment;
      }
      if (result.newState?.fileSystem) {
        updateData.fileSystem = result.newState.fileSystem;
      }

      // Save command and update terminal
      const [savedCommand] = await prisma.$transaction([
        prisma.terminalCommand.create({
          data: {
            terminalId: terminal.id,
            command,
            output: result.output,
            exitCode: result.exitCode,
          },
        }),
        prisma.terminal.update({
          where: { id: terminal.id },
          data: updateData,
        }),
      ]);

      res.json({
        command: savedCommand.command,
        output: result.output,
        exitCode: result.exitCode,
        workingDir: result.newState?.workingDir || terminal.workingDir,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Start terminal
router.post(
  '/:id/start',
  authenticate,
  requirePermission('terminals', 'execute'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const terminal = await prisma.terminal.findUnique({
        where: { id: req.params.id },
      });

      if (!terminal) {
        throw new AppError('Terminal not found', 404);
      }

      if (req.userRole !== 'admin' && terminal.userId !== req.userId) {
        throw new AppError('Forbidden', 403);
      }

      const updated = await prisma.terminal.update({
        where: { id: req.params.id },
        data: { status: 'RUNNING' },
      });

      res.json({
        id: updated.id,
        status: updated.status,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Stop terminal
router.post(
  '/:id/stop',
  authenticate,
  requirePermission('terminals', 'execute'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const terminal = await prisma.terminal.findUnique({
        where: { id: req.params.id },
      });

      if (!terminal) {
        throw new AppError('Terminal not found', 404);
      }

      if (req.userRole !== 'admin' && terminal.userId !== req.userId) {
        throw new AppError('Forbidden', 403);
      }

      const updated = await prisma.terminal.update({
        where: { id: req.params.id },
        data: { status: 'STOPPED' },
      });

      res.json({
        id: updated.id,
        status: updated.status,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete terminal
router.delete(
  '/:id',
  authenticate,
  requirePermission('terminals', 'delete'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const terminal = await prisma.terminal.findUnique({
        where: { id: req.params.id },
      });

      if (!terminal) {
        throw new AppError('Terminal not found', 404);
      }

      if (req.userRole !== 'admin' && terminal.userId !== req.userId) {
        throw new AppError('Forbidden', 403);
      }

      await prisma.terminal.delete({
        where: { id: req.params.id },
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export { router as terminalsRouter };
