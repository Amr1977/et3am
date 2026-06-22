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
    expect(screen.getByText(/إطعام/i)).toBeInTheDocument();
  });

  it('renders et3am.com link', () => {
    renderWithI18n(<Footer />);
    expect(screen.getByText(/et3am.com/)).toBeInTheDocument();
  });

  it('renders portfolio link', () => {
    renderWithI18n(<Footer />);
    expect(screen.getAllByText(/Amr Lotfy/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders version number', () => {
    renderWithI18n(<Footer />);
    expect(screen.getByText(/v\d+\.\d+\.\d+/)).toBeInTheDocument();
  });

  it('renders MIT license', () => {
    renderWithI18n(<Footer />);
    expect(screen.getByText(/MIT License/)).toBeInTheDocument();
  });
});
