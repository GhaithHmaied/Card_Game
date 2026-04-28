import type { ReactNode } from 'react';
import { OfflineGameSocketProvider } from '@/hooks/use-socket';

export default function OfflineLayout({ children }: { children: ReactNode }) {
  return <OfflineGameSocketProvider>{children}</OfflineGameSocketProvider>;
}
