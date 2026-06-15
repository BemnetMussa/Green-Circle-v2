  // FOUNDER — matches API response exactly
  export interface Founder {
    _id: string;
    name: string;
    email: string;
    role: string;
    linkedin?: string;
    x?: string;
    nationality?: string;
    phone_number?: string;
    bio?: string;
    image?: string;
    isValidate?: boolean;
    faydaId?: string;
  }
  
// LOGGED-IN USER
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'startup' | 'admin';
}

// STARTUP — unified type after API
export interface Startup {
  _id: string;
  name: string;
  logo?: string;
  banner?: string;
  website?: string;
  sector?: string;
  location: string;
  foundedYear?: string | number;
  employees?: string;
  description: string;
  pitch?: string;

  achievements?: string | string[];
  documents?: string[];
  images?: string[];

  founderRole?: string;
  founderEmail?: string;
  founderPhone?: string;
  founderBio?: string;

  founders: Founder[]; // populated

  contact?: {
    email?: string;
    phone?: string;
  };

  revenue?: string;
  /** Company stage (idea, pre-seed, seed, …). Distinct from editorial `status`. */
  stage?: string;
  status: string;

  // Deprecated: metInPerson field removed - now showing simple "Listed" date
  metInPerson?: {
    city?: string;
    date: string; // ISO8601 date
  };

  createdAt: string;
  updatedAt: string;
}

// RAW STARTUP — before mapping, straight from DB/API
export interface RawStartup {
  _id: string;
  name: string;
  logo?: string;
  banner?: string;
  website?: string;
  sector: string;
  location: string;
  description: string;
  foundedYear: string;
  employees: string;
  pitch: string;
  achievements?: string | string[];
  documents?: string[];
  images?: string[];
  founders: Founder[];
  founderEmail?: string;
  founderPhone?: string;
  founderRole?: string;
  founderBio?: string;
  stage?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface BetterAuthSession {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null;
  role: string;
  isValidate?: boolean | null;
  faydaId?: string;
}

export interface StartupResponse {
  message: string;
  startup: RawStartup;
}

export interface StartupListResponse {
  message: string;
  startups: RawStartup[];
}
