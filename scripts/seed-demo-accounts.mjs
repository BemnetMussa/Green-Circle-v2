/**
 * Seed demo accounts for Green Circle.
 *
 * WHY this shape: passwords must be hashed exactly the way better-auth expects,
 * so we create each account through the real sign-up HTTP endpoint (never by
 * inserting into Mongo directly). We then patch each user's role / verification
 * straight in the database, because the public sign-up form can't grant `admin`
 * or mark a founder as Fayda-verified.
 *
 * PREREQUISITES
 *   1. The app must be running:           yarn dev   (in another terminal)
 *   2. MONGODB_URI must be available — run via:
 *          node --env-file=.env.local scripts/seed-demo-accounts.mjs
 *      (or: yarn seed:demo)
 *
 * Optional env:
 *   SEED_BASE_URL   defaults to http://localhost:3003
 *   SEED_PASSWORD   defaults to Demo@2026  (must be >= 8 chars for better-auth)
 */
import { MongoClient } from 'mongodb';

const BASE_URL = process.env.SEED_BASE_URL || 'http://localhost:3003';
const PASSWORD = process.env.SEED_PASSWORD || 'Demo@2026';
const MONGODB_URI = process.env.MONGODB_URI;

// better-auth's CSRF guard trusts same-origin requests — i.e. an Origin that
// matches the address the dev server actually listens on. We send the same URL we
// connect to (BASE_URL), exactly like the browser does. Override with SEED_ORIGIN
// if your trusted origin differs.
const TRUSTED_ORIGIN = process.env.SEED_ORIGIN || BASE_URL;

if (!MONGODB_URI) {
  console.error('✗ MONGODB_URI is not set. Run with:  node --env-file=.env.local scripts/seed-demo-accounts.mjs');
  process.exit(1);
}

/** The demo roster. `patch` is applied to the Mongo `user` doc after sign-up. */
const ACCOUNTS = [
  {
    name: 'Demo Investor',
    email: 'investor@greencircle.et',
    purpose: 'Investor deal-flow cockpit (/investor/analytics, watchlist)',
    patch: { role: 'investor' },
  },
  {
    name: 'Demo Admin',
    email: 'admin@greencircle.et',
    purpose: 'Admin dashboard (/admin) — approve/reject startups',
    patch: { role: 'admin' },
  },
  {
    name: 'Demo Founder',
    email: 'founder@greencircle.et',
    purpose: 'Founder — Fayda-verified so it can submit a startup (/submit)',
    patch: { role: 'startup', isValidate: true, faydaId: 'demo-fayda-founder-001' },
  },
  {
    name: 'Demo User',
    email: 'user@greencircle.et',
    purpose: 'Plain member account (browse, register flow)',
    patch: { role: 'user' },
  },
];

async function signUp(account) {
  const res = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // better-auth enforces an Origin matching a trusted origin (CSRF guard);
      // node fetch omits it by default, so set it explicitly to the app URL.
      Origin: TRUSTED_ORIGIN,
      Referer: `${TRUSTED_ORIGIN}/register`,
    },
    body: JSON.stringify({
      name: account.name,
      email: account.email,
      password: PASSWORD,
      role: account.patch.role, // additional field; final role enforced by patch below
    }),
  });

  if (res.ok) return 'created';

  const text = await res.text();
  if (/exist|already/i.test(text)) return 'exists';
  throw new Error(`sign-up failed (${res.status}): ${text}`);
}

async function main() {
  console.log(`\nSeeding demo accounts → ${BASE_URL}\n`);

  // 1) Create via the real auth endpoint (correct password hashing).
  for (const account of ACCOUNTS) {
    try {
      const result = await signUp(account);
      console.log(`  ${result === 'created' ? '✓ created' : '• exists  '}  ${account.email}`);
    } catch (err) {
      console.error(`  ✗ ${account.email}: ${err.message}`);
      console.error('    Is the dev server running (yarn dev)?');
      process.exit(1);
    }
  }

  // 2) Patch roles / verification directly in Mongo.
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  try {
    const users = client.db().collection('user');
    for (const account of ACCOUNTS) {
      const r = await users.updateOne(
        { email: account.email },
        { $set: { ...account.patch, updatedAt: new Date() } }
      );
      if (r.matchedCount === 0) {
        console.warn(`  ! could not find ${account.email} to set role — sign-up may have failed`);
      }
    }
  } finally {
    await client.close();
  }

  // 3) Print the credentials.
  console.log('\n────────────────────────────────────────────────────────');
  console.log('  Demo accounts ready. Password for all:  ' + PASSWORD);
  console.log('────────────────────────────────────────────────────────');
  for (const a of ACCOUNTS) {
    console.log(`  ${a.patch.role.padEnd(9)} ${a.email}`);
    console.log(`            ↳ ${a.purpose}`);
  }
  console.log('\n  Sign in at:  ' + BASE_URL + '/login\n');
}

main().catch((err) => {
  console.error('\nSeed failed:', err);
  process.exit(1);
});
