import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageInput from './MessageInput';
import { renderWithProviders } from '../../test/utils';
import { apiClient } from '../../api/ApiClient';

vi.mock('../../api/ApiClient', () => ({
  apiClient: { files: { upload: vi.fn() } },
}));

const upload = vi.mocked(apiClient.files.upload);

describe('MessageInput (інтеграція)', () => {
  beforeEach(() => upload.mockReset());

  it('надсилає введений текст і очищує поле', async () => {
    // Arrange
    const user = userEvent.setup();
    const onSend = vi.fn();
    renderWithProviders(<MessageInput onSend={onSend} />);
    const input = screen.getByPlaceholderText('Введіть повідомлення...');

    // Act
    await user.type(input, 'привіт{Enter}');

    // Assert
    expect(onSend).toHaveBeenCalledWith('привіт');
    expect(input).toHaveValue('');
  });

  it('надсилає текст по кнопці «Надіслати»', async () => {
    // Arrange
    const user = userEvent.setup();
    const onSend = vi.fn();
    renderWithProviders(<MessageInput onSend={onSend} />);

    // Act
    await user.type(screen.getByPlaceholderText('Введіть повідомлення...'), 'хей');
    await user.click(screen.getByRole('button', { name: /Надіслати/ }));

    // Assert
    expect(onSend).toHaveBeenCalledWith('хей');
  });

  it('ігнорує надсилання порожнього/пробільного тексту', async () => {
    // Arrange
    const user = userEvent.setup();
    const onSend = vi.fn();
    renderWithProviders(<MessageInput onSend={onSend} />);

    // Act
    await user.type(screen.getByPlaceholderText('Введіть повідомлення...'), '   {Enter}');

    // Assert
    expect(onSend).not.toHaveBeenCalled();
  });

  it('блокує поле та кнопку, коли disabled', () => {
    // Act
    renderWithProviders(<MessageInput onSend={vi.fn()} disabled />);

    // Assert
    expect(screen.getByPlaceholderText('Введіть повідомлення...')).toBeDisabled();
    expect(screen.getByRole('button', { name: /Надіслати/ })).toBeDisabled();
  });

  it('завантажує прикріплений файл через apiClient.files.upload', async () => {
    // Arrange
    const user = userEvent.setup();
    upload.mockResolvedValue({
      message: 'ok',
      filename: 'stored.png',
      originalName: 'cat.png',
      mimetype: 'image/png',
      chatMessage: '[Файл] cat.png (/files/stored.png)',
    });
    const { container } = renderWithProviders(<MessageInput onSend={vi.fn()} />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['data'], 'cat.png', { type: 'image/png' });

    // Act
    await user.upload(fileInput, file);

    // Assert
    await waitFor(() => expect(upload).toHaveBeenCalledTimes(1));
    expect(upload.mock.calls[0][0]).toBeInstanceOf(File);
  });
});
