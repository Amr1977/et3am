import { vi } from 'vitest';

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
    },
  },
}));