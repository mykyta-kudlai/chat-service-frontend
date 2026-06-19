import { useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types/user';
import { TOKEN_STORAGE_KEY } from '../constants';
import { decodeUser } from '../utils/decodeUser';
import { AuthContext } from './AuthContext';

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
