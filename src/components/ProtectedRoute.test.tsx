import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { AuthContext } from '../contexts/AuthContext';
import { makeAuthValue } from '../test/utils';

/** Рендерить ProtectedRoute у мінімальному роутері з маршрутом /login. */
function renderAt(token: string | null) {
  return render(
    <AuthContext.Provider value={makeAuthValue({ token })}>
      <MemoryRouter initialEntries={['/chat']}>
        <Routes>
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <div>secret chat</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>login page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('ProtectedRoute (інтеграція з роутером)', () => {
  it('рендерить дочірній вміст за наявності токена', () => {
    // Act
    renderAt('some.jwt.token');

    // Assert
    expect(screen.getByText('secret chat')).toBeInTheDocument();
  });

  it('перенаправляє на /login без токена', () => {
    // Act
    renderAt(null);

    // Assert
    expect(screen.getByText('login page')).toBeInTheDocument();
    expect(screen.queryByText('secret chat')).not.toBeInTheDocument();
  });
});
