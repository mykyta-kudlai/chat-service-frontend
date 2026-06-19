import type { User } from '../types/user';

/**
 * Дістає користувача з payload JWT (поле `username`).
 * Обгорнуто в try/catch: битий/чужий токен не має ронити застосунок.
 */
export function decodeUser(token: string): User | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64)) as { username?: string };
    return payload.username ? { username: payload.username } : null;
  } catch {
    return null;
  }
}
