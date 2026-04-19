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

export function getTrialState(): TrialState {
  const hasPaid = localStorage.getItem('socratic_tutor_paid') === 'true';
  const firstVisit = localStorage.getItem('socratic_tutor_first_visit');
  
  if (hasPaid) {
    return { isAvailable: true, isExpired: false, daysRemaining: 0, hasPaid: true };
  }

  if (!firstVisit) {
    const now = Date.now().toString();
    localStorage.setItem('socratic_tutor_first_visit', now);
    return { isAvailable: true, isExpired: false, daysRemaining: TRIAL_DURATION_DAYS, hasPaid: false };
  }

  const visitTime = parseInt(firstVisit);
  const currentTime = Date.now();
  const elapsedMs = currentTime - visitTime;
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
