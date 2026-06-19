import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { App as AntApp, ConfigProvider } from 'antd';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import type { Socket } from 'socket.io-client';
import { AuthContext } from '../contexts/AuthContext';
import type { AuthContextValue } from '../contexts/AuthContext';
import { SocketContext } from '../contexts/SocketContext';
import type { SocketContextValue } from '../contexts/SocketContext';

/**
 * Мінімальна обгортка з antd App (контекст message/notification) та роутером.
 * Використовується для компонентів, що не залежать від Auth/Socket контекстів.
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: RenderOptions & { route?: string },
) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <ConfigProvider>
      <AntApp component={false}>
        <MemoryRouter initialEntries={[options?.route ?? '/']}>{children}</MemoryRouter>
      </AntApp>
    </ConfigProvider>
  );
  return render(ui, { wrapper: Wrapper, ...options });
}

/** Формує псевдо-JWT (base64url payload, без реального підпису) для тестів. */
export function makeToken(payload: object): string {
  const body = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_');
  return `header.${body}.signature`;
}

/** Значення AuthContext за замовчуванням (можна перевизначити в тесті). */
export function makeAuthValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: null,
    token: null,
    login: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  };
}

/**
 * Фейковий Socket.IO-сокет: запам'ятовує обробники, дозволяє «емітити»
 * серверні події в тест через emitServer(...). Реалізує лише потрібний API.
 */
export interface FakeSocket {
  socket: Socket;
  /** Викликає зареєстровані через socket.on(event) обробники. */
  emitServer: (event: string, ...args: unknown[]) => void;
  /** Шпигун для socket.emit (клієнт → сервер). */
  emit: ReturnType<typeof vi.fn>;
  handlers: Map<string, Array<(...args: unknown[]) => void>>;
}

export function createFakeSocket(): FakeSocket {
  const handlers = new Map<string, Array<(...args: unknown[]) => void>>();
  const emit = vi.fn();

  const on = vi.fn((event: string, cb: (...args: unknown[]) => void) => {
    const list = handlers.get(event) ?? [];
    list.push(cb);
    handlers.set(event, list);
  });
  const off = vi.fn((event: string, cb: (...args: unknown[]) => void) => {
    const list = handlers.get(event) ?? [];
    handlers.set(
      event,
      list.filter((h) => h !== cb),
    );
  });

  const socket = { on, off, emit, disconnect: vi.fn() } as unknown as Socket;

  return {
    socket,
    emit,
    handlers,
    emitServer: (event, ...args) => {
      (handlers.get(event) ?? []).forEach((cb) => cb(...args));
    },
  };
}

/** Значення SocketContext за замовчуванням. */
export function makeSocketValue(
  overrides: Partial<SocketContextValue> = {},
): SocketContextValue {
  return { socket: null, connected: false, error: null, ...overrides };
}

/** Рендер із заданими Auth/Socket контекстами + antd App + роутером. */
export function renderWithContexts(
  ui: ReactElement,
  opts: {
    auth?: Partial<AuthContextValue>;
    socket?: Partial<SocketContextValue>;
    route?: string;
  } = {},
) {
  const authValue = makeAuthValue(opts.auth);
  const socketValue = makeSocketValue(opts.socket);
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <ConfigProvider>
      <AntApp component={false}>
        <MemoryRouter initialEntries={[opts.route ?? '/']}>
          <AuthContext.Provider value={authValue}>
            <SocketContext.Provider value={socketValue}>
              {children}
            </SocketContext.Provider>
          </AuthContext.Provider>
        </MemoryRouter>
      </AntApp>
    </ConfigProvider>
  );
  return { ...render(ui, { wrapper: Wrapper }), authValue, socketValue };
}
