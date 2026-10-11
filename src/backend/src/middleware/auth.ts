import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';
import { AppError } from './errorHandler.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
  userPermissions?: string[];
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Unauthorized', 401);
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 401);
    }

    req.userId = user.id;
    req.userRole = user.role.name;
    req.userPermissions = user.role.permissions.map(
      (rp) => `${rp.permission.resource}:${rp.permission.action}`
    );

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    next(new AppError('Invalid token', 401));
  }
}

export function requirePermission(resource: string, action: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const permissionKey = `${resource}:${action}`;

    if (!req.userPermissions?.includes(permissionKey)) {
      return next(new AppError('Forbidden', 403));
    }

    next();
  };
}
