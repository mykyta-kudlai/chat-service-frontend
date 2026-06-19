import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { useSocket } from './useSocket';

function Consumer() {
  useSocket();
  return null;
}

describe('useSocket', () => {
  it('кидає помилку поза межами SocketProvider', () => {
    // Arrange
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Act & Assert
    expect(() => render(<Consumer />)).toThrow(/SocketProvider/);

    spy.mockRestore();
  });
});
