import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header from './Header';
import { renderWithContexts } from '../test/utils';

describe('Header (інтеграція)', () => {
  it('показує імʼя поточного користувача', () => {
    // Act
    renderWithContexts(<Header />, { auth: { user: { username: 'mykyta' } } });

    // Assert
    expect(screen.getByText('mykyta')).toBeInTheDocument();
  });

  it('показує «Гість», коли користувача немає', () => {
    // Act
    renderWithContexts(<Header />, { auth: { user: null } });

    // Assert
    expect(screen.getByText('Гість')).toBeInTheDocument();
  });

  it('викликає logout при натисканні «Вийти»', async () => {
    // Arrange
    const user = userEvent.setup();
    const { authValue } = renderWithContexts(<Header />, {
      auth: { user: { username: 'mykyta' } },
    });

    // Act
    await user.click(screen.getByRole('button', { name: /Вийти/ }));

    // Assert
    expect(authValue.logout).toHaveBeenCalledTimes(1);
  });
});
