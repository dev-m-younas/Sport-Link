/**
 * Activities list - same as onboarding (Football, Cricket, etc.)
 */
export const ACTIVITIES = [
  { id: 'football', name: 'Football', icon: 'soccer' },
  { id: 'cricket', name: 'Cricket', icon: 'cricket' },
  { id: 'tennis', name: 'Tennis', icon: 'tennis' },
  { id: 'table-tennis', name: 'Table Tennis', icon: 'table-tennis' },
  { id: 'basketball', name: 'Basketball', icon: 'basketball' },
  { id: 'badminton', name: 'Badminton', icon: 'badminton' },
  { id: 'volleyball', name: 'Volleyball', icon: 'volleyball' },
  { id: 'swimming', name: 'Swimming', icon: 'swim' },
  { id: 'running', name: 'Running', icon: 'run' },
  { id: 'cycling', name: 'Cycling', icon: 'bike' },
  { id: 'gym', name: 'Gym/Fitness', icon: 'dumbbell' },
  { id: 'yoga', name: 'Yoga', icon: 'yoga' },
] as const;

/**
 * Expertise levels - same as onboarding (Beginner, Intermediate, Pro)
 */
export const EXPERTISE_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'pro', label: 'Pro' },
] as const;
