// app/components/PermissionGate.tsx
import { ReactNode } from "react";
import { useAuth } from "../contexts/AuthContext";

interface PermissionGateProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode; // Optional fallback content to show when permission is denied
}

export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const { user, loading } = useAuth();

  // Don't render anything while loading
  if (loading) {
    return null;
  }

  // Check if user has the required permission
  const hasPermission = user && user.permissions.includes(permission);

  // Render children if user has permission, otherwise render fallback (or nothing)
  return hasPermission ? <>{children}</> : <>{fallback}</>;
} 