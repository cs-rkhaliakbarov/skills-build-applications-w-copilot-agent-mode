import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = { name: string; mascot?: string; members: unknown[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ teams: Team[] }>('/api/teams')
      .then(({ teams: result }) => { if (active) setTeams(result); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause : new Error('Request failed')); });
    return () => { active = false; };
  }, []);

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">Teams</h2>
    {error ? <p role="alert">Unable to load teams: {error.message}</p>
      : teams === null ? <p role="status">Loading teams...</p>
        : teams.length === 0 ? <p>No teams yet.</p>
          : <ul>{teams.map((team) => <li key={team.name}>{team.name}{team.mascot ? `, ${team.mascot}` : ''} ({team.members.length} members)</li>)}</ul>}
  </div></section>;
}
