import { useEffect, useState } from 'react';
import { Alert, App } from 'antd';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import MessageList from '../components/chat/MessageList';
import MessageInput from '../components/chat/MessageInput';
import type {
  ChatMessage,
  RawMessage,
  RawFileUploaded,
  UserPresence,
} from '../types/message';
import { normalizeMessage } from '../utils/normalizeMessage';
import styles from './ChatPage.module.scss';

/**
 * Сторінка чату.
 * Тримає стан повідомлень і підписується на події WebSocket (Observer):
 * 'history', 'newMessage', 'fileUploaded'.
 */
export default function ChatPage() {
  const { socket, connected, error } = useSocket();
  const { user } = useAuth();
  const { message } = App.useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const username = user?.username;

  // ── Підписки на події сокета (патерн Спостерігач) ──
  useEffect(() => {
    if (!socket) {
      return;
    }

    // Початкова історія повідомлень (масив у форматі RawMessage).
    const handleHistory = (history: RawMessage[]) => {
      setMessages(history.map(normalizeMessage));
    };

    // Нове повідомлення; захист від дублікатів за id.
    const handleNewMessage = (raw: RawMessage) => {
      setMessages((prev) =>
        prev.some((m) => m.id === raw.id) ? prev : [...prev, normalizeMessage(raw)],
      );
    };

    // Завантажено файл: уточнюємо метадані відповідного повідомлення
    // (за messageId) точним mimetype з сервера.
    const handleFileUploaded = (payload: RawFileUploaded) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === payload.messageId
            ? {
                ...m,
                file: {
                  filename: payload.filename,
                  originalName: payload.originalName,
                  mimetype: payload.mimetype,
                },
              }
            : m,
        ),
      );
    };

    // Присутність користувачів (свої події ігноруємо).
    const handleUserJoined = (p: UserPresence) => {
      if (p.username !== username) {
        message.info(`${p.username} приєднався до чату`);
      }
    };
    const handleUserLeft = (p: UserPresence) => {
      if (p.username !== username) {
        message.info(`${p.username} вийшов із чату`);
      }
    };

    socket.on('history', handleHistory);
    socket.on('newMessage', handleNewMessage);
    socket.on('fileUploaded', handleFileUploaded);
    socket.on('userJoined', handleUserJoined);
    socket.on('userLeft', handleUserLeft);

    // Відписка при зміні сокета / розмонтуванні.
    return () => {
      socket.off('history', handleHistory);
      socket.off('newMessage', handleNewMessage);
      socket.off('fileUploaded', handleFileUploaded);
      socket.off('userJoined', handleUserJoined);
      socket.off('userLeft', handleUserLeft);
    };
  }, [socket, username, message]);

  // Надсилання тексту — emit 'sendMessage' з полем content (формат бекенду).
  const handleSend = (text: string) => {
    socket?.emit('sendMessage', { content: text });
  };

  return (
    <div className={styles.chat}>
      {error ? (
        <Alert type="error" banner message={error} className={styles.alert} />
      ) : (
        !connected && (
          <Alert
            type="warning"
            banner
            message="Підключення до сервера..."
            className={styles.alert}
          />
        )
      )}
      <MessageList messages={messages} currentUsername={user?.username} />
      <MessageInput onSend={handleSend} disabled={!connected} />
    </div>
  );
}
