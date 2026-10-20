import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Entry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<Entry[] | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ leaderboard: Entry[] }>('/api/leaderboard')
      .then(({ leaderboard: result }) => { if (active) setLeaderboard(result); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause : new Error('Request failed')); });
    return () => { active = false; };
  }, []);

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">Leaderboard</h2>
    {error ? <p role="alert">Unable to load leaderboard: {error.message}</p>
      : leaderboard === null ? <p role="status">Loading leaderboard...</p>
        : leaderboard.length === 0 ? <p>No leaderboard scores yet.</p>
          : <ol>{leaderboard.map((entry) => <li key={entry.teamName}>{entry.teamName}: {entry.totalPoints} points (rank {entry.rank})</li>)}</ol>}
  </div></section>;
}
