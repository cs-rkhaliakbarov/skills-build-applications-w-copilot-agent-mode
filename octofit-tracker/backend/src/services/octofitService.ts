import { Activity, Team, User, Workout } from '../models/index.js';
import { Types } from 'mongoose';

type HttpError = Error & { status: number };

function httpError(status: number, message: string): HttpError {
  return Object.assign(new Error(message), { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)
    || typeof input.userId !== 'string'
    || !Types.ObjectId.isValid(input.userId)
    || typeof input.teamId !== 'string'
    || !Types.ObjectId.isValid(input.teamId)
    || typeof input.type !== 'string'
    || !input.type.trim()
    || typeof input.minutes !== 'number'
    || !Number.isFinite(input.minutes)
    || input.minutes <= 0) {
    throw httpError(400, 'A valid user, team, activity type, and positive minutes are required');
  }

  const [user, team] = await Promise.all([
    User.findById(input.userId),
    Team.findById(input.teamId),
  ]);
  if (!user || !team) throw httpError(404, 'The selected user or team does not exist');

  return Activity.create({
    user: user._id,
    team: team._id,
    type: input.type.trim(),
    minutes: input.minutes,
    points: input.minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)
    || typeof input.name !== 'string'
    || !input.name.trim()
    || typeof input.mascot !== 'string'
    || !input.mascot.trim()) {
    throw httpError(400, 'A team name and mascot are required');
  }

  const memberIds = input.members ?? [];
  if (!Array.isArray(memberIds) || memberIds.some((id) => typeof id !== 'string' || !Types.ObjectId.isValid(id))) {
    throw httpError(400, 'Team members must be valid user IDs');
  }
  if (memberIds.length > 0) {
    const existingMembers = await User.countDocuments({ _id: { $in: memberIds } });
    if (existingMembers !== memberIds.length) throw httpError(404, 'One or more team members do not exist');
  }

  return Team.create({
    name: input.name.trim(),
    mascot: input.mascot.trim(),
    members: memberIds,
  });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().lean(),
    Activity.aggregate<{ _id: Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  return teams
    .map((team) => ({ teamName: team.name, totalPoints: pointsByTeam.get(team._id.toString()) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail });
  if (!user) throw httpError(404, 'No user was found for this email address');

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const activityType = recentActivity?.type.toLowerCase();
  const activityFocus = activityType && ['run', 'cycle', 'walk', 'cardio'].includes(activityType)
    ? 'endurance'
    : activityType;
  const preferredFocuses = [user.fitnessGoal, activityFocus].filter((focus): focus is string => Boolean(focus));
  const preferred = new Set(preferredFocuses.map((focus) => focus.toLowerCase()));
  const workouts = await Workout.find().lean();

  return workouts
    .filter((workout) => preferred.has(workout.focus.toLowerCase()))
    .sort((left, right) => preferredFocuses.indexOf(left.focus) - preferredFocuses.indexOf(right.focus))
    .map((workout) => {
      const isGoalMatch = workout.focus.toLowerCase() === user.fitnessGoal.toLowerCase();
      const reason = isGoalMatch
        ? `Supports your ${user.fitnessGoal} fitness goal.`
        : `Recommended based on your recent ${recentActivity?.type} activity.`;
      return { ...workout, reason };
    });
}

export { User };
