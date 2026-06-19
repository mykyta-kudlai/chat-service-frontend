import { createContext } from 'react';
import type { User } from '../types/user';

/** Значення, яке надає AuthContext. */
export interface AuthContextValue {
  user: User | null;
  token: string | null;
  /** Зберігає токен; користувач визначається з payload JWT. */
  login: (token: string) => void;
  /** Очищує сесію. */
  logout: () => void;
}

/**
 * Контекст автентифікації.
 * Провайдер — у AuthProvider.tsx, хук доступу — у hooks/useAuth.ts.
 */
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
