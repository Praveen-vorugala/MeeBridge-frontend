export interface User {
  id: string;
  username: string;
  email: string;
  organization?: string;
  plan: 'free' | 'premium';
  api_key?: string;
  created_at: string;
}

