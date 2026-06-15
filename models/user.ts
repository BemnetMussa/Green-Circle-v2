import { Schema, model, models } from 'mongoose';

export interface IUser {
  name: string;
  email: string;
  role?: 'startup' | 'user' | 'admin' | 'investor';
  isValidate?: boolean;
  faydaId?: string;
  createdAt: Date;
  updatedAt: Date;
  nationality?: string;
  birthdate?: string;
  address?: string;
  gender?: string;
  phone_number?: string;
  image?: string;
  bio?: string;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: {
      type: String,
      enum: ['startup', 'user', 'admin', 'investor'],
      required: true,
      default: 'user',
    },
    isValidate: { type: Boolean, default: false },
    faydaId: {
      type: String,
      // unique: true,
      sparse: true,
    },
    nationality: {
      type: String,
      default: 'Ethiopian',
    },
    birthdate: {
      type: String,
      default: 'N/A',
    },
    address: {
      type: String,
      default: 'N/A',
    },
    gender: {
      type: String,
      default: 'N/A',
    },
    phone_number: {
      type: String,
      default: 'N/A',
    },
    image: {
      type: String,
      default: 'N/A',
    },
    bio: {
      type: String,
      default: 'No bio provided',
    },
  },
  { timestamps: true }
);

export const User = models.User || model<IUser>('User', userSchema, 'user');
