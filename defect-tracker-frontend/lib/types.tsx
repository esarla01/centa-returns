
export type UserRole = 'Admin' | 'Manager' | 'User';

export interface User {
  email: string; 
  firstName: string;
  lastName:string;
  role: UserRole;
  status: 'Active' | 'Inactive'; 
  lastLogin: string | null; 
  createdAt: string;
  avatarUrl?: string; 
  initials: string; 
};

export interface UserStats {
  active: number;
  inactive: number;
  pending: number;
};

