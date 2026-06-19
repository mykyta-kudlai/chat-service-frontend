import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from './AuthProvider';
import { useAuth } from '../hooks/useAuth';
import { TOKEN_STORAGE_KEY } from '../constants';
import { makeToken } from '../test/utils';

/** Тестовий споживач, що відображає стан і дає кнопки login/logout. */
function Consumer() {
  const { user, token, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="user">{user?.username ?? 'none'}</span>
      <span data-testid="token">{token ?? 'none'}</span>
      <button onClick={() => login(makeToken({ username: 'mykyta' }))}>login</button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

describe('AuthProvider + useAuth (інтеграція)', () => {
  it('ініціалізує стан із токена в localStorage (сесія переживає перезавантаження)', () => {
    // Arrange
    localStorage.setItem(TOKEN_STORAGE_KEY, makeToken({ username: 'restored' }));

    // Act
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    // Assert
    expect(screen.getByTestId('user')).toHaveTextContent('restored');
  });

  it('login зберігає токен у localStorage і деривує користувача', async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );
    expect(screen.getByTestId('user')).toHaveTextContent('none');

    // Act
    await user.click(screen.getByText('login'));

    // Assert
    expect(screen.getByTestId('user')).toHaveTextContent('mykyta');
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).not.toBeNull();
  });

  it('logout очищує токен і стан', async () => {
    // Arrange
    const user = userEvent.setup();
    localStorage.setItem(TOKEN_STORAGE_KEY, makeToken({ username: 'mykyta' }));
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    // Act
    await user.click(screen.getByText('logout'));

    // Assert
    expect(screen.getByTestId('user')).toHaveTextContent('none');
    expect(screen.getByTestId('token')).toHaveTextContent('none');
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('useAuth кидає помилку поза межами AuthProvider', () => {
    // Arrange — приглушуємо очікуваний console.error від React.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Act & Assert
    expect(() => render(<Consumer />)).toThrow(/AuthProvider/);

    spy.mockRestore();
  });
});
