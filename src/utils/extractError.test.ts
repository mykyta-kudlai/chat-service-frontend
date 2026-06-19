import { describe, it, expect } from 'vitest';
import { AxiosError } from 'axios';
import { extractError } from './extractError';

/**
 * Юніт-тести для extractError (структура AAA).
 * Перевіряємо всі гілки: масив повідомлень, рядок, не-axios помилка.
 */
describe('extractError', () => {
  /** Допоміжний конструктор AxiosError із заданим тілом відповіді. */
  function makeAxiosError(data: unknown): AxiosError {
    const err = new AxiosError('Request failed');
    // @ts-expect-error — у тесті формуємо мінімально потрібний response.
    err.response = { data };
    return err;
  }

  it('склеює масив message через кому (формат NestJS ValidationPipe)', () => {
    // Arrange
    const err = makeAxiosError({ message: ['email обовʼязковий', 'пароль закороткий'] });

    // Act
    const result = extractError(err, 'fallback');

    // Assert
    expect(result).toBe('email обовʼязковий, пароль закороткий');
  });

  it('повертає рядок message як є', () => {
    // Arrange
    const err = makeAxiosError({ message: 'Невірний пароль' });

    // Act
    const result = extractError(err, 'fallback');

    // Assert
    expect(result).toBe('Невірний пароль');
  });

  it('повертає fallback, якщо message відсутній', () => {
    // Arrange
    const err = makeAxiosError({});

    // Act & Assert
    expect(extractError(err, 'fallback')).toBe('fallback');
  });

  it('повертає fallback для звичайної (не-axios) помилки', () => {
    // Arrange
    const err = new Error('boom');

    // Act & Assert
    expect(extractError(err, 'сталася помилка')).toBe('сталася помилка');
  });
});
