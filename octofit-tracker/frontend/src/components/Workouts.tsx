import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Workout = { title: string; focus: string; minutes: number; difficulty: string; reason?: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Workout[] | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ suggestions: Workout[] }>(`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`)
      .then(({ suggestions: result }) => { if (active) setSuggestions(result); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause : new Error('Request failed')); });
    return () => { active = false; };
  }, []);

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">Workout suggestions</h2>
    {error ? <p role="alert">Unable to load workout suggestions: {error.message}</p>
      : suggestions === null ? <p role="status">Loading workout suggestions...</p>
        : suggestions.length === 0 ? <p>No workout suggestions yet.</p>
          : <ul>{suggestions.map((workout) => <li key={workout.title}>{workout.title}: {workout.focus}, {workout.minutes} minutes, {workout.difficulty}{workout.reason ? `. ${workout.reason}` : ''}</li>)}</ul>}
  </div></section>;
}
