import { createContext } from 'react';
import type { Socket } from 'socket.io-client';

/** Значення, яке надає SocketContext. */
export interface SocketContextValue {
  socket: Socket | null;
  /** true, коли встановлено з'єднання з сервером. */
  connected: boolean;
  /** Текст помилки з'єднання (відмова, відхилення сервером), якщо є. */
  error: string | null;
}

/**
 * Контекст WebSocket-з'єднання.
 * Провайдер — у SocketProvider.tsx, хук доступу — у hooks/useSocket.ts.
 */
export const SocketContext = createContext<SocketContextValue | undefined>(undefined);
