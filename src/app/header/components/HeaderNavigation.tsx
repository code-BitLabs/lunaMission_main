import { Compass, GitCompare, BookOpen } from 'lucide-react';
import { NavTab } from '@/app/header/config/navTabs';
import { NavTabButton } from '@/app/header/components/NavTabButton';

interface HeaderNavigationProps {
  activeTab: NavTab;
  onSelect: (tab: NavTab) => void;
}

/** Primary navigation: Explore, Compare, Method & Data. */
export function HeaderNavigation({ activeTab, onSelect }: HeaderNavigationProps) {
  return (
    <nav
      className="flex items-center gap-1 bg-[var(--lm-color-canvas)] p-1 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border-subtle)] shrink-0"
      aria-label="Main Navigation"
    >
      <NavTabButton tab="explore" activeTab={activeTab} onSelect={onSelect} icon={<Compass className="w-3.5 h-3.5 shrink-0" />}>
        <span className="hidden sm:inline">Explore</span>
      </NavTabButton>

      <NavTabButton tab="compare" activeTab={activeTab} onSelect={onSelect} icon={<GitCompare className="w-3.5 h-3.5 shrink-0" />}>
        <span className="hidden sm:inline">Compare</span>
      </NavTabButton>

      <NavTabButton tab="method" activeTab={activeTab} onSelect={onSelect} icon={<BookOpen className="w-3.5 h-3.5 shrink-0" />}>
        <span className="hidden sm:inline">Method</span>
        <span className="hidden md:inline"> & Data</span>
      </NavTabButton>
    </nav>
  );
}
