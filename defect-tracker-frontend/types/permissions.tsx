export interface Permissions {
    can_create: boolean,
    can_edit: boolean,
    create_permissions: string[],
    edit_permissions: string[];
};
  // lib/types.ts

// The user roles now match your Enum exactly (in a capitalized format for display)
export type UserRole = 'Admin' | 'Manager' | 'User';

// The User interface now reflects your database schema
export interface User {
  email: string; // Using email as the primary identifier
  firstName: string;
  lastName:string;
  role: UserRole;
  status: 'Active' | 'Inactive'; // This is a useful UI-derived property
  lastLogin: string | null; // Can be null if the user has never logged in
  createdAt: string;
  avatarUrl?: string; // Kept as an optional property for UI
  initials: string; // Derived from first and last name
}

// UserStats remains the same as it's a high-level aggregation
export interface UserStats {
  active: number;
  inactive: number;
  pending: number;
}