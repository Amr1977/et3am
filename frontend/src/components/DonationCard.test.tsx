import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DonationCard from './DonationCard';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';

const mockDonation = {
  id: 'test-1',
  title: 'Test Food',
  description: 'Test description',
  food_type: ' cooked',
  quantity: 5,
  unit: 'meals',
  pickup_address: '123 Test St',
  latitude: 30.0444,
  longitude: 31.2357,
  pickup_date: '2025-12-31',
  expiry_date: '2026-01-01',
  status: 'available',
  donor_id: 'user-1',
  donor_name: 'Test Donor',
};

const t = (key: string) => key;

function renderWithI18n(ui: React.ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
}

describe('DonationCard', () => {
  it('renders donation title', () => {
    renderWithI18n(<DonationCard donation={mockDonation} t={t} />);
    expect(screen.getByText('Test Food')).toBeInTheDocument();
  });

  it('renders donation description', () => {
    renderWithI18n(<DonationCard donation={mockDonation} t={t} />);
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('renders food type and quantity', () => {
    renderWithI18n(<DonationCard donation={mockDonation} t={t} />);
    expect(screen.getByText(/cooked/)).toBeInTheDocument();
    expect(screen.getAllByText(/5 donations.meals/)).toHaveLength(1);
  });

  it('renders status badge', () => {
    renderWithI18n(<DonationCard donation={mockDonation} t={t} />);
    expect(screen.getByText(/donations.available/)).toBeInTheDocument();
  });

  it('renders map link when coordinates provided', () => {
    renderWithI18n(<DonationCard donation={mockDonation} t={t} />);
    expect(screen.getByRole('link', { name: /📍/ })).toBeInTheDocument();
  });

  it('renders reserve button when available and onReserve provided', () => {
    const onReserve = vi.fn();
    renderWithI18n(<DonationCard donation={mockDonation} onReserve={onReserve} t={t} />);
    expect(screen.getByRole('button', { name: /donations.reserve/i })).toBeInTheDocument();
  });

  it('calls onReserve when reserve button clicked', () => {
    const onReserve = vi.fn();
    renderWithI18n(<DonationCard donation={mockDonation} onReserve={onReserve} t={t} />);
    fireEvent.click(screen.getByRole('button', { name: /donations.reserve/i }));
    expect(onReserve).toHaveBeenCalledWith('test-1');
  });

  it('renders donor name when provided', () => {
    renderWithI18n(<DonationCard donation={mockDonation} t={t} />);
    expect(screen.getByText(/Test Donor/)).toBeInTheDocument();
  });

  it('does not render map link when coordinates missing', () => {
    const donationWithoutCoords = { ...mockDonation, latitude: undefined, longitude: undefined };
    renderWithI18n(<DonationCard donation={donationWithoutCoords} t={t} />);
    expect(screen.queryByRole('link', { name: /view map/i })).not.toBeInTheDocument();
  });

  it('does not render reserve button for non-available status', () => {
    const reservedDonation = { ...mockDonation, status: 'reserved' as const };
    renderWithI18n(<DonationCard donation={reservedDonation} t={t} />);
    expect(screen.queryByRole('button', { name: /donations.reserve/i })).not.toBeInTheDocument();
  });
});