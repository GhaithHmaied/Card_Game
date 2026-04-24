import Link from 'next/link';

export default function LeaderboardPage() {
  return (
    <main className="min-h-screen p-6 max-w-lg mx-auto text-center">
      <div className="text-left mb-8">
        <Link href="/" className="text-gold text-sm hover:underline">
          ← Home
        </Link>
      </div>
      <h1 className="text-3xl font-bold text-gold mb-4">Leaderboard</h1>
      <p className="text-white/60">
        Rankings will appear here once the backend exposes a leaderboard endpoint.
      </p>
    </main>
  );
}
