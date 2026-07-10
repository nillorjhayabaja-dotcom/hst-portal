import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface AccessTokenPayload {
  sub: string;
  employeeId: string;
  email: string;
  displayName: string;
  roles: string[];
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
  jti: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export const jwtService = {
  signAccess(payload: Omit<AccessTokenPayload, 'type'>): string {
    const options: SignOptions = {
      expiresIn: env.jwt.accessExpiry as any,
    };
    return jwt.sign({ ...payload, type: 'access' } as AccessTokenPayload, env.jwt.secret, options);
  },

  signRefresh(payload: Omit<RefreshTokenPayload, 'type'>): string {
    const options: SignOptions = {
      expiresIn: env.jwt.refreshExpiry as any,
    };
    return jwt.sign(
      { ...payload, type: 'refresh' } as RefreshTokenPayload,
      env.jwt.refreshSecret,
      options,
    );
  },

  verifyAccess(token: string): AccessTokenPayload {
    const decoded = jwt.verify(token, env.jwt.secret) as AccessTokenPayload;
    if (decoded.type !== 'access') throw new Error('Invalid token type');
    return decoded;
  },

  verifyRefresh(token: string): RefreshTokenPayload {
    const decoded = jwt.verify(token, env.jwt.refreshSecret) as RefreshTokenPayload;
    if (decoded.type !== 'refresh') throw new Error('Invalid token type');
    return decoded;
  },
};
