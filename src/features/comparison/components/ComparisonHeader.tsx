import { CandidateSite } from '@/domain/sites/candidateSite';
import { Badge } from '@/shared/ui/Badge';

interface ComparisonHeaderProps {
  /** Rendered epoch, e.g. `2026-10-21 12:00:00 UTC`. */
  formattedEpoch: string;
  sitesToAdd: CandidateSite[];
  /** Hidden once the comparison is full. */
  canAddSite: boolean;
  onAddSite: (siteId: string) => void;
}

/**
 * Compare-screen title block: what is being compared, under which instant, and
 * the picker that widens the comparison.
 */
export function ComparisonHeader({
  formattedEpoch,
  sitesToAdd,
  canAddSite,
  onAddSite,
}: ComparisonHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--lm-color-surface)] border border-[var(--lm-color-border-subtle)] rounded-[var(--lm-radius-lg)] p-4 sm:p-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-lg sm:text-xl font-bold text-[var(--lm-color-text-primary)] tracking-tight">
            Compare Candidate Exploration Sites
          </h1>
          <Badge variant="selected">2–4 Sites</Badge>
        </div>
        <p className="text-xs text-[var(--lm-color-text-secondary)]">
          Side-by-side scientific comparison under identical epoch ({formattedEpoch}).
        </p>
      </div>

      {/* Add Site Selector */}
      {canAddSite && sitesToAdd.length > 0 && (
        <div className="flex items-center gap-2">
          <label htmlFor="add-site-select" className="text-xs text-[var(--lm-color-text-muted)] font-mono">
            Add Site:
          </label>
          <select
            id="add-site-select"
            aria-label="Add site to comparison"
            value=""
            onChange={(e) => {
              if (e.target.value) onAddSite(e.target.value);
            }}
            className="text-xs bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-border)] text-[var(--lm-color-text-primary)] rounded-[var(--lm-radius-sm)] px-2.5 py-1.5 focus:outline-none focus:border-[var(--lm-color-focus)] cursor-pointer"
          >
            <option value="" disabled>
              Select location to compare...
            </option>
            {sitesToAdd.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({Math.abs(s.coordinates.latitudeDeg)}°S, {s.coordinates.elevationMeters}m)
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
