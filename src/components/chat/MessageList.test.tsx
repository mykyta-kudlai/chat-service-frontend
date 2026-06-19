import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import MessageList from './MessageList';
import type { ChatMessage } from '../../types/message';
import { renderWithProviders } from '../../test/utils';

const msg = (id: number, username: string, content: string): ChatMessage => ({
  id,
  content,
  author: { username },
  createdAt: '2026-06-19T10:00:00.000Z',
});

describe('MessageList (інтеграція)', () => {
  it('показує заглушку, коли повідомлень немає', () => {
    // Act
    renderWithProviders(<MessageList messages={[]} />);

    // Assert
    expect(screen.getByText('Повідомлень ще немає')).toBeInTheDocument();
  });

  it('рендерить усі повідомлення з іменами авторів', () => {
    // Arrange
    const messages = [msg(1, 'alice', 'привіт'), msg(2, 'bob', 'хей')];

    // Act
    renderWithProviders(<MessageList messages={messages} />);

    // Assert
    expect(screen.getByText('привіт')).toBeInTheDocument();
    expect(screen.getByText('хей')).toBeInTheDocument();
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
  });

  it('позначає власні повідомлення як «(ви)»', () => {
    // Act
    renderWithProviders(
      <MessageList messages={[msg(1, 'mykyta', 'моє')]} currentUsername="mykyta" />,
    );

    // Assert
    expect(screen.getByText('(ви)')).toBeInTheDocument();
  });

  it('автоскролить до останнього повідомлення', () => {
    // Act
    renderWithProviders(<MessageList messages={[msg(1, 'a', 'x')]} />);

    // Assert — scrollIntoView застаблено в setup.ts
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });
});
