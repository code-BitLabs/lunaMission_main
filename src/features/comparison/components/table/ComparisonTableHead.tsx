import { X, ArrowRight } from 'lucide-react';
import { CandidateSite } from '@/domain/sites/candidateSite';
import { MIN_COMPARISON_SITES } from '@/features/comparison/model/comparisonColumns';

interface ComparisonTableHeadProps {
  sites: CandidateSite[];
  onRemoveSite: (siteId: string) => void;
  onInspectSite: (site: CandidateSite) => void;
}

/** Column headers: one identity card per compared site, plus its exit and inspection routes. */
export function ComparisonTableHead({ sites, onRemoveSite, onInspectSite }: ComparisonTableHeadProps) {
  const canRemoveSite = sites.length > MIN_COMPARISON_SITES;

  return (
    <thead>
      {/* Site Headers Row */}
      <tr className="bg-[var(--lm-color-surface-raised)] border-b border-[var(--lm-color-border)]">
        <th className="p-3.5 w-44 text-[var(--lm-color-text-muted)] font-mono uppercase tracking-wider text-[11px] align-bottom">
          Candidate Location
        </th>
        {sites.map((site) => (
          <th key={site.id} className="p-3.5 align-top min-w-[210px] border-l border-[var(--lm-color-border-subtle)]">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--lm-color-selected-site)] font-semibold bg-[var(--lm-color-surface-strong)] px-1.5 py-0.2 rounded border border-[var(--lm-color-selected-site)]/30">
                  {site.code}
                </span>
                {canRemoveSite && (
                  <button
                    type="button"
                    onClick={() => onRemoveSite(site.id)}
                    title={`Remove ${site.name} from comparison`}
                    aria-label={`Remove ${site.name}`}
                    className="p-1 text-[var(--lm-color-text-muted)] hover:text-white rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="font-bold text-sm text-[var(--lm-color-text-primary)] font-sans line-clamp-1">
                {site.name}
              </div>
              <div className="text-[10px] text-[var(--lm-color-text-muted)]">
                {site.priority}
              </div>
              <button
                type="button"
                onClick={() => onInspectSite(site)}
                className="mt-1 flex items-center justify-center gap-1.5 text-[11px] font-sans font-medium text-[var(--lm-color-selected-site)] bg-[var(--lm-color-surface-strong)] hover:bg-[var(--lm-color-border)] py-1 px-2 rounded-[var(--lm-radius-xs)] border border-[var(--lm-color-selected-site)]/40 transition-colors"
              >
                <span>Inspect in Explorer</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
}
