import { useState } from 'react';
import { Header } from '@/app/header/Header';
import { NavTab } from '@/app/header/config/navTabs';
import { SpatialWorkspace } from '@/features/spatial/ui/SpatialWorkspace';
import { TimeExplorer } from '@/features/time/ui/TimeExplorer';
import { ComparisonMatrix } from '@/features/comparison/ui/ComparisonMatrix';
import { MethodAndDataView } from '@/features/methodology/ui/MethodAndDataView';
import { CandidateSite } from '@/domain/sites/candidateSite';
import { useScenarioCommands, useScenarioModel } from '@/app/scenario/context/scenarioContext';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('explore');
  const { epochIsoUtc } = useScenarioModel();
  const { selectSite } = useScenarioCommands();

  function handleSelectSiteForExplore(site: CandidateSite) {
    selectSite(site.id);
    setActiveTab('explore');
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--lm-color-canvas)] text-[var(--lm-color-text-primary)]">
      {/* 1. Global Authoritative Application Header */}
      <Header activeTab={activeTab} onTabChange={setActiveTab} isDemoMode={false} />

      {/* 2. Main Content Area in Normal Document Flow */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-6 min-w-0">
        {activeTab === 'explore' && (
          <div className="flex flex-col gap-6 w-full min-w-0">
            {/* 1. Spatial Workspace: Toolbar, 2D/3D Visualization, Point Passport, and Candidate Sites */}
            <SpatialWorkspace onOpenMethodDetails={() => setActiveTab('method')} />

            {/* 2. Sibling Section: Continuous Ephemeris Time Explorer */}
            <section className="w-full min-w-0" aria-label="Time-Series Celestial Ephemeris Explorer">
              <TimeExplorer />
            </section>
          </div>
        )}

        {activeTab === 'compare' && (
          <section className="w-full min-w-0" aria-label="Candidate Sites Comparison Matrix">
            <ComparisonMatrix onSelectSiteForExplore={handleSelectSiteForExplore} />
          </section>
        )}

        {activeTab === 'method' && (
          <section className="w-full min-w-0" aria-label="Scientific Methodology and Data Specifications">
            <MethodAndDataView />
          </section>
        )}
      </main>

      {/* 3. Authoritative Application Footer */}
      <footer className="w-full border-t border-[var(--lm-color-border-subtle)] bg-[var(--lm-color-surface)] py-3 px-4 sm:px-6 mt-auto shrink-0">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-[var(--lm-color-text-muted)]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[var(--lm-color-text-secondary)] font-medium">LunaMission Observatory</span>
            <span>•</span>
            <span>NASA JPL DE421 Ephemeris Engine</span>
            <span>•</span>
            <span>LRO LOLA DEM 128ppd</span>
            <span>•</span>
            <span>IAU 2015 Lunar Reference Frame</span>
          </div>
          <div>
            Canonical Epoch: <span className="text-[var(--lm-color-selected-site)] font-semibold">{epochIsoUtc}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
