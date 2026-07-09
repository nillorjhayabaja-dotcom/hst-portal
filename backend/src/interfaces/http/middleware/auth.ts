import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { UnauthorizedError } from '../../../shared/errors';
import { jwtService } from '../../../infrastructure/auth/jwt.service';
import { userRepository } from '../../../infrastructure/database/repositories/user.repository';
import type { AuthUser } from '../../../shared/types';

/**
 * Verifies the Bearer access token and attaches the authenticated user to the
 * request. Used by protected routes.
 */
export const authenticate: RequestHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid Authorization header');
    }
    const token = header.slice(7);
    const payload = jwtService.verifyAccess(token);
    const user = await userRepository.findById(payload.sub);
    if (!user || !user.isActive || user.isLocked) {
      throw new UnauthorizedError('Account is inactive or locked');
    }
    const authUser: AuthUser = {
      id: user.id,
      employeeId: user.employeeId,
      email: user.email,
      displayName: user.displayName,
      roles: user.roles,
      permissions: user.permissions,
    };
    req.user = authUser;
    next();
  } catch (err) {
    next(err instanceof UnauthorizedError ? err : new UnauthorizedError('Invalid or expired token'));
  }
};