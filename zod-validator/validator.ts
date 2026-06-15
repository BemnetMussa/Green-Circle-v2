import { z } from 'zod';
import { STARTUP_STAGES } from '@/lib/startup-stage';
// import { ObjectId } from 'mongodb';

export const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(6, 'password should have at least 6 character'),
});

export const SignUpSchema = z
  .object({
    name: z.string().min(3, 'name field should have at least 3 character'),
    email: z.email(),
    password: z.string().min(6, 'password should have at least 6 character'),
    confirmPassword: z
      .string()
      .min(6, 'password should have at least 6 character'),
    role: z.enum(['user', 'startup', 'investor']),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// // optional helper if you want to validate MongoDB ObjectId
// const objectId = z.string().refine((val) => /^[a-f\d]{24}$/i.test(val), {
//   message: 'Invalid ObjectId format',
// });

export const faydaSchema = z.object({
  faydaId: z.literal(true, {
    message: 'Fayda ID verification is required to proceed.',
  }),
});

export const StartupZodSchema = z.object({
  startupName: z.string().min(1, 'Startup name is required.'),
  website: z
    .string()
    .url('Please enter a valid URL (e.g., https://example.com).')
    .optional()
    .or(z.literal('')),
  sector: z.enum(
    [
      'fintech',
      'agriculture',
      'education',
      'healthcare',
      'energy',
      'logistics',
      'ecommerce',
      'Tech',
      'other',
    ],
    { message: 'Please select a valid sector.' }
  ),
  location: z.enum(
    [
      'addis-ababa',
      'bahir-dar',
      'mekelle',
      'hawassa',
      'dire-dawa',
      'adama',
      'other',
    ],
    { message: 'Please select a valid location.' }
  ),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters.')
    .max(500, 'Description cannot exceed 500 characters.'),
  founderName: z.string().min(1, 'Founder name is required.'),
  founderRole: z.string().min(1, 'Founder role is required.'),
  pitch: z
    .string()
    .min(10, 'Pitch must be at least 10 characters.')
    .max(2000, 'Pitch cannot exceed 2000 characters.'),
  startupLaw: z.literal(true, {
    message: 'You must confirm compliance with Ethiopia’s Startup Law.',
  }),
  terms: z.literal(true, {
    message: 'You must accept the Terms of Service and Privacy Policy.',
  }),
  stage: z.enum(STARTUP_STAGES, {
    message: 'Select where the company is today.',
  }),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type SignUpInput = z.infer<typeof SignUpSchema>;
export type StartUpInput = z.infer<typeof StartupZodSchema>;
