import { GameSocketProvider } from '@/hooks/use-socket';

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return <GameSocketProvider>{children}</GameSocketProvider>;
}
