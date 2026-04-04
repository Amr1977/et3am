import { z } from 'zod';

export const emailSchema = z.string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .max(255, 'Email too long');

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(255, 'Password too long');

export const nameSchema = z.string()
  .min(1, 'Name is required')
  .max(255, 'Name too long')
  .regex(/^[^<>{}]+$/, 'Name contains invalid characters');

export const roleSchema = z.enum(['donor', 'recipient', 'admin']);

export const languageSchema = z.enum(['en', 'ar']);

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  preferred_language: languageSchema.optional(),
  role: roleSchema.optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  preferred_language: languageSchema.optional(),
});

export const updateLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  city: z.string().max(255).optional(),
  area: z.string().max(255).optional(),
});

export const donationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(5000).optional(),
  food_type: z.string().max(100),
  quantity: z.number().int().positive(),
  unit: z.string().max(50),
  expiry_date: z.string().datetime(),
  pickup_address: z.string().min(1, 'Pickup address is required').max(500),
  pickup_date: z.string().datetime(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const reviewSchema = z.object({
  reviewed_id: z.string().uuid('Invalid user ID'),
  donation_id: z.string().uuid('Invalid donation ID'),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
  review_type: z.enum(['donor_to_recipient', 'recipient_to_donor']),
});

export const supportTicketSchema = z.object({
  type: z.enum(['support', 'bug', 'feature', 'other']),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().min(1, 'Description is required').max(5000),
});

export const validateEmail = (email: unknown): boolean => {
  try {
    emailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
};

export const validatePassword = (password: unknown): boolean => {
  try {
    passwordSchema.parse(password);
    return true;
  } catch {
    return false;
  }
};

export const validateRole = (role: unknown): boolean => {
  return ['donor', 'recipient', 'admin'].includes(role as string);
};
