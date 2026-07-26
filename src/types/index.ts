export type UserRole = 'super_admin' | 'admin' | 'examiner' | 'leader';

export interface Profile {
  id: string; // UUID from auth.users
  full_name: string;
  email: string;
  role: UserRole;
  status: boolean;
  created_at: string;
}

export interface AuthState {
  user: any | null; // Supabase user
  profile: Profile | null;
  loading: boolean;
}

export * from './database';
