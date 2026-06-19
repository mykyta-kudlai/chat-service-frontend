import type { User } from './user';

export interface MessageFile {
  /** Ім'я файлу на сервері (використовується в URL /files/:filename). */
  filename: string;
  /** Оригінальне ім'я файлу (для підпису/завантаження). */
  originalName: string;
  /** MIME-тип. Для повідомлень з історії може бути визначений за розширенням. */
  mimetype: string;
}

export interface ChatMessage {
  id: number;
  content: string;
  author: User;
  createdAt: string;
  file?: MessageFile;
}

/** Подія 'newMessage' / елемент масиву 'history'. */
export interface RawMessage {
  id: number;
  content: string;
  author: { username: string };
  createdAt: string;
}

/** Подія 'fileUploaded'. */
export interface RawFileUploaded {
  id: number;
  filename: string;
  originalName: string;
  mimetype: string;
  owner: { username: string };
  messageId: number;
  createdAt: string;
}

/** Подія 'userJoined' / 'userLeft'. */
export interface UserPresence {
  username: string;
}
