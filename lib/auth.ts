import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { MongoClient } from 'mongodb';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Use a global variable to preserve the MongoClient instance across hot-reloads in dev
declare global {
  var _mongoClient: MongoClient | undefined;
}

let client: MongoClient;

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClient) {
    global._mongoClient = new MongoClient(mongoUri);
  }
  client = global._mongoClient;
} else {
  client = new MongoClient(mongoUri);
}

const db = client.db();

export const auth = betterAuth({
  database: mongodbAdapter(db),
  // Trust whatever local port `next dev` lands on (it auto-increments when 3000
  // is busy), plus the configured production URL. Without this, logging in from
  // e.g. http://localhost:3003 while BETTER_AUTH_URL points at :3000 is rejected
  // as "Invalid origin".
  trustedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004',
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
  ],
  emailAndPassword: { enabled: true },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: 'user',
        input: true,
      },
      isValidate: {
        type: 'boolean',
        required: false,
        defaultValue: false,
        input: false,
      },
      faydaId: {
        type: 'string',
        required: false,
        defaultValue: null,
        input: false,
      },
      nationality: {
        type: 'string',
        required: false,
        defaultValue: 'Ethiopian',
        input: false,
      },
      birthdate: {
        type: 'string',
        required: false,
        defaultValue: 'N/A',
        input: false,
      },
      address: {
        type: 'string',
        required: false,
        defaultValue: 'N/A',
        input: false,
      },
      gender: {
        type: 'string',
        required: false,
        defaultValue: 'N/A',
        input: false,
      },
      phone_number: {
        type: 'string',
        required: false,
        defaultValue: 'N/A',
        input: false,
      },
      image: {
        type: 'string',
        required: false,
        defaultValue: 'N/A',
        input: false,
      },
      bio: {
        type: 'string',
        required: false,
        defaultValue: 'No bio provided',
        input: false,
      },
    },
  },
  plugins: [nextCookies()],
});
