import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

import { useAuth } from '../hooks/useAuth';
import { SocketContext } from './SocketContext';

/**
 * Провайдер WebSocket-з'єднання (патерн СПОСТЕРІГАЧ / Observer).
 *
 * Socket.IO реалізує Observer: сервер — суб'єкт, що публікує події
 * ('newMessage', 'history', 'fileUploaded' ...), а клієнти — спостерігачі,
 * які підписуються через socket.on(...). Цей провайдер керує життєвим циклом
 * єдиного сокета; конкретні підписки робить ChatPage.
 */
export function SocketProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  // Тримаємо екземпляр сокета у стані: споживачам потрібен ре-рендер, коли
  // сокет з'являється/зникає, щоб ChatPage встиг підписатись на 'history'.
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Без токена не підключаємось (користувач не автентифікований).
    if (!token) {
      return;
    }

    // Підключення сокета
    const instance = io(import.meta.env.VITE_API_URL, {
      auth: { token },
      transports: ['websocket'],
    });
    // Навмисно синхронно: споживачі мають отримати сокет одразу, щоб
    // встигнути підписатись на 'history' до того, як сервер його надішле.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(instance);

    instance.on('connect', () => {
      setConnected(true);
      setError(null);
    });
    instance.on('disconnect', (reason) => {
      setConnected(false);
      // Сервер сам розірвав з'єднання — найімовірніше відхилив токен.
      if (reason === 'io server disconnect') {
        setError('З\'єднання відхилено сервером — можливо, сесія завершилася.');
      }
    });
    // Не вдалося під'єднатися (сервер недоступний / помилка хендшейку).
    instance.on('connect_error', (err) => {
      setConnected(false);
      setError(`Не вдалося під'єднатися: ${err.message}`);
    });

    // Очищення при logout / розмонтуванні — закриваємо з'єднання.
    return () => {
      instance.disconnect();
      setSocket(null);
      setConnected(false);
      setError(null);
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, connected, error }}>
      {children}
    </SocketContext.Provider>
  );
}
