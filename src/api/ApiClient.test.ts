import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { InternalAxiosRequestConfig } from 'axios';
import { TOKEN_STORAGE_KEY } from '../constants';

// Мок axios: create() повертає контрольований інстанс, а ми перехоплюємо
// зареєстровані інтерсептори, щоб перевірити їхню логіку напряму.
const h = vi.hoisted(() => {
  const requestHandlers: Array<(c: InternalAxiosRequestConfig) => unknown> = [];
  const responseErrorHandlers: Array<(e: unknown) => unknown> = [];
  const post = vi.fn();
  const get = vi.fn();
  const instance = {
    post,
    get,
    interceptors: {
      request: { use: (fn: (c: InternalAxiosRequestConfig) => unknown) => requestHandlers.push(fn) },
      response: {
        use: (_ok: unknown, err: (e: unknown) => unknown) => responseErrorHandlers.push(err),
      },
    },
  };
  return { instance, requestHandlers, responseErrorHandlers, post, get };
});

vi.mock('axios', () => ({
  default: { create: vi.fn(() => h.instance) },
}));

// Імпортуємо ПІСЛЯ налаштування моку — конструктор синглтона зареєструє інтерсептори.
const { apiClient } = await import('./ApiClient');

const requestInterceptor = h.requestHandlers[0];
const responseErrorInterceptor = h.responseErrorHandlers[0];

describe('ApiClient — request interceptor (JWT)', () => {
  beforeEach(() => localStorage.clear());

  it('додає заголовок Authorization, коли токен є в localStorage', () => {
    // Arrange
    localStorage.setItem(TOKEN_STORAGE_KEY, 'tok-123');
    const config = { headers: {} } as unknown as InternalAxiosRequestConfig;

    // Act
    const result = requestInterceptor(config) as InternalAxiosRequestConfig;

    // Assert
    expect(result.headers.Authorization).toBe('Bearer tok-123');
  });

  it('не додає Authorization без токена', () => {
    // Arrange
    const config = { headers: {} } as unknown as InternalAxiosRequestConfig;

    // Act
    const result = requestInterceptor(config) as InternalAxiosRequestConfig;

    // Assert
    expect(result.headers.Authorization).toBeUndefined();
  });
});

describe('ApiClient — response interceptor (401)', () => {
  let assign: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    assign = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { pathname: '/chat', assign },
      writable: true,
    });
  });

  it('на 401 поза /auth чистить токен і редіректить на /login', async () => {
    // Arrange
    localStorage.setItem(TOKEN_STORAGE_KEY, 'tok');
    const error = { response: { status: 401 }, config: { url: '/files/x.png' } };

    // Act & Assert
    await expect(responseErrorInterceptor(error)).rejects.toBe(error);
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(assign).toHaveBeenCalledWith('/login');
  });

  it('на 401 для /auth/* НЕ чистить токен (це невірні дані входу)', async () => {
    // Arrange
    localStorage.setItem(TOKEN_STORAGE_KEY, 'tok');
    const error = { response: { status: 401 }, config: { url: '/auth/login' } };

    // Act & Assert
    await expect(responseErrorInterceptor(error)).rejects.toBe(error);
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('tok');
    expect(assign).not.toHaveBeenCalled();
  });
});

describe('ApiClient — модулі auth і files', () => {
  beforeEach(() => {
    h.post.mockReset();
    h.get.mockReset();
  });

  it('auth.login → POST /auth/login і повертає тіло відповіді', async () => {
    // Arrange
    h.post.mockResolvedValue({ data: { access_token: 'jwt' } });

    // Act
    const data = await apiClient.auth.login('mykyta', 'secret');

    // Assert
    expect(h.post).toHaveBeenCalledWith('/auth/login', {
      username: 'mykyta',
      password: 'secret',
    });
    expect(data).toEqual({ access_token: 'jwt' });
  });

  it('auth.register → POST /auth/register', async () => {
    // Arrange
    h.post.mockResolvedValue({ data: { access_token: 'jwt2' } });

    // Act
    const data = await apiClient.auth.register('newbie', 'secret');

    // Assert
    expect(h.post).toHaveBeenCalledWith('/auth/register', {
      username: 'newbie',
      password: 'secret',
    });
    expect(data.access_token).toBe('jwt2');
  });

  it('files.upload → POST /files/upload із FormData', async () => {
    // Arrange
    h.post.mockResolvedValue({ data: { filename: 'stored.png' } });
    const file = new File(['x'], 'cat.png', { type: 'image/png' });

    // Act
    await apiClient.files.upload(file);

    // Assert
    const [url, body] = h.post.mock.calls[0];
    expect(url).toBe('/files/upload');
    expect(body).toBeInstanceOf(FormData);
  });

  it('files.fetchObjectUrl → GET як blob і повертає objectURL', async () => {
    // Arrange
    const blob = new Blob(['data']);
    h.get.mockResolvedValue({ data: blob });

    // Act
    const url = await apiClient.files.fetchObjectUrl('stored.png');

    // Assert
    expect(h.get).toHaveBeenCalledWith('/files/stored.png', { responseType: 'blob' });
    expect(url).toBe('blob:mock-url');
  });
});
