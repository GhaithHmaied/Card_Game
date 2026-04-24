'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

export default function JoinByCodePage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();
  const token = useAuthStore((s) => s.token);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.replace(`/?join=${encodeURIComponent(code)}`);
      return;
    }
    let cancelled = false;
    (async () => {
      setError(null);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/rooms/join/${code}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      if (cancelled) return;
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message || 'Could not join this room.');
        return;
      }
      const room = await res.json();
      router.replace(`/game/${room.id}`);
    })();
    return () => {
      cancelled = true;
    };
  }, [code, token, router]);

  if (!token) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <p className="text-white/70">Redirecting to sign in…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 gap-4">
        <p className="text-red-300">{error}</p>
        <Link href="/" className="text-gold underline">
          Back home
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <p className="text-white/70">Joining room {code}…</p>
    </main>
  );
}
