import type { Request, Response, NextFunction } from 'express';
import { authService } from '../../../application/services/auth.service';
import {
  loginSchema,
  refreshSchema,
  changePasswordSchema,
  forgotPasswordSchema,
} from '../dto/auth.dto';
import { validateBody } from '../middleware/validator';
import { authenticate } from '../middleware/auth';
import type { AuthUser } from '../../../shared/types';

export const authController = {
  login: [
    validateBody(loginSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { identifier, password } = req.body;
        const result = await authService.login(identifier, password, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        res.json({ success: true, data: result });
      } catch (err) {
        next(err);
      }
    },
  ],

  refresh: [
    validateBody(refreshSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { refreshToken } = req.body;
        const result = await authService.refresh(refreshToken);
        res.json({ success: true, data: result });
      } catch (err) {
        next(err);
      }
    },
  ],

  logout: [
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        await authService.logout(user.id);
        res.json({ success: true, data: { loggedOut: true } });
      } catch (err) {
        next(err);
      }
    },
  ],

  changePassword: [
    authenticate,
    validateBody(changePasswordSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        const { currentPassword, newPassword } = req.body;
        await authService.changePassword(user.id, currentPassword, newPassword);
        res.json({ success: true, data: { changed: true } });
      } catch (err) {
        next(err);
      }
    },
  ],

  forgotPassword: [
    validateBody(forgotPasswordSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { identifier } = req.body;
        await authService.forgotPassword(identifier);
        // Always return success to avoid user enumeration.
        res.json({ success: true, data: { requested: true } });
      } catch (err) {
        next(err);
      }
    },
  ],

  me: [
    authenticate,
    async (req: Request, res: Response) => {
      res.json({ success: true, data: req.user });
    },
  ],
};
