import React, { useState, useMemo } from 'react';
import { Header, NavTab } from './components/layout/Header';
import { SpatialWorkspace } from './components/spatial/SpatialWorkspace';
import { PointPassport } from './components/passport/PointPassport';
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

  function handleSelectSiteForExplore(site: CandidateSite) {
    setSelectedSite(site);
    setActiveTab('explore');
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--lm-color-canvas)] text-[var(--lm-color-text-primary)]">
      {/* Global Application Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentIsoUtc={currentIsoUtc}
        onEpochChange={setCurrentIsoUtc}
        isDemoMode={false}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-6">
        {activeTab === 'explore' && (
          <div className="flex flex-col gap-6">
            {/* Desktop Two-Column Split Layout (~60% Spatial Workspace, ~40% Point Passport) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:h-[640px] items-stretch">
              {/* Left Column: Spatial Workspace */}
              <div className="lg:col-span-7 flex flex-col">
                <SpatialWorkspace
                  selectedSite={selectedSite}
                  onSelectSite={setSelectedSite}
                  sunAzimuthDeg={sunAzVal}
                  earthAzimuthDeg={earthAzVal}
                  subSolarLatDeg={globalEphemeris.subSolarLatDeg}
                  subSolarLonDeg={globalEphemeris.subSolarLonDeg}
                />
              </div>

              {/* Right Column: Point Passport and Results */}
              <div className="lg:col-span-5 flex flex-col">
                <PointPassport
                  site={selectedSite}
                  conditions={conditions}
                  calculationMode={calculationMode}
                  onCalculationModeChange={setCalculationMode}
                  onOpenMethodDetails={() => setActiveTab('method')}
                />
              </div>
            </div>

            {/* Bottom Full-Width Section: Time Explorer */}
            <div className="w-full">
              <TimeExplorer
                selectedSite={selectedSite}
                currentIsoUtc={currentIsoUtc}
                onEpochChange={setCurrentIsoUtc}
                calculationMode={calculationMode}
              />
            </div>
          </div>
        )}

        {activeTab === 'compare' && (
          <ComparisonMatrix
            currentIsoUtc={currentIsoUtc}
            onSelectSiteForExplore={handleSelectSiteForExplore}
            calculationMode={calculationMode}
          />
        )}

        {activeTab === 'method' && <MethodAndDataView />}
      </main>

      {/* Footer Strip */}
      <footer className="w-full border-t border-[var(--lm-color-border-subtle)] bg-[var(--lm-color-surface)] py-3 px-4 sm:px-6 mt-auto">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-[var(--lm-color-text-muted)]">
          <div className="flex items-center gap-2">
            <span>LunaMission Observatory</span>
            <span>•</span>
            <span>JPL DE421 Ephemeris</span>
            <span>•</span>
            <span>LRO LOLA DEM 128ppd</span>
          </div>
          <div>
            Canonical Epoch: <span className="text-[var(--lm-color-text-secondary)] font-semibold">{currentIsoUtc}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
