import { useEffect, useRef } from 'react';
import { List } from 'antd';
import type { ChatMessage } from '../../types/message';
import MessageItem from './MessageItem';
import styles from './MessageList.module.scss';

interface MessageListProps {
  messages: ChatMessage[];
  /** Ім'я поточного користувача — для позначки власних повідомлень. */
  currentUsername?: string;
}

/**
 * Список повідомлень із автоскролом донизу при появі нових.
 */
export default function MessageList({ messages, currentUsername }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Автоскрол: щоразу, коли змінюється кількість повідомлень,
  // прокручуємо контейнер до останнього елемента.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div className={styles.list}>
      <List
        dataSource={messages}
        locale={{ emptyText: 'Повідомлень ще немає' }}
        renderItem={(message) => (
          <MessageItem
            key={message.id}
            message={message}
            isOwn={message.author.username === currentUsername}
          />
        )}
      />
      {/* Якір для автоскролу */}
      <div ref={bottomRef} />
    </div>
  );
}
