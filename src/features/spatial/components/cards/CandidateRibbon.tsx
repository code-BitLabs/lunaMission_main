import { CANDIDATE_SITES } from '@/domain/sites/catalog';
import { useScenarioCommands, useScenarioModel } from '@/app/scenario/context/scenarioContext';

/** Site picker shared by the standard and fullscreen workspace footers. */
export function CandidateRibbon() {
  const { site: selectedSite } = useScenarioModel();
  const { selectSite } = useScenarioCommands();

  return (
    <footer className="pt-2.5 border-t border-[var(--lm-color-border-subtle)] flex items-center gap-2 overflow-x-auto shrink-0 select-none">
      <span className="text-[11px] font-mono text-[var(--lm-color-text-muted)] shrink-0 uppercase tracking-wider">
        Candidate Sites:
      </span>
      <div className="flex items-center gap-1.5 shrink-0">
        {CANDIDATE_SITES.map((site) => {
          const isSelected = site.id === selectedSite.id;
          return (
            <button
              key={site.id}
              type="button"
              onClick={() => selectSite(site.id)}
              aria-pressed={isSelected}
              className={`px-2.5 py-1 text-xs font-mono-num rounded-[var(--lm-radius-sm)] transition-colors ${
                isSelected
                  ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border border-[var(--lm-color-selected-site)] font-semibold shadow-xs'
                  : 'bg-[var(--lm-color-surface-raised)] text-[var(--lm-color-text-secondary)] border border-[var(--lm-color-border)] hover:text-white hover:bg-[var(--lm-color-surface-strong)]'
              }`}
            >
              {site.name}
            </button>
          );
        })}
      </div>
    </footer>
  );
}
