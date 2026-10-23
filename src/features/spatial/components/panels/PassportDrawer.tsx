import { X } from 'lucide-react';
import { PointPassport } from '@/features/passport/ui/PointPassport';

export interface PassportDrawerProps {
  onClose: () => void;
  onOpenMethodDetails: () => void;
}

/** Slide-over passport shown on top of the fullscreen spatial viewport. */
export function PassportDrawer({ onClose, onOpenMethodDetails }: PassportDrawerProps) {
  return (
    <aside className="absolute top-0 right-0 bottom-0 w-full sm:w-[500px] z-30 bg-[var(--lm-color-surface)]/98 backdrop-blur-md border-l border-[var(--lm-color-border)] p-4 overflow-y-auto shadow-2xl flex flex-col gap-3">
      <div className="flex items-center justify-between pb-2 border-b border-[var(--lm-color-border-subtle)] shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wider font-mono text-[var(--lm-color-selected-site)]">
          Selected Site Passport
        </span>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-[var(--lm-radius-xs)] text-[var(--lm-color-text-muted)] hover:text-white transition-colors"
          aria-label="Close Point Passport overlay"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <PointPassport onOpenMethodDetails={onOpenMethodDetails} />
    </aside>
  );
}
