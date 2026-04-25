/**
 * Simple trial management logic using localStorage.
 * For production, this should ideally be handled server-side with database records.
 */

const TRIAL_DURATION_DAYS = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface TrialState {
  isAvailable: boolean;
  isExpired: boolean;
  daysRemaining: number;
  hasPaid: boolean;
}

export function getTrialState(createdAt?: any): TrialState {
  const hasPaid = localStorage.getItem('socratic_tutor_paid') === 'true';
  const firstVisit = localStorage.getItem('socratic_tutor_first_visit');
  
  // If we have a createdAt from firestore, use that as the source of truth
  const effectiveStartTime = createdAt 
    ? (createdAt.toDate ? createdAt.toDate().getTime() : new Date(createdAt).getTime()) 
    : (firstVisit ? parseInt(firstVisit) : Date.now());

  if (!firstVisit && !createdAt) {
    localStorage.setItem('socratic_tutor_first_visit', Date.now().toString());
  }

  if (hasPaid) {
    return { isAvailable: true, isExpired: false, daysRemaining: 0, hasPaid: true };
  }

  const currentTime = Date.now();
  const elapsedMs = currentTime - effectiveStartTime;
  const elapsedDays = elapsedMs / MS_PER_DAY;
  
  const daysRemaining = Math.max(0, Math.ceil(TRIAL_DURATION_DAYS - elapsedDays));
  const isExpired = elapsedDays >= TRIAL_DURATION_DAYS;

  return {
    isAvailable: true,
    isExpired,
    daysRemaining,
    hasPaid: false
  };
}

export function setPaidStatus(status: boolean) {
  localStorage.setItem('socratic_tutor_paid', status ? 'true' : 'false');
}
