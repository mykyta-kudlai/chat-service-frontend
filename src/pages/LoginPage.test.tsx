import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';
import LoginPage from './LoginPage';
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

const login = vi.mocked(apiClient.auth.login);

async function submit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText('username'), 'mykyta');
  await user.type(screen.getByPlaceholderText('••••••'), 'secret1');
  await user.click(screen.getByRole('button', { name: /Увійти/ }));
}

describe('LoginPage (інтеграція)', () => {
  beforeEach(() => {
    navigate.mockReset();
    login.mockReset();
  });

  it('успішний вхід: зберігає токен у контекст і переходить на /chat', async () => {
    // Arrange
    const user = userEvent.setup();
    login.mockResolvedValue({ access_token: 'jwt-123' });
    const { authValue } = renderWithContexts(<LoginPage />);

    // Act
    await submit(user);

    // Assert
    await waitFor(() => expect(login).toHaveBeenCalledWith('mykyta', 'secret1'));
    expect(authValue.login).toHaveBeenCalledWith('jwt-123');
    expect(navigate).toHaveBeenCalledWith('/chat', { replace: true });
  });

  it('показує повідомлення про помилку при невдалому вході', async () => {
    // Arrange
    const user = userEvent.setup();
    const err = new AxiosError('fail');
    // @ts-expect-error — мінімальний response для extractError.
    err.response = { data: { message: 'Невірні облікові дані' } };
    login.mockRejectedValue(err);
    const { authValue } = renderWithContexts(<LoginPage />);

    // Act
    await submit(user);

    // Assert
    expect(await screen.findByText('Невірні облікові дані')).toBeInTheDocument();
    expect(authValue.login).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
