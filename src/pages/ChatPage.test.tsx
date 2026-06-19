import { describe, it, expect, vi } from 'vitest';
import { screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatPage from './ChatPage';
import {
  renderWithContexts,
  createFakeSocket,
  type FakeSocket,
} from '../test/utils';
import type { RawMessage, RawFileUploaded } from '../types/message';

// MessageItem тягне превʼю через apiClient — мокуємо інфраструктуру.
vi.mock('../api/ApiClient', () => ({
  apiClient: { files: { fetchObjectUrl: vi.fn().mockResolvedValue('blob:preview') } },
}));

const rawMsg = (id: number, content: string, username = 'bob'): RawMessage => ({
  id,
  content,
  author: { username },
  createdAt: '2026-06-19T10:00:00.000Z',
});

/** Рендерить ChatPage з фейковим сокетом і повертає керування подіями. */
function setup(opts: { connected?: boolean; error?: string | null; username?: string } = {}) {
  const fake: FakeSocket = createFakeSocket();
  const utils = renderWithContexts(<ChatPage />, {
    auth: { user: { username: opts.username ?? 'mykyta' } },
    socket: {
      socket: fake.socket,
      connected: opts.connected ?? true,
      error: opts.error ?? null,
    },
  });
  return { fake, ...utils };
}

describe('ChatPage (інтеграція, патерн Спостерігач)', () => {
  it('відображає історію повідомлень із події history', () => {
    // Arrange
    const { fake } = setup();

    // Act
    act(() => fake.emitServer('history', [rawMsg(1, 'привіт'), rawMsg(2, 'як справи')]));

    // Assert
    expect(screen.getByText('привіт')).toBeInTheDocument();
    expect(screen.getByText('як справи')).toBeInTheDocument();
  });

  it('додає нове повідомлення (newMessage) і фільтрує дублікати за id', () => {
    // Arrange
    const { fake } = setup();

    // Act
    act(() => fake.emitServer('newMessage', rawMsg(1, 'єдине')));
    act(() => fake.emitServer('newMessage', rawMsg(1, 'єдине'))); // дубль за id

    // Assert
    expect(screen.getAllByText('єдине')).toHaveLength(1);
  });

  it('уточнює метадані файлу за подією fileUploaded', async () => {
    // Arrange
    const { fake } = setup();
    act(() => fake.emitServer('newMessage', rawMsg(5, '[Файл] pic.png (/files/s.png)')));

    const payload: RawFileUploaded = {
      id: 99,
      filename: 's.png',
      originalName: 'pic.png',
      mimetype: 'image/png',
      owner: { username: 'bob' },
      messageId: 5,
      createdAt: '2026-06-19T10:00:00.000Z',
    };

    // Act
    act(() => fake.emitServer('fileUploaded', payload));

    // Assert — повідомлення стало зображенням, превʼю тягнеться (alt = originalName)
    expect(await screen.findByAltText('pic.png')).toBeInTheDocument();
  });

  it('надсилає текст через socket.emit("sendMessage")', async () => {
    // Arrange
    const user = userEvent.setup();
    const { fake } = setup({ connected: true });

    // Act
    await user.type(screen.getByPlaceholderText('Введіть повідомлення...'), 'hello');
    await user.click(screen.getByRole('button', { name: /Надіслати/ }));

    // Assert
    expect(fake.emit).toHaveBeenCalledWith('sendMessage', { content: 'hello' });
  });

  it('показує банер помилки зʼєднання', () => {
    // Act
    setup({ error: 'Не вдалося підʼєднатися' });

    // Assert
    expect(screen.getByText('Не вдалося підʼєднатися')).toBeInTheDocument();
  });

  it('показує індикатор підключення, поки сокет не зʼєднано', () => {
    // Act
    setup({ connected: false });

    // Assert
    expect(screen.getByText('Підключення до сервера...')).toBeInTheDocument();
  });

  it('повідомляє про приєднання іншого користувача (userJoined)', () => {
    // Arrange
    const { fake } = setup({ username: 'mykyta' });

    // Act
    act(() => fake.emitServer('userJoined', { username: 'bob' }));

    // Assert
    expect(screen.getByText('bob приєднався до чату')).toBeInTheDocument();
  });

  it('ігнорує власні події присутності', () => {
    // Arrange
    const { fake } = setup({ username: 'mykyta' });

    // Act
    act(() => fake.emitServer('userJoined', { username: 'mykyta' }));

    // Assert
    expect(screen.queryByText(/приєднався/)).not.toBeInTheDocument();
  });

  it('відписується від подій при розмонтуванні', () => {
    // Arrange
    const { fake, unmount } = setup();

    // Act
    unmount();

    // Assert — usEffect cleanup викликав socket.off для кожної підписки
    expect(fake.socket.off).toHaveBeenCalled();
  });
});
