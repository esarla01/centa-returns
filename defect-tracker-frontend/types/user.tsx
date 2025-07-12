export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  initials: string;
  email: string;
  role: 'Admin' | 'User' | 'Manager';
  status: 'Active' | 'Inactive';
  dateAdded: string;
  lastLogin: string;
}; 