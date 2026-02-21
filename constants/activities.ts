/**
 * Activity type: open (unlimited), limited (max 4), team (min 5 per team)
 */
export type ActivityType = "open" | "limited" | "team";

/**
 * Activities list with type and player config
 * - open: Running, Cycling, etc. - as many can join, group forms
 * - limited: max 4 (Tennis, Table Tennis, Badminton)
 * - team: min 5 per team (Football, Cricket, Basketball, Volleyball)
 */
export const ACTIVITIES = [
  { id: "football", name: "Football", icon: "soccer", type: "team" as const, minPlayersPerTeam: 5 },
  { id: "cricket", name: "Cricket", icon: "cricket", type: "team" as const, minPlayersPerTeam: 5 },
  { id: "tennis", name: "Tennis", icon: "tennis", type: "limited" as const, maxPlayers: 4 },
  { id: "padel", name: "Padel", icon: "tennis", type: "limited" as const, maxPlayers: 4 },
  { id: "table-tennis", name: "Table Tennis", icon: "table-tennis", type: "limited" as const, maxPlayers: 4 },
  { id: "basketball", name: "Basketball", icon: "basketball", type: "team" as const, minPlayersPerTeam: 5 },
  { id: "badminton", name: "Badminton", icon: "badminton", type: "limited" as const, maxPlayers: 4 },
  { id: "volleyball", name: "Volleyball", icon: "volleyball", type: "team" as const, minPlayersPerTeam: 5 },
  { id: "swimming", name: "Swimming", icon: "swim", type: "open" as const },
  { id: "running", name: "Running", icon: "run", type: "open" as const },
  { id: "cycling", name: "Cycling", icon: "bike", type: "open" as const },
  { id: "gym", name: "Gym/Fitness", icon: "dumbbell", type: "open" as const },
  { id: "yoga", name: "Yoga", icon: "yoga", type: "open" as const },
] as const;

export type ActivityConfig = {
  id: string;
  name: string;
  icon: string;
  type: ActivityType;
  maxPlayers?: number;
  minPlayersPerTeam?: number;
};

/** Helper: get activity config by id */
export function getActivityConfig(activityId: string): ActivityConfig | undefined {
  const a = ACTIVITIES.find((x) => x.id === activityId);
  if (!a) return undefined;
  const cfg: ActivityConfig = { id: a.id, name: a.name, icon: a.icon, type: a.type };
  if ("maxPlayers" in a) cfg.maxPlayers = a.maxPlayers;
  if ("minPlayersPerTeam" in a) cfg.minPlayersPerTeam = a.minPlayersPerTeam;
  return cfg;
}

/**
 * Get the range of required members user can select (kitne members chahiye)
 * - team: 2-11 (e.g. Cricket 4, Football 5)
 * - limited: 1-4 (e.g. Padel 1-3, Tennis 2-4)
 * - open: 1-10
 */
export function getRequiredMembersRange(activityId: string): { min: number; max: number } {
  const cfg = getActivityConfig(activityId);
  if (!cfg) return { min: 1, max: 10 };
  if (cfg.type === "team") return { min: 2, max: 11 };
  if (cfg.type === "limited") return { min: 1, max: (cfg.maxPlayers ?? 4) - 1 }; // exclude creator
  return { min: 1, max: 10 }; // open
}

/**
 * Expertise levels - same as onboarding (Beginner, Intermediate, Pro)
 */
export const EXPERTISE_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "pro", label: "Pro" },
] as const;
