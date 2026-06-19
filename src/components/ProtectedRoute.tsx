import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

/**
 * Захищений маршрут.
 * Якщо токен є — рендерить дочірній компонент,
 * інакше перенаправляє на сторінку входу.
 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
