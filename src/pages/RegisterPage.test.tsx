import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterPage from './RegisterPage';
import { renderWithContexts } from '../test/utils';
import { apiClient } from '../api/ApiClient';

const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigate };
});

vi.mock('../api/ApiClient', () => ({
  apiClient: { auth: { login: vi.fn(), register: vi.fn() } },
}));

const register = vi.mocked(apiClient.auth.register);

describe('RegisterPage (інтеграція)', () => {
  beforeEach(() => {
    navigate.mockReset();
    register.mockReset();
  });

  it('успішна реєстрація: логінить отриманим токеном і веде на /chat', async () => {
    // Arrange
    const user = userEvent.setup();
    register.mockResolvedValue({ access_token: 'jwt-new' });
    const { authValue } = renderWithContexts(<RegisterPage />);

    // Act
    await user.type(screen.getByPlaceholderText('username'), 'newbie');
    await user.type(screen.getByPlaceholderText('••••••'), 'secret1');
    await user.click(screen.getByRole('button', { name: /Зареєструватися/ }));

    // Assert
    await waitFor(() => expect(register).toHaveBeenCalledWith('newbie', 'secret1'));
    expect(authValue.login).toHaveBeenCalledWith('jwt-new');
    expect(navigate).toHaveBeenCalledWith('/chat', { replace: true });
  });

  it('валідація: короткий username не відправляє запит', async () => {
    // Arrange
    const user = userEvent.setup();
    renderWithContexts(<RegisterPage />);

    // Act — username коротший за 3 символи
    await user.type(screen.getByPlaceholderText('username'), 'ab');
    await user.type(screen.getByPlaceholderText('••••••'), 'secret1');
    await user.click(screen.getByRole('button', { name: /Зареєструватися/ }));

    // Assert
    expect(await screen.findByText('Мінімум 3 символи')).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });
});
