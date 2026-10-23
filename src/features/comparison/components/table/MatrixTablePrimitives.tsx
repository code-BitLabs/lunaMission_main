import { ReactNode } from 'react';

/**
 * Table primitives for the comparison matrix: one labelled measurement row,
 * one cell per compared site, and the section banner that groups them.
 */

const ROW_CLASS = 'hover:bg-[var(--lm-color-surface-raised)]/40 transition-colors';
const LABEL_CLASS = 'p-3 text-[var(--lm-color-text-muted)] font-sans font-medium';
const CELL_BASE_CLASS = 'p-3 border-l border-[var(--lm-color-border-subtle)]';
const SECTION_ROW_CLASS =
  'bg-[var(--lm-color-surface-raised)]/70 font-semibold text-[11px] uppercase tracking-wider font-mono';
const SECTION_CELL_CLASS = 'py-2 px-3 flex items-center gap-1.5';

interface MatrixRowProps {
  label: string;
  /** One `MatrixCell` per compared site, in column order. */
  children: ReactNode;
}

/** A single measurement row: label column first, then the site columns. */
export function MatrixRow({ label, children }: MatrixRowProps) {
  return (
    <tr className={ROW_CLASS}>
      <td className={LABEL_CLASS}>{label}</td>
      {children}
    </tr>
  );
}

interface MatrixCellProps {
  /** Utilities appended after the shared cell chrome. */
  className?: string;
  children: ReactNode;
}

/** A site column's cell, carrying the shared padding and column divider. */
export function MatrixCell({ className = '', children }: MatrixCellProps) {
  return <td className={className ? `${CELL_BASE_CLASS} ${className}` : CELL_BASE_CLASS}>{children}</td>;
}

interface MatrixSectionRowProps {
  /** Label column plus one column per compared site. */
  columnCount: number;
  /** Text colour utility for the group, e.g. `text-[var(--lm-color-sun)]`. */
  tone: string;
  icon: ReactNode;
  title: string;
}

/** Banner row that opens a group of related measurements. */
export function MatrixSectionRow({ columnCount, tone, icon, title }: MatrixSectionRowProps) {
  return (
    <tr className={`${SECTION_ROW_CLASS} ${tone}`}>
      <td colSpan={columnCount} className={SECTION_CELL_CLASS}>
        {icon}
        <span>{title}</span>
      </td>
    </tr>
  );
}
