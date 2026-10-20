import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = { type: string; minutes: number; points: number };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ activities: Activity[] }>('/api/activities')
      .then(({ activities: result }) => { if (active) setActivities(result); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause : new Error('Request failed')); });
    return () => { active = false; };
  }, []);

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">Activities</h2>
    {error ? <p role="alert">Unable to load activities: {error.message}</p>
      : activities === null ? <p role="status">Loading activities...</p>
        : activities.length === 0 ? <p>No activities yet.</p>
          : <ul>{activities.map((activity, index) => <li key={`${activity.type}-${index}`}>{activity.type}: {activity.minutes} minutes, {activity.points} points</li>)}</ul>}
  </div></section>;
}
