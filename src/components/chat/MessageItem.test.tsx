import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageItem from './MessageItem';
import type { ChatMessage } from '../../types/message';
import { renderWithProviders } from '../../test/utils';
import { apiClient } from '../../api/ApiClient';

// Мокуємо інфраструктурний шар (axios-фасад), щоб тест не ходив у мережу.
vi.mock('../../api/ApiClient', () => ({
  apiClient: { files: { fetchObjectUrl: vi.fn() } },
}));

const fetchObjectUrl = vi.mocked(apiClient.files.fetchObjectUrl);

const textMsg: ChatMessage = {
  id: 1,
  content: 'привіт',
  author: { username: 'mykyta' },
  createdAt: '2026-06-19T10:00:00.000Z',
};

const fileMsg = (mimetype: string): ChatMessage => ({
  ...textMsg,
  content: '[Файл] doc.pdf (/files/stored.pdf)',
  file: { filename: 'stored.pdf', originalName: 'doc.pdf', mimetype },
});

describe('MessageItem (інтеграція)', () => {
  beforeEach(() => {
    fetchObjectUrl.mockReset();
  });

  it('рендерить текстове повідомлення', () => {
    // Act
    renderWithProviders(<MessageItem message={textMsg} isOwn={false} />);

    // Assert
    expect(screen.getByText('привіт')).toBeInTheDocument();
    expect(fetchObjectUrl).not.toHaveBeenCalled();
  });

  it('для не-зображення показує імʼя файлу та кнопку завантаження', () => {
    // Act
    renderWithProviders(
      <MessageItem message={fileMsg('application/pdf')} isOwn={false} />,
    );

    // Assert
    expect(screen.getByText('doc.pdf')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Завантажити файл/ }),
    ).toBeInTheDocument();
  });

  it('завантажує файл за кліком (через objectURL)', async () => {
    // Arrange
    const user = userEvent.setup();
    fetchObjectUrl.mockResolvedValue('blob:file-url');
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    renderWithProviders(
      <MessageItem message={fileMsg('application/pdf')} isOwn={false} />,
    );

    // Act
    await user.click(screen.getByRole('button', { name: /Завантажити файл/ }));

    // Assert
    await waitFor(() => expect(fetchObjectUrl).toHaveBeenCalledWith('stored.pdf'));
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it('для зображення завантажує превʼю (objectURL → <img>)', async () => {
    // Arrange
    fetchObjectUrl.mockResolvedValue('blob:image-url');

    // Act
    renderWithProviders(<MessageItem message={fileMsg('image/png')} isOwn={false} />);

    // Assert
    await waitFor(() => expect(fetchObjectUrl).toHaveBeenCalledWith('stored.pdf'));
    const img = await screen.findByAltText('doc.pdf');
    expect(img).toHaveAttribute('src', 'blob:image-url');
  });

  it('показує помилку, якщо зображення не завантажилось', async () => {
    // Arrange
    fetchObjectUrl.mockRejectedValue(new Error('404'));

    // Act
    renderWithProviders(<MessageItem message={fileMsg('image/png')} isOwn={false} />);

    // Assert
    expect(await screen.findByText('Неможливо завантажити файл')).toBeInTheDocument();
  });
});
