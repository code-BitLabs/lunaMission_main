import { MatrixCell, MatrixRow } from '@/features/comparison/components/table/MatrixTablePrimitives';
import { ComparisonColumn } from '@/features/comparison/model/comparisonColumns';

interface ComparisonSiteRowsProps {
  columns: ComparisonColumn[];
}

/** Selenographic position and LOLA elevation: catalog facts, independent of the epoch. */
export function ComparisonLocationRows({ columns }: ComparisonSiteRowsProps) {
  return (
    <>
      <MatrixRow label="Selenographic Coordinates">
        {columns.map(({ site }) => (
          <MatrixCell key={site.id} className="font-mono">
            {Math.abs(site.coordinates.latitudeDeg).toFixed(2)}°S, {site.coordinates.longitudeDeg.toFixed(2)}°E
          </MatrixCell>
        ))}
      </MatrixRow>

      <MatrixRow label="LOLA DEM Elevation">
        {columns.map(({ site }) => (
          <MatrixCell key={site.id} className="font-bold text-[var(--lm-color-text-primary)]">
            +{site.coordinates.elevationMeters.toLocaleString()} m
          </MatrixCell>
        ))}
      </MatrixRow>
    </>
  );
}

/** Mean terrain horizon and the resolution of the DEM behind each column. */
export function ComparisonTerrainRows({ columns }: ComparisonSiteRowsProps) {
  return (
    <>
      <MatrixRow label="Terrain Horizon Clearance">
        {columns.map(({ site }) => (
          <MatrixCell key={site.id} className="font-mono text-[var(--lm-color-text-secondary)]">
            Horizon Dip: ~{site.meanTerrainHorizonDeg > 0 ? `+${site.meanTerrainHorizonDeg}` : site.meanTerrainHorizonDeg}°
          </MatrixCell>
        ))}
      </MatrixRow>

      <MatrixRow label="DEM Data Resolution">
        {columns.map(({ site }) => (
          <MatrixCell key={site.id} className="font-mono text-[11px] text-[var(--lm-color-text-muted)]">
            {site.coverageStatus}
          </MatrixCell>
        ))}
      </MatrixRow>
    </>
  );
}
