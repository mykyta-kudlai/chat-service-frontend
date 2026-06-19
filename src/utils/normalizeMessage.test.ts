import { describe, it, expect } from 'vitest';
import { guessMimeType, normalizeMessage } from './normalizeMessage';
import type { RawMessage } from '../types/message';

describe('guessMimeType', () => {
  it.each([
    ['photo.png', 'image/png'],
    ['photo.JPG', 'image/jpeg'],
    ['photo.jpeg', 'image/jpeg'],
    ['anim.gif', 'image/gif'],
    ['pic.webp', 'image/webp'],
    ['doc.pdf', 'application/pdf'],
    ['notes.txt', 'text/plain'],
  ])('визначає MIME для %s → %s', (filename, expected) => {
    // Act & Assert
    expect(guessMimeType(filename)).toBe(expected);
  });

  it('повертає octet-stream для невідомого розширення', () => {
    expect(guessMimeType('archive.zip')).toBe('application/octet-stream');
  });

  it('повертає octet-stream для файлу без розширення', () => {
    expect(guessMimeType('README')).toBe('application/octet-stream');
  });
});

describe('normalizeMessage', () => {
  const base: RawMessage = {
    id: 1,
    content: 'привіт',
    author: { username: 'mykyta' },
    createdAt: '2026-06-19T10:00:00.000Z',
  };

  it('повертає текстове повідомлення без file', () => {
    // Act
    const msg = normalizeMessage(base);

    // Assert
    expect(msg).toEqual({
      id: 1,
      content: 'привіт',
      author: { username: 'mykyta' },
      createdAt: '2026-06-19T10:00:00.000Z',
    });
    expect(msg.file).toBeUndefined();
  });

  it('розпізнає файлове повідомлення та прикріплює метадані', () => {
    // Arrange
    const raw: RawMessage = {
      ...base,
      content: '[Файл] звіт.pdf (/files/abc123.pdf)',
    };

    // Act
    const msg = normalizeMessage(raw);

    // Assert
    expect(msg.file).toEqual({
      filename: 'abc123.pdf',
      originalName: 'звіт.pdf',
      mimetype: 'application/pdf',
    });
  });

  it('визначає mimetype зображення за розширенням файлу', () => {
    // Arrange
    const raw: RawMessage = {
      ...base,
      content: '[Файл] cat.png (/files/stored-cat.png)',
    };

    // Act
    const msg = normalizeMessage(raw);

    // Assert
    expect(msg.file?.mimetype).toBe('image/png');
  });
});
