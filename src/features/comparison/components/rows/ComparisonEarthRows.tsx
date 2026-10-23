import { Globe as EarthIcon } from 'lucide-react';
import { Badge } from '@/shared/ui/Badge';
import { MatrixCell, MatrixRow, MatrixSectionRow } from '@/features/comparison/components/table/MatrixTablePrimitives';
import { ComparisonColumn } from '@/features/comparison/model/comparisonColumns';
import {
  EARTH_VISIBILITY_BADGE_CELLS,
  secondsCell,
  signedAngleCell,
} from '@/features/comparison/model/comparisonCells';

const EARTH_TONE_CLASS = 'text-[var(--lm-color-earth)]';

interface ComparisonEarthRowsProps {
  columns: ComparisonColumn[];
  /** Label column plus one column per compared site. */
  columnCount: number;
}

/** Earth geometry and the direct link it implies: elevation, line-of-sight, light time. */
export function ComparisonEarthRows({ columns, columnCount }: ComparisonEarthRowsProps) {
  return (
    <>
      <MatrixSectionRow
        columnCount={columnCount}
        tone={EARTH_TONE_CLASS}
        icon={<EarthIcon className="w-3.5 h-3.5" />}
        title="Earth Geometry & Direct Line-of-Sight"
      />

      <MatrixRow label="Earth Center Elevation">
        {columns.map(({ site, conditions }) => (
          <MatrixCell key={site.id} className="font-bold text-[var(--lm-color-earth)] text-sm">
            {signedAngleCell(conditions.earthElevationDeg)}
          </MatrixCell>
        ))}
      </MatrixRow>

      <MatrixRow label="Geometric Line-of-Sight">
        {columns.map(({ site, conditions }) => {
          const badge = EARTH_VISIBILITY_BADGE_CELLS[conditions.earthVisibility];
          return (
            <MatrixCell key={site.id}>
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </MatrixCell>
          );
        })}
      </MatrixRow>

      <MatrixRow label="Theoretical Light Time">
        {columns.map(({ site, conditions }) => (
          <MatrixCell key={site.id} className="font-mono">
            {secondsCell(conditions.theoreticalOneWayLightTimeSeconds)}
          </MatrixCell>
        ))}
      </MatrixRow>
    </>
  );
}
