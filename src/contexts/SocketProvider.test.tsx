import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { SocketProvider } from './SocketProvider';
import { AuthContext } from './AuthContext';
import { useSocket } from '../hooks/useSocket';
import { makeAuthValue, createFakeSocket, type FakeSocket } from '../test/utils';

// Мокуємо фабрику зʼєднання socket.io-client.
const ioMock = vi.hoisted(() => vi.fn());
vi.mock('socket.io-client', () => ({ io: ioMock }));

/** Споживач, що відображає стан зʼєднання. */
function Consumer() {
  const { connected, error, socket } = useSocket();
  return (
    <div>
      <span data-testid="connected">{String(connected)}</span>
      <span data-testid="error">{error ?? 'none'}</span>
      <span data-testid="has-socket">{String(!!socket)}</span>
    </div>
  );
}

function renderProvider(token: string | null) {
  return render(
    <AuthContext.Provider value={makeAuthValue({ token })}>
      <SocketProvider>
        <Consumer />
      </SocketProvider>
    </AuthContext.Provider>,
  );
}

describe('SocketProvider (інтеграція, керування життєвим циклом сокета)', () => {
  let fake: FakeSocket;

  beforeEach(() => {
    ioMock.mockReset();
    fake = createFakeSocket();
    ioMock.mockReturnValue(fake.socket);
  });

  it('не підключається без токена', () => {
    // Act
    renderProvider(null);

    // Assert
    expect(ioMock).not.toHaveBeenCalled();
    expect(screen.getByTestId('has-socket')).toHaveTextContent('false');
  });

  it("підключається з токеном у handshake (auth: { token })", () => {
    // Act
    renderProvider('jwt-abc');

    // Assert
    expect(ioMock).toHaveBeenCalledTimes(1);
    const [, options] = ioMock.mock.calls[0];
    expect(options).toMatchObject({ auth: { token: 'jwt-abc' }, transports: ['websocket'] });
  });

  it("оновлює connected=true при події 'connect'", () => {
    // Arrange
    renderProvider('jwt-abc');

    // Act
    act(() => fake.emitServer('connect'));

    // Assert
    expect(screen.getByTestId('connected')).toHaveTextContent('true');
  });

  it("виставляє помилку при 'connect_error'", () => {
    // Arrange
    renderProvider('jwt-abc');

    // Act
    act(() => fake.emitServer('connect_error', new Error('boom')));

    // Assert
    expect(screen.getByTestId('error')).toHaveTextContent(/boom/);
  });

  it('закриває зʼєднання при розмонтуванні', () => {
    // Arrange
    const { unmount } = renderProvider('jwt-abc');

    // Act
    unmount();

    // Assert
    expect(fake.socket.disconnect).toHaveBeenCalled();
  });
});
