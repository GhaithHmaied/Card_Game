'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';

export default function HistoryPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.replace('/');
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (cancelled) return;
      if (!res.ok) {
        setError('Could not load history.');
        return;
      }
      const data = await res.json();
      setRows(Array.isArray(data) ? data : data?.items ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [token, router]);

  if (!token) return null;

  return (
    <main className="min-h-screen p-6 max-w-2xl mx-auto">
      <Link href="/" className="text-gold text-sm hover:underline">
        ← Home
      </Link>
      <h1 className="text-3xl font-bold text-gold mt-4 mb-6">Game history</h1>
      {error && <p className="text-red-300">{error}</p>}
      {!error && rows.length === 0 && (
        <p className="text-white/60">No finished games recorded yet.</p>
      )}
      <ul className="space-y-3">
        {rows.map((row, i) => (
          <li
            key={row.id ?? i}
            className="bg-black/30 border border-white/10 rounded-xl p-4 text-sm"
          >
            <pre className="text-white/80 whitespace-pre-wrap overflow-x-auto">
              {JSON.stringify(row, null, 2)}
            </pre>
          </li>
        ))}
      </ul>
    </main>
  );
}
