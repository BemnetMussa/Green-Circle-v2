import { RawStartup, Startup, StartupResponse, StartupListResponse } from '@/types';
import { notFound } from 'next/navigation';
import { authClient } from '../auth-client';


const transform = (s: RawStartup): Startup => ({
  _id: s._id,
  name: s.name,
  logo: '',
  sector: s.sector,
  location: s.location,
  description: s.description,
  foundedYear: Number(s.foundedYear),
  employees: s.employees,
  website: s.website || '',
  status: s.status,
  founders: s.founders,
  founderRole: s.founderRole,
  founderBio: s.founderBio,
  pitch: s.pitch,
  achievements: Array.isArray(s.achievements)
    ? s.achievements
    : s.achievements
    ? s.achievements.split(',').map((a) => a.trim())
    : [],
  contact: {
    email: s.founderEmail,
    phone: s.founderPhone,
  },
  createdAt: s.createdAt,
  updatedAt: s.updatedAt,
});



// ✅ GET SINGLE STARTUP
export const getStartupById = async (id: string): Promise<Startup | undefined> => {
  try {
    const res = await fetch(`/api/startups/${encodeURIComponent(id)}`);

    if (!res.ok) throw new Error('Failed to fetch startup');

    const data: StartupResponse = await res.json();

    return transform(data.startup);

  } catch (err) {
    console.error('Error in getStartupById:', err);
    throw err;
  }
};


// ✅ GET STARTUPS FOR LOGGED-IN USER
export const userStartups = async (): Promise<Startup[]> => {
  try {
    const session = await authClient.getSession();
    const userEmail = session?.data?.user?.email;

    if (!userEmail) throw new Error('No user session');

    const res = await fetch(`/api/startups/by-email/${encodeURIComponent(userEmail)}`);
    if (!res.ok) throw new Error('Failed to fetch startups');

    const data: StartupListResponse = await res.json();
    return data.startups.map(transform);

  } catch (err) {
    console.error('Error in userStartups:', err);
    throw err;
  }
};


// ✅ GET ALL STARTUPS
export const filterStartup = async (): Promise<Startup[]> => {
  try {
    const res = await fetch(`/api/startups`);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.details || errorData.error || 'Failed to fetch startups');
    }

    const data: StartupListResponse = await res.json();

    if (!data.startups || data.startups.length === 0) return [];

    return data.startups.map(transform);

  } catch (error) {
    console.error('Error filtering startups:', error);
    throw error;
  }
};


// ✅ UPDATE USER INFO
export const updatedUser = async ({
  email,
  phone,
  bio,
}: {
  email: string;
  phone: string;
  bio: string;
}) => {
  try {
    const res = await fetch('/api/updateUser', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, phone, bio }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Failed to update');
    return data;

  } catch (error) {
    console.error('Update user failed:', error);
    throw error;
  }
};
