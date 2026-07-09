import { randomUUID } from 'node:crypto';

export function generateId(): string {
  return randomUUID();
}

export function randomToken(bytes = 32): string {
  return randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '').slice(0, bytes);
}