import { useContext } from 'react';
import { SocketContext } from '../contexts/SocketContext';
import type { SocketContextValue } from '../contexts/SocketContext';

/** Хук доступу до SocketContext. */
export function useSocket(): SocketContextValue {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error('useSocket має використовуватися всередині <SocketProvider>');
  }
  return ctx;
}
