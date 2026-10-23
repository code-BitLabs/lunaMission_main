import { Sun } from 'lucide-react';
import { Badge } from '@/shared/ui/Badge';
import { MatrixCell, MatrixRow, MatrixSectionRow } from '@/features/comparison/components/table/MatrixTablePrimitives';
import { ComparisonColumn } from '@/features/comparison/model/comparisonColumns';
import { ILLUMINATION_BADGE_CELLS, signedAngleCell, unsignedAngleCell } from '@/features/comparison/model/comparisonCells';

const SUN_TONE_CLASS = 'text-[var(--lm-color-sun)]';

interface ComparisonSunRowsProps {
  columns: ComparisonColumn[];
  /** Label column plus one column per compared site. */
  columnCount: number;
}

/** Sun geometry at the shared epoch: elevation, bearing, and the resulting illumination. */
export function ComparisonSunRows({ columns, columnCount }: ComparisonSunRowsProps) {
  return (
    <>
      <MatrixSectionRow
        columnCount={columnCount}
        tone={SUN_TONE_CLASS}
        icon={<Sun className="w-3.5 h-3.5" />}
        title="Sun Geometry at Selected Epoch"
      />

      <MatrixRow label="Sun Elevation (°)">
        {columns.map(({ site, conditions }) => (
          <MatrixCell key={site.id} className="font-bold text-[var(--lm-color-sun)] text-sm">
            {signedAngleCell(conditions.sunElevationDeg)}
          </MatrixCell>
        ))}
      </MatrixRow>

      <MatrixRow label="Sun Azimuth (from North)">
        {columns.map(({ site, conditions }) => (
          <MatrixCell key={site.id} className="font-mono">
            {unsignedAngleCell(conditions.sunAzimuthDeg)}
          </MatrixCell>
        ))}
      </MatrixRow>

      <MatrixRow label="Illumination Condition">
        {columns.map(({ site, conditions }) => {
          const badge = ILLUMINATION_BADGE_CELLS[conditions.solarIllumination];
          return (
            <MatrixCell key={site.id}>
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </MatrixCell>
          );
        })}
      </MatrixRow>
    </>
  );
}
