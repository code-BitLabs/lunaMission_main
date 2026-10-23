import type { TimelineDataPoint } from '@/domain/celestial/timeline';

import {
  elevationToY,
  indexToX,
  PLOT_BOTTOM,
  PLOT_LEFT,
  PLOT_RIGHT,
  PLOT_WIDTH,
  seriesPath,
  showTickAt,
  tickLabel,
  TIME_CHART_GRID_ELEV_DEG,
} from '@/features/time/model/chart/timeChartGeometry';
import {
  HOVERED_SAMPLE_RADIUS,
  SAMPLE_RADIUS,
  SAMPLE_STROKE_COLOR,
  SUB_HORIZON_FILL,
  ZERO_HORIZON_COLOR,
} from '@/features/time/model/chart/timeChartStyles';

const GRID_FONT_SIZE = 9.5;
const AXIS_LABEL_OFFSET = 8;
const AXIS_LABEL_BASELINE = 3.5;
const TICK_LINE_LENGTH = 5;
const TICK_LABEL_OFFSET = 18;

export interface TimeSeriesPlotProps {
  points: TimelineDataPoint[];
  windowHours: number;
  hoveredIndex: number | null;
}

/** Everything that follows from the samples: axis, series lines, points, ticks. */
export function TimeSeriesPlot({ points, windowHours, hoveredIndex }: TimeSeriesPlotProps) {
  const zeroY = elevationToY(0);
  const sunPath = seriesPath(points, (p) => p.sunElevationDeg);
  const earthPath = seriesPath(points, (p) => p.earthElevationDeg);

  return (
    <>
      <rect
        x={PLOT_LEFT}
        y={zeroY}
        width={PLOT_WIDTH}
        height={PLOT_BOTTOM - zeroY}
        fill={SUB_HORIZON_FILL}
        opacity="0.85"
      />

      {TIME_CHART_GRID_ELEV_DEG.map((elev) => {
        const y = elevationToY(elev);
        const isZero = elev === 0;
        return (
          <g key={elev}>
            <line
              x1={PLOT_LEFT}
              y1={y}
              x2={PLOT_RIGHT}
              y2={y}
              stroke={isZero ? ZERO_HORIZON_COLOR : 'var(--lm-color-border-subtle)'}
              strokeWidth={isZero ? 1.5 : 0.8}
              strokeDasharray={isZero ? '5 4' : '2 3'}
              strokeOpacity={isZero ? 0.85 : 0.3}
            />
            <text
              x={PLOT_LEFT - AXIS_LABEL_OFFSET}
              y={y + AXIS_LABEL_BASELINE}
              textAnchor="end"
              fill={isZero ? ZERO_HORIZON_COLOR : 'var(--lm-color-text-muted)'}
              fontSize={GRID_FONT_SIZE}
              fontWeight={isZero ? 'bold' : 'normal'}
              fontFamily="monospace"
            >
              {elev > 0 ? `+${elev}°` : `${elev}°`}
            </text>
          </g>
        );
      })}

      <text
        x={PLOT_RIGHT - AXIS_LABEL_OFFSET}
        y={zeroY - 6}
        textAnchor="end"
        fill={ZERO_HORIZON_COLOR}
        fontSize="9"
        fontWeight="bold"
        fontFamily="monospace"
        opacity="0.85"
      >
        0° Mean Horizon Reference
      </text>

      <path
        d={sunPath}
        fill="none"
        stroke="var(--lm-color-sun)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      <path
        d={earthPath}
        fill="none"
        stroke="var(--lm-color-earth)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {points.map((p, idx) => {
        const x = indexToX(idx, points.length);
        const isHovered = hoveredIndex === idx;
        const radius = isHovered ? HOVERED_SAMPLE_RADIUS : SAMPLE_RADIUS;
        const strokeWidth = isHovered ? 1.5 : 0.8;
        return (
          <g key={p.timestampUtc}>
            {p.sunElevationDeg !== null && (
              <circle
                cx={x}
                cy={elevationToY(p.sunElevationDeg)}
                r={radius}
                fill="var(--lm-color-sun)"
                stroke={SAMPLE_STROKE_COLOR}
                strokeWidth={strokeWidth}
                className="transition-all"
              />
            )}
            {p.earthElevationDeg !== null && (
              <circle
                cx={x}
                cy={elevationToY(p.earthElevationDeg)}
                r={radius}
                fill="var(--lm-color-earth)"
                stroke={SAMPLE_STROKE_COLOR}
                strokeWidth={strokeWidth}
                className="transition-all"
              />
            )}

            {showTickAt(idx, points.length, windowHours) && (
              <g>
                <line
                  x1={x}
                  y1={PLOT_BOTTOM}
                  x2={x}
                  y2={PLOT_BOTTOM + TICK_LINE_LENGTH}
                  stroke="var(--lm-color-border-subtle)"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={PLOT_BOTTOM + TICK_LABEL_OFFSET}
                  textAnchor="middle"
                  fill="var(--lm-color-text-muted)"
                  fontSize={GRID_FONT_SIZE}
                  fontFamily="monospace"
                >
                  {tickLabel(p, windowHours)}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </>
  );
}
