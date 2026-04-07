import { vi } from 'vitest';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_testing_only_32_chars';
process.env.NODE_ENV = 'test';

vi.mock('../database', () => ({
  dbOps: {
    donations: {
      findAll: vi.fn().mockResolvedValue({ donations: [], total: 0 }),
      findById: vi.fn().mockResolvedValue(null),
      findByDonor: vi.fn().mockResolvedValue([]),
      findByReserved: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue(true),
    },
    users: {
      findById: vi.fn().mockResolvedValue(null),
      findAdmins: vi.fn().mockResolvedValue([]),
    },
    dailyReservations: {
      checkTodayAction: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockResolvedValue(undefined),
      getTodayActions: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(undefined),
    },
  },
}));