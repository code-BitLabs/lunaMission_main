import { useCallback, useMemo, useState } from 'react';
import { CandidateSite } from '@/domain/sites/candidateSite';
import { useScenario, useScenarioModel } from '@/app/scenario/context/scenarioContext';
import {
  DEFAULT_COMPARISON_SITE_IDS,
  MAX_COMPARISON_SITES,
  addComparisonSite,
  buildComparisonColumns,
  comparisonSitesToAdd,
  removeComparisonSite,
} from '@/features/comparison/model/comparisonColumns';
import { ComparisonHeader } from '@/features/comparison/components/ComparisonHeader';
import { ComparisonTableHead } from '@/features/comparison/components/table/ComparisonTableHead';
import { ComparisonLocationRows, ComparisonTerrainRows } from '@/features/comparison/components/rows/ComparisonSiteRows';
import { ComparisonSunRows } from '@/features/comparison/components/rows/ComparisonSunRows';
import { ComparisonEarthRows } from '@/features/comparison/components/rows/ComparisonEarthRows';
import { ComparisonPolicyNotice } from '@/features/comparison/components/ComparisonPolicyNotice';

interface ComparisonMatrixProps {
  /** Navigation intent: selecting a site also switches to the explore tab. */
  onSelectSiteForExplore: (site: CandidateSite) => void;
}

/**
 * Compare view: the same epoch and calculation mode applied to 2–4 candidate
 * sites, one row per physical parameter. All geometry comes from
 * `buildComparisonColumns`; this component only assembles the table.
 */
export function ComparisonMatrix({ onSelectSiteForExplore }: ComparisonMatrixProps) {
  const { calculationMode } = useScenario();
  const { epochMs, epochIsoUtc } = useScenarioModel();
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([...DEFAULT_COMPARISON_SITE_IDS]);

  const columns = useMemo(
    () => buildComparisonColumns(selectedSiteIds, epochMs, calculationMode),
    [selectedSiteIds, epochMs, calculationMode],
  );
  const sitesToAdd = useMemo(() => comparisonSitesToAdd(selectedSiteIds), [selectedSiteIds]);

  const handleAddSite = useCallback((siteId: string) => {
    setSelectedSiteIds((previous) => addComparisonSite(previous, siteId));
  }, []);

  const handleRemoveSite = useCallback((siteId: string) => {
    setSelectedSiteIds((previous) => removeComparisonSite(previous, siteId));
  }, []);

  return (
    <div className="flex flex-col gap-5 py-2">
      <ComparisonHeader
        formattedEpoch={epochIsoUtc.replace('T', ' ').replace('Z', ' UTC')}
        sitesToAdd={sitesToAdd}
        canAddSite={selectedSiteIds.length < MAX_COMPARISON_SITES}
        onAddSite={handleAddSite}
      />

      {/* Comparison Matrix Table */}
      <div className="w-full bg-[var(--lm-color-surface)] border border-[var(--lm-color-border-subtle)] rounded-[var(--lm-radius-lg)] overflow-x-auto shadow-sm">
        <table className="w-full min-w-[720px] text-left border-collapse font-mono-num text-xs">
          <ComparisonTableHead
            sites={columns.map((column) => column.site)}
            onRemoveSite={handleRemoveSite}
            onInspectSite={onSelectSiteForExplore}
          />

          <tbody className="divide-y divide-[var(--lm-color-border-subtle)] text-[var(--lm-color-text-secondary)]">
            <ComparisonLocationRows columns={columns} />
            <ComparisonSunRows columns={columns} columnCount={columns.length + 1} />
            <ComparisonEarthRows columns={columns} columnCount={columns.length + 1} />
            <ComparisonTerrainRows columns={columns} />
          </tbody>
        </table>
      </div>

      <ComparisonPolicyNotice />
    </div>
  );
}
