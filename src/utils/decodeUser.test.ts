import { describe, it, expect } from 'vitest';
import { decodeUser } from './decodeUser';

/**
 * Юніт-тести для decodeUser — декодування username з payload JWT.
 * Токен не підписуємо реально: важлива лише структура header.payload.signature
 * з base64url-кодованим payload.
 */
describe('decodeUser', () => {
  /** Формує псевдо-JWT із заданим payload (base64url, без підпису). */
  function makeToken(payload: object): string {
    const body = btoa(JSON.stringify(payload))
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    return `header.${body}.signature`;
  }

  it('повертає користувача з валідного токена', () => {
    // Arrange
    const token = makeToken({ username: 'mykyta', sub: 1 });

    // Act
    const user = decodeUser(token);

    // Assert
    expect(user).toEqual({ username: 'mykyta' });
  });

  it('повертає null, якщо у payload немає username', () => {
    // Arrange
    const token = makeToken({ sub: 1 });

    // Act & Assert
    expect(decodeUser(token)).toBeNull();
  });

  it('повертає null для пошкодженого токена (без падіння)', () => {
    // Arrange
    const broken = 'not-a-valid-jwt';

    // Act & Assert
    expect(decodeUser(broken)).toBeNull();
  });
});
