import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from './Footer';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';

function renderWithI18n(ui: React.ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
}

describe('Footer', () => {
  it('renders footer with app name', () => {
    renderWithI18n(<Footer />);
    expect(screen.getByText(/et3am/i)).toBeInTheDocument();
  });

  it('renders footer links section', () => {
    renderWithI18n(<Footer />);
    expect(screen.getByText(/et3am.com/)).toBeInTheDocument();
  });

  it('renders copyright notice', () => {
    renderWithI18n(<Footer />);
    expect(screen.getByText(/© 2025/)).toBeInTheDocument();
  });
});