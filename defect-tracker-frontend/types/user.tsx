export interface User {
    email: string,
    first_name: string,
    last_name: string,
    role: string;  // or a union like: 'user' | 'manager' | 'admin' if you know all roles
  };
  