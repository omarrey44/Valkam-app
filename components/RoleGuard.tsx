import { ReactNode } from 'react';
import { useAuth } from '../lib/auth';
import { Rol } from '../lib/types';

interface Props {
  roles: Rol[];
  children: ReactNode;
  fallback?: ReactNode;
}

export default function RoleGuard({ roles, children, fallback = null }: Props) {
  const { profile } = useAuth();
  if (!profile || !roles.includes(profile.rol)) return <>{fallback}</>;
  return <>{children}</>;
}
