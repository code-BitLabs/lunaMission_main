import React, { useState, useMemo } from 'react';
import { Header, NavTab } from './components/layout/Header';
import { SpatialWorkspace } from './components/spatial/SpatialWorkspace';
import { TimeExplorer } from './components/timeline/TimeExplorer';
import { ComparisonMatrix } from './components/compare/ComparisonMatrix';
import { MethodAndDataView } from './components/method/MethodAndDataView';
import { CANDIDATE_SITES } from './lib/sites-data';
import { CandidateSite } from './types/site';
import { CalculationMode } from './types/celestial';
import { calculateSiteConditions, calculateLunarEphemeris } from './lib/celestial';
import { getJulianDate } from './lib/time';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('explore');
  const [currentIsoUtc, setCurrentIsoUtc] = useState<string>('2026-10-21T12:00:00Z');
  const [selectedSite, setSelectedSite] = useState<CandidateSite>(CANDIDATE_SITES[0]);
  const [calculationMode, setCalculationMode] = useState<CalculationMode>('terrain-aware');

  // Compute conditions for currently selected site and epoch
  const conditions = useMemo(() => {
    const d = new Date(currentIsoUtc);
    return calculateSiteConditions(selectedSite, d, calculationMode);
  }, [selectedSite, currentIsoUtc, calculationMode]);

  // Compute global sub-solar and sub-Earth angles for the 3D Moon globe
  const globalEphemeris = useMemo(() => {
    const d = new Date(currentIsoUtc);
    const jd = getJulianDate(d);
    return calculateLunarEphemeris(jd);
  }, [currentIsoUtc]);

  const sunAzVal = conditions.sunAzimuthDeg.kind === 'available' ? conditions.sunAzimuthDeg.value : 0;
  const earthAzVal = conditions.earthAzimuthDeg.kind === 'available' ? conditions.earthAzimuthDeg.value : 0;
  const sunElevVal = conditions.sunElevationDeg.kind === 'available' ? conditions.sunElevationDeg.value : 0;
  const earthElevVal = conditions.earthElevationDeg.kind === 'available' ? conditions.earthElevationDeg.value : 0;

  function handleSelectSiteForExplore(site: CandidateSite) {
    setSelectedSite(site);
    setActiveTab('explore');
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--lm-color-canvas)] text-[var(--lm-color-text-primary)]">
      {/* 1. Global Authoritative Application Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentIsoUtc={currentIsoUtc}
        onEpochChange={setCurrentIsoUtc}
        isDemoMode={false}
      />

      {/* 2. Main Content Area in Normal Document Flow */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-6 min-w-0">
        {activeTab === 'explore' && (
          <div className="flex flex-col gap-6 w-full min-w-0">
            {/* 1. Spatial Workspace: Toolbar, 2D/3D Visualization, Point Passport, and Candidate Sites */}
            <SpatialWorkspace
              selectedSite={selectedSite}
              onSelectSite={setSelectedSite}
              conditions={conditions}
              calculationMode={calculationMode}
              onCalculationModeChange={setCalculationMode}
              onOpenMethodDetails={() => setActiveTab('method')}
              sunAzimuthDeg={sunAzVal}
              earthAzimuthDeg={earthAzVal}
              sunElevationDeg={sunElevVal}
              earthElevationDeg={earthElevVal}
              subSolarLatDeg={globalEphemeris.subSolarLatDeg}
              subSolarLonDeg={globalEphemeris.subSolarLonDeg}
              subEarthLatDeg={globalEphemeris.subEarthLatDeg}
              subEarthLonDeg={globalEphemeris.subEarthLonDeg}
              currentIsoUtc={currentIsoUtc}
            />

            {/* 2. Sibling Section: Continuous Ephemeris Time Explorer */}
            <section className="w-full min-w-0" aria-label="Time-Series Celestial Ephemeris Explorer">
              <TimeExplorer
                selectedSite={selectedSite}
                currentIsoUtc={currentIsoUtc}
                onEpochChange={setCurrentIsoUtc}
                calculationMode={calculationMode}
              />
            </section>
          </div>
        )}

        {activeTab === 'compare' && (
          <section className="w-full min-w-0" aria-label="Candidate Sites Comparison Matrix">
            <ComparisonMatrix
              currentIsoUtc={currentIsoUtc}
              onSelectSiteForExplore={handleSelectSiteForExplore}
              calculationMode={calculationMode}
            />
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
            Canonical Epoch: <span className="text-[var(--lm-color-selected-site)] font-semibold">{currentIsoUtc}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
