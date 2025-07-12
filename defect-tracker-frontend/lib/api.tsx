// lib/api.ts
import { User, UserStats } from './types';

// Helper to format dates for display
const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Updated mock user data based on your model
const allUsers: User[] = [
  { email: 'phoenix.baker@example.com', firstName: 'Phoenix', lastName: 'Baker', initials: 'PB', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d', role: 'Admin', status: 'Active', lastLogin: '2 hours ago', createdAt: formatDate(new Date('2023-01-15')) },
  { email: 'lana.steiner@example.com', firstName: 'Lana', lastName: 'Steiner', initials: 'LS', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026705d', role: 'Manager', status: 'Active', lastLogin: '1 day ago', createdAt: formatDate(new Date('2023-02-20')) },
  { email: 'demi.wilkinson@example.com', firstName: 'Demi', lastName: 'Wilkinson', initials: 'DW', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026706d', role: 'User', status: 'Active', lastLogin: '5 hours ago', createdAt: formatDate(new Date('2023-03-10')) },
  { email: 'candice.wu@example.com', firstName: 'Candice', lastName: 'Wu', initials: 'CW', avatarUrl: undefined, role: 'User', status: 'Active', lastLogin: '3 days ago', createdAt: formatDate(new Date('2023-04-05')) },
  { email: 'natali.craig@example.com', firstName: 'Natali', lastName: 'Craig', initials: 'NC', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026707d', role: 'User', status: 'Inactive', lastLogin: '1 month ago', createdAt: formatDate(new Date('2023-05-12')) },
  { email: 'drew.cano@example.com', firstName: 'Drew', lastName: 'Cano', initials: 'DC', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026708d', role: 'Admin', status: 'Active', lastLogin: 'Just now', createdAt: formatDate(new Date('2023-06-18')) },
  { email: 'orlando.diggs@example.com', firstName: 'Orlando', lastName: 'Diggs', initials: 'OD', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026709d', role: 'User', status: 'Active', lastLogin: '1 week ago', createdAt: formatDate(new Date('2023-07-01')) },
  { email: 'kate.morrison@example.com', firstName: 'Kate', lastName: 'Morrison', initials: 'KM', avatarUrl: undefined, role: 'Manager', status: 'Inactive', lastLogin: '2 months ago', createdAt: formatDate(new Date('2023-07-15')) },
  { email: 'new.user@example.com', firstName: 'New', lastName: 'User', initials: 'NU', avatarUrl: undefined, role: 'User', status: 'Active', lastLogin: null, createdAt: formatDate(new Date('2023-08-01')) },
];

// No changes needed for fetch functions, they work with the new data structure.
export const fetchUsers = async (page: number = 1, limit: number = 5): Promise<{ users: User[], totalPages: number }> => {
  console.log(`Fetching users for page ${page}...`);
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const start = (page - 1) * limit;
  const end = page * limit;
  const paginatedUsers = allUsers.slice(start, end);
  
  return {
    users: paginatedUsers,
    totalPages: Math.ceil(allUsers.length / limit),
  };
};

export const fetchUserStats = async (): Promise<UserStats> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return {
    active: allUsers.filter(u => u.status === 'Active').length,
    inactive: allUsers.filter(u => u.status === 'Inactive').length,
    pending: 10, // Assuming 'pending' is a separate metric like invitations
  };
};