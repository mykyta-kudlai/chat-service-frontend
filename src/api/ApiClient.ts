import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { TOKEN_STORAGE_KEY } from '../constants';
import type { AuthResponse, UploadResponse } from '../types/api';

class ApiClient {
  private readonly httpClient: AxiosInstance;

  /** Підмодуль автентифікації. */
  public readonly auth: AuthModule;

  /** Підмодуль роботи з файлами. */
  public readonly files: FilesModule;

  constructor() {
    this.httpClient = axios.create({ baseURL: import.meta.env.VITE_API_URL });

    // ── Interceptor: автоматично додає JWT з localStorage до кожного запиту ──
    // Так жоден виклик не мусить вручну формувати заголовок Authorization.
    this.httpClient.interceptors.request.use((config) => {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // ── Response interceptor: реакція на протермінований/невалідний токен ──
    // 401 на захищеному ендпоінті означає, що сесія недійсна: чистимо токен і
    // кидаємо на /login. Ендпоінти /auth/* пропускаємо — там 401 = невірні
    // дані входу, а не протермінована сесія.
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error?.response?.status;
        const url: string = error?.config?.url ?? '';
        const isAuthEndpoint = url.includes('/auth/');
        if (status === 401 && !isAuthEndpoint) {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          if (window.location.pathname !== '/login') {
            window.location.assign('/login');
          }
        }
        return Promise.reject(error);
      },
    );

    this.auth = new AuthModule(this.httpClient);
    this.files = new FilesModule(this.httpClient);
  }
}

/** Модуль автентифікації. */
class AuthModule {
  private readonly httpClient: AxiosInstance;

  constructor(httpClient: AxiosInstance) {
    this.httpClient = httpClient;
  }

  /** POST /auth/login → { access_token } */
  async login(username: string, password: string): Promise<AuthResponse> {
    const { data } = await this.httpClient.post<AuthResponse>('/auth/login', {
      username,
      password,
    });
    return data;
  }

  /** POST /auth/register → { access_token } */
  async register(username: string, password: string): Promise<AuthResponse> {
    const { data } = await this.httpClient.post<AuthResponse>('/auth/register', {
      username,
      password,
    });
    return data;
  }
}

/** Модуль роботи з файлами. */
class FilesModule {
  private readonly httpClient: AxiosInstance;

  constructor(httpClient: AxiosInstance) {
    this.httpClient = httpClient;
  }

  /**
   * POST /files/upload — завантаження файлу (multipart/form-data).
   * Заголовок Authorization додається interceptor'ом автоматично.
   */
  async upload(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await this.httpClient.post<UploadResponse>(
      '/files/upload',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
    return data;
  }

  /**
   * GET /files/:filename — ендпоінт захищений JWT, тому звичайний <img src>
   * повертає 401. Тягнемо файл як blob (з токеном через interceptor) і
   * створюємо objectURL для показу зображення / завантаження.
   * Викликач відповідає за URL.revokeObjectURL після використання.
   */
  async fetchObjectUrl(filename: string): Promise<string> {
    const { data } = await this.httpClient.get<Blob>(`/files/${filename}`, {
      responseType: 'blob',
    });
    return URL.createObjectURL(data);
  }
}

/** Єдиний екземпляр на весь застосунок. */
export const apiClient = new ApiClient();
