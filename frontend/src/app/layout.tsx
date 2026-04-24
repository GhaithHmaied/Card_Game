import type { Metadata } from 'next';
import './globals.css';
import { AuthHydrate } from '@/components/auth-hydrate';

export const metadata: Metadata = {
  title: 'Coinché - Online Card Game',
  description: 'Play Coinché (Belote Coinchée) online with friends',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="min-h-screen" suppressHydrationWarning>
        <AuthHydrate>{children}</AuthHydrate>
      </body>
    </html>
  );
}
