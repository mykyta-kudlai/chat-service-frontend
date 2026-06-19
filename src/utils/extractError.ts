import { isAxiosError } from 'axios';

/**
 * Витягує читабельний текст помилки з відповіді axios.
 * NestJS ValidationPipe повертає `message` масивом — склеюємо в один рядок.
 */
export function extractError(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const data = err.response?.data?.message;
    if (Array.isArray(data)) return data.join(', ');
    if (typeof data === 'string') return data;
  }
  return fallback;
}
