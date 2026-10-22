import React, { useState } from 'react';
import { Compass, GitCompare, BookOpen, Info, HelpCircle } from 'lucide-react';
import { UtcTimeControl } from '../time/UtcTimeControl';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';

export type NavTab = 'explore' | 'compare' | 'method';

interface HeaderProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  currentIsoUtc: string;
  onEpochChange: (newIsoUtc: string) => void;
  isDemoMode: boolean;
}

export function Header({
  activeTab,
  onTabChange,
  currentIsoUtc,
  onEpochChange,
  isDemoMode,
}: HeaderProps) {
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);

  return (
    <header className="relative lg:sticky top-0 z-40 w-full bg-[var(--lm-color-surface)]/95 backdrop-blur-md border-b border-[var(--lm-color-border)]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Brand & Primary Navigation */}
          <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-6">
            <div className="flex items-center gap-2.5">
              {/* Restrained Lunar Orbit Emblem */}
              <div className="w-7 h-7 rounded-full bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-border)] flex items-center justify-center relative overflow-hidden shadow-inner">
                <div className="w-4 h-4 rounded-full bg-slate-300 relative">
                  <div className="absolute inset-0 bg-[var(--lm-color-surface-raised)] rounded-full -translate-x-1.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-base sm:text-lg tracking-tight text-[var(--lm-color-text-primary)]">
                  LunaMission
                </span>
                <span className="hidden sm:inline-block text-[11px] font-mono text-[var(--lm-color-text-muted)] tracking-wider uppercase">
                  South-Pole Observatory
                </span>
              </div>
            </div>

            {/* Nav Tabs */}
            <nav className="flex items-center gap-1 bg-[var(--lm-color-canvas)] p-1 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border-subtle)] shrink-0" aria-label="Main Navigation">
              <button
                type="button"
                onClick={() => onTabChange('explore')}
                aria-label="Explore Observatory"
                title="Explore Observatory"
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-[var(--lm-radius-xs)] transition-colors ${
                  activeTab === 'explore'
                    ? 'bg-[var(--lm-color-surface-raised)] text-[var(--lm-color-text-primary)] border border-[var(--lm-color-border)] shadow-xs'
                    : 'text-[var(--lm-color-text-muted)] hover:text-[var(--lm-color-text-secondary)]'
                }`}
              >
                <Compass className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Explore</span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange('compare')}
                aria-label="Compare Candidates"
                title="Compare Candidates"
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-[var(--lm-radius-xs)] transition-colors ${
                  activeTab === 'compare'
                    ? 'bg-[var(--lm-color-surface-raised)] text-[var(--lm-color-text-primary)] border border-[var(--lm-color-border)] shadow-xs'
                    : 'text-[var(--lm-color-text-muted)] hover:text-[var(--lm-color-text-secondary)]'
                }`}
              >
                <GitCompare className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Compare</span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange('method')}
                aria-label="Method & Data Reference"
                title="Method & Data Reference"
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-[var(--lm-radius-xs)] transition-colors ${
                  activeTab === 'method'
                    ? 'bg-[var(--lm-color-surface-raised)] text-[var(--lm-color-text-primary)] border border-[var(--lm-color-border)] shadow-xs'
                    : 'text-[var(--lm-color-text-muted)] hover:text-[var(--lm-color-text-secondary)]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Method</span>
                <span className="hidden md:inline"> & Data</span>
              </button>
            </nav>
          </div>

          {/* Right Controls: UTC Epoch & Information Badges */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5">
            <UtcTimeControl
              currentIsoUtc={currentIsoUtc}
              onEpochChange={onEpochChange}
            />

            <div className="flex items-center gap-2">
              {isDemoMode ? (
                <button
                  type="button"
                  onClick={() => setShowDemoModal(true)}
                  aria-label="Demo data active notice"
                  className="cursor-pointer"
                >
                  <Badge variant="demo" icon={<Info className="w-3 h-3" />}>
                    Demo Data
                  </Badge>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDemoModal(true)}
                  aria-label="Ephemeris model status"
                  className="cursor-pointer"
                >
                  <Badge variant="success" icon={<span className="w-1.5 h-1.5 rounded-full bg-[var(--lm-color-success)]" />}>
                    Live Ephemeris
                  </Badge>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                aria-label="Observatory Guide & Documentation"
                className="p-1.5 text-[var(--lm-color-text-muted)] hover:text-[var(--lm-color-text-primary)] hover:bg-[var(--lm-color-surface-raised)] rounded-[var(--lm-radius-xs)] transition-colors"
                title="Observatory Guide"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Help Modal */}
      <Modal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        title="LunaMission Scientific Observatory Guide"
        subtitle="Scientific methodology, workflow conventions, and interpretation standards"
      >
        <div className="space-y-4">
          <section>
            <h3 className="text-sm font-semibold text-[var(--lm-color-text-primary)] mb-1">
              Primary Workflow
            </h3>
            <p className="text-xs leading-relaxed text-[var(--lm-color-text-secondary)]">
              <strong>Select a candidate site → Choose a UTC epoch → Inspect local geometry and evidence → Compare sites → Understand limitations and provenance.</strong>
            </p>
          </section>

          <section className="bg-[var(--lm-color-surface-raised)] p-3 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border)]">
            <h3 className="text-xs font-semibold text-[var(--lm-color-sun)] uppercase tracking-wider mb-1">
              Scientific Integrity Rules
            </h3>
            <ul className="text-xs text-[var(--lm-color-text-secondary)] space-y-1.5 list-disc list-inside">
              <li>
                <strong>Geometric Visibility ≠ Radio Link:</strong> Line of sight to Earth indicates geometric horizon clearance only. Successful RF communications require link margin, antenna pointing, and DSN ground station scheduling.
              </li>
              <li>
                <strong>Theoretical Light-Time ≠ Latency:</strong> Calculated as <code className="font-mono text-[var(--lm-color-text-primary)]">t = d / c</code> in vacuum (~1.21 to 1.35 s). Does not include ground routing or protocol framing.
              </li>
              <li>
                <strong>Geometry-only vs Terrain-aware:</strong> Geometry-only compares against a 1,737.4 km mean lunar sphere. Terrain-aware uses LRO LOLA DEM 128ppd profiles to evaluate topographic rim shielding and horizon dip.
              </li>
              <li>
                <strong>Global UTC State:</strong> All calculations synchronize directly to Coordinated Universal Time (UTC) without local browser timezone offset.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-[var(--lm-color-text-primary)] mb-1">
              Color Token Standards
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="flex items-center gap-2 p-2 rounded bg-[var(--lm-color-canvas)] border border-[var(--lm-color-border-subtle)]">
                <span className="w-3 h-3 rounded-full bg-[var(--lm-color-sun)] shrink-0" />
                <span>Solar Gold: Sun direction & illumination</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-[var(--lm-color-canvas)] border border-[var(--lm-color-border-subtle)]">
                <span className="w-3 h-3 rounded-full bg-[var(--lm-color-earth)] shrink-0" />
                <span>Earth Blue: Earth direction & DTE visibility</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-[var(--lm-color-canvas)] border border-[var(--lm-color-border-subtle)]">
                <span className="w-3 h-3 rounded-full bg-[var(--lm-color-selected-site)] shrink-0" />
                <span>Teal: Selected candidate site</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-[var(--lm-color-canvas)] border border-[var(--lm-color-border-subtle)]">
                <span className="w-3 h-3 rounded-full bg-[var(--lm-color-data-demo)] shrink-0" />
                <span>Purple: Demonstration data indicator</span>
              </div>
            </div>
          </section>
        </div>
      </Modal>

      {/* Demo / Live Status Modal */}
      <Modal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
        title="Calculation & Data Provenance Status"
        subtitle="Ephemeris kernel and topography model declaration"
      >
        <div className="space-y-3 text-xs text-[var(--lm-color-text-secondary)]">
          <p>
            Current calculations use deterministic astronomical ephemeris models for sub-solar and sub-Earth vectors based on standard Meeus planetary equations and the IAU/IAG Lunar Mean Earth / Polar Axis frame (matching NASA JPL DE421 ephemeris).
          </p>
          <div className="bg-[var(--lm-color-surface-raised)] p-3 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border)] space-y-1.5 font-mono">
            <div><strong>Ephemeris Engine:</strong> Analytical Lunar Sub-Solar & Libration Vector</div>
            <div><strong>Terrain Elevation Data:</strong> LRO LOLA DEM 128ppd (NASA PDS Geosciences Node)</div>
            <div><strong>Coordinate System:</strong> IAU/IAG 2015 Mean Earth/Polar Axis</div>
            <div><strong>Speed of Light:</strong> 299,792.458 km/s (CODATA)</div>
            <div><strong>Benchmark Validation:</strong> Verified against NASA JPL Horizons Web Service</div>
          </div>
          <p className="text-[var(--lm-color-text-muted)]">
            When connecting to an external microservice backend or mission operations server, this interface adapts automatically to the typed API contracts without modifying presentation semantics.
          </p>
        </div>
      </Modal>
    </header>
  );
}
