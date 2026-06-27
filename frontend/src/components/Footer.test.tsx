import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Footer from './Footer';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>{ui}</I18nextProvider>
    </MemoryRouter>
  );
}

describe('Footer', () => {
  it('renders portfolio link', () => {
    renderWithProviders(<Footer />);
    expect(screen.getAllByText(/Amr Lotfy/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders version number', () => {
    renderWithProviders(<Footer />);
    expect(screen.getByText(/v\d+\.\d+\.\d+/)).toBeInTheDocument();
  });

  it('renders MIT license', () => {
    renderWithProviders(<Footer />);
    expect(screen.getByText(/MIT License/)).toBeInTheDocument();
  });
});
