/** Primary navigation destinations of the observatory shell. */

export type NavTab = 'explore' | 'compare' | 'method';

/** Accessible name for each destination; doubles as the hover title. */
export const NAV_TAB_TITLES: Record<NavTab, string> = {
  explore: 'Explore Observatory',
  compare: 'Compare Candidates',
  method: 'Method & Data Reference',
};
