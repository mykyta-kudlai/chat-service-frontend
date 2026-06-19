import type { ChatMessage, RawMessage } from '../types/message';

/** Розпізнавання службового тексту файлового повідомлення з бекенду. */
export const FILE_CONTENT_RE = /^\[Файл\]\s+(.+)\s+\(\/files\/([^)]+)\)$/;

/** Визначає MIME-тип за розширенням (для повідомлень з історії). */
export function guessMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    pdf: 'application/pdf',
    txt: 'text/plain',
  };
  return map[ext] ?? 'application/octet-stream';
}

/**
 * Нормалізує «сире» повідомлення бекенду в ChatMessage.
 * Файлові повідомлення приходять як текст виду
 * «[Файл] назва (/files/ім'я)» — розпізнаємо й прикріплюємо метадані.
 */
export function normalizeMessage(raw: RawMessage): ChatMessage {
  const match = raw.content.match(FILE_CONTENT_RE);
  if (match) {
    const [, originalName, filename] = match;
    return {
      id: raw.id,
      content: raw.content,
      author: raw.author,
      createdAt: raw.createdAt,
      file: { filename, originalName, mimetype: guessMimeType(filename) },
    };
  }
  return {
    id: raw.id,
    content: raw.content,
    author: raw.author,
    createdAt: raw.createdAt,
  };
}
