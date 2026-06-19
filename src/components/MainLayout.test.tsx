import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import MainLayout from './MainLayout';
import { renderWithContexts } from '../test/utils';

describe('MainLayout (інтеграція)', () => {
  it('рендерить шапку (Header) для захищеної частини застосунку', () => {
    // Act
    renderWithContexts(<MainLayout />, { auth: { user: { username: 'mykyta' } } });

    // Assert — заголовок із Header
    expect(screen.getByText('Чат')).toBeInTheDocument();
    expect(screen.getByText('mykyta')).toBeInTheDocument();
  });
});
