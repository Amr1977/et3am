import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'donor' | 'recipient' | 'admin';
  phone: string | null;
  address: string | null;
  preferred_language: 'en' | 'ar';
  created_at: string;
  updated_at: string;
}

interface Donation {
  id: string;
  donor_id: string;
  title: string;
  description: string | null;
  food_type: string;
  quantity: number;
  unit: string;
  expiry_date: string | null;
  pickup_address: string;
  latitude: number | null;
  longitude: number | null;
  pickup_date: string | null;
  status: 'available' | 'reserved' | 'completed' | 'expired';
  reserved_by: string | null;
  created_at: string;
  updated_at: string;
}

interface DbSchema {
  users: User[];
  donations: Donation[];
}

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

let data: DbSchema;

function ensureDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function load(): DbSchema {
  if (!data) {
    ensureDir();
    if (fs.existsSync(DB_FILE)) {
      data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } else {
      data = { users: [], donations: [] };
      save();
    }
  }
  return data;
}

function save(): void {
  ensureDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function initDb(): void {
  const db = load();
  const existingAdmin = db.users.find(u => u.email === 'admin@et3am.com');
  if (!existingAdmin) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.users.push({
      id: uuidv4(),
      name: 'Admin',
      email: 'admin@et3am.com',
      password: hashedPassword,
      role: 'admin',
      phone: null,
      address: null,
      preferred_language: 'en',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    save();
  }
}

export const dbOps = {
  users: {
    findByEmail(email: string): User | undefined {
      return load().users.find(u => u.email === email);
    },
    findById(id: string): User | undefined {
      return load().users.find(u => u.id === id);
    },
    create(user: User): User {
      load().users.push(user);
      save();
      return user;
    },
    update(id: string, updates: Partial<User>): User | undefined {
      const db = load();
      const idx = db.users.findIndex(u => u.id === id);
      if (idx === -1) return undefined;
      db.users[idx] = { ...db.users[idx], ...updates, updated_at: new Date().toISOString() };
      save();
      return db.users[idx];
    },
  },
  donations: {
    findAll(filters?: { status?: string; food_type?: string }, page = 1, limit = 10): { donations: Donation[]; total: number } {
      let items = [...load().donations];
      if (filters?.status) items = items.filter(d => d.status === filters.status);
      if (filters?.food_type) items = items.filter(d => d.food_type === filters.food_type);
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const total = items.length;
      const offset = (page - 1) * limit;
      return { donations: items.slice(offset, offset + limit), total };
    },
    findById(id: string): Donation | undefined {
      return load().donations.find(d => d.id === id);
    },
    create(donation: Donation): Donation {
      load().donations.push(donation);
      save();
      return donation;
    },
    update(id: string, updates: Partial<Donation>): Donation | undefined {
      const db = load();
      const idx = db.donations.findIndex(d => d.id === id);
      if (idx === -1) return undefined;
      db.donations[idx] = { ...db.donations[idx], ...updates, updated_at: new Date().toISOString() };
      save();
      return db.donations[idx];
    },
    delete(id: string): boolean {
      const db = load();
      const idx = db.donations.findIndex(d => d.id === id);
      if (idx === -1) return false;
      db.donations.splice(idx, 1);
      save();
      return true;
    },
    countByStatus(status: string): number {
      return load().donations.filter(d => d.status === status).length;
    },
    countByDonor(donorId: string): number {
      return load().donations.filter(d => d.donor_id === donorId).length;
    },
    countByReserved(userId: string): number {
      return load().donations.filter(d => d.reserved_by === userId).length;
    },
    totalCount(): number {
      return load().donations.length;
    },
  },
  userCount(): number {
    return load().users.length;
  },
};
