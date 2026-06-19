import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

// Без токена SocketProvider не підключається, але про всяк випадок мокуємо io.
vi.mock('socket.io-client', () => ({ io: vi.fn() }));

describe('App (смоук, маршрутизація)', () => {
  it('без токена будь-який шлях зводиться до сторінки входу', async () => {
    // Act — App піднімає власні провайдери та BrowserRouter (старт на '/').
    render(<App />);

    // Assert — ланцюг '*' → /chat → ProtectedRoute → /login → LoginPage
    expect(await screen.findByRole('heading', { name: 'Вхід' })).toBeInTheDocument();
  });
});
