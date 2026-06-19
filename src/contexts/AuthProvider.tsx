import { useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types/user';
import { TOKEN_STORAGE_KEY } from '../constants';
import { AuthContext } from './AuthContext';

/**
 * Дістає користувача з payload JWT (поле `username`).
 * Обгорнуто в try/catch: битий/чужий токен не має ронити застосунок.
 */
function decodeUser(token: string): User | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64)) as { username?: string };
    return payload.username ? { username: payload.username } : null;
  } catch {
    return null;
  }
}

/**
 * Провайдер автентифікації.
 * Тримає token у стані + localStorage; користувача деривує з самого токена,
 * тож окреме сховище для імені не потрібне (єдине джерело істини — JWT).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_STORAGE_KEY),
  );
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    return stored ? decodeUser(stored) : null;
  });

  const login = (newToken: string) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    setToken(newToken);
    setUser(decodeUser(newToken));
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
