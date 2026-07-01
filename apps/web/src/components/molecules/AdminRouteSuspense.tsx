import { Suspense, type ReactNode } from 'react';
import AdminRouteSkeleton from '@/components/molecules/AdminRouteSkeleton';

export function AdminRouteSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<AdminRouteSkeleton />}>{children}</Suspense>;
}
