import React, { useState, useEffect } from 'react';
import { Clock, ChevronLeft, ChevronRight, RotateCcw, Calendar, AlertCircle } from 'lucide-react';
import { validateUtcDateTime, splitIsoUtc, stepUtc, formatIsoUtc } from '../../lib/time';

interface UtcTimeControlProps {
  currentIsoUtc: string;
  onEpochChange: (newIsoUtc: string) => void;
  compact?: boolean;
}

export function UtcTimeControl({ currentIsoUtc, onEpochChange, compact = false }: UtcTimeControlProps) {
  const { dateStr: initialDate, timeStr: initialTime } = splitIsoUtc(currentIsoUtc);
  const [dateInput, setDateInput] = useState(initialDate);
  const [timeInput, setTimeInput] = useState(initialTime);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync internal inputs whenever currentIsoUtc changes externally
  useEffect(() => {
    const { dateStr, timeStr } = splitIsoUtc(currentIsoUtc);
    setDateInput(dateStr);
    setTimeInput(timeStr);
    setValidationError(null);
  }, [currentIsoUtc]);

  function handleDateChange(val: string) {
    setDateInput(val);
    const result = validateUtcDateTime(val, timeInput);
    if (result.isValid && result.normalizedIsoUtc) {
      setValidationError(null);
      onEpochChange(result.normalizedIsoUtc);
    } else {
      setValidationError(result.errorMessage || 'Invalid UTC date');
    }
  }

  function handleTimeChange(val: string) {
    setTimeInput(val);
    const result = validateUtcDateTime(dateInput, val);
    if (result.isValid && result.normalizedIsoUtc) {
      setValidationError(null);
      onEpochChange(result.normalizedIsoUtc);
    } else {
      setValidationError(result.errorMessage || 'Invalid UTC time');
    }
  }

  function handleStep(deltaMinutes: number) {
    const stepped = stepUtc(currentIsoUtc, deltaMinutes);
    onEpochChange(stepped);
  }

  function handleSetNow() {
    const nowUtc = formatIsoUtc(new Date());
    onEpochChange(nowUtc);
  }

  function handlePresetSelect(isoString: string) {
    onEpochChange(isoString);
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-mono-num">
        <button
          type="button"
          onClick={() => handleStep(-60)}
          title="Step back 1 hour (UTC)"
          aria-label="Step back 1 hour"
          className="p-1 rounded-[var(--lm-radius-xs)] bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-border)] text-[var(--lm-color-text-secondary)] hover:text-white"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <span className="px-2 py-0.5 rounded-[var(--lm-radius-xs)] bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-border)] text-[var(--lm-color-text-primary)] font-semibold flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-[var(--lm-color-sun)]" />
          {dateInput} {timeInput}
          <span className="text-[10px] text-[var(--lm-color-text-muted)] bg-[var(--lm-color-surface)] px-1 py-0.2 rounded font-mono">
            UTC
          </span>
        </span>

        <button
          type="button"
          onClick={() => handleStep(60)}
          title="Step forward 1 hour (UTC)"
          aria-label="Step forward 1 hour"
          className="p-1 rounded-[var(--lm-radius-xs)] bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-border)] text-[var(--lm-color-text-secondary)] hover:text-white"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        {/* Date Input */}
        <div className="flex items-center gap-1.5 bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-border)] px-2.5 py-1 rounded-[var(--lm-radius-sm)] focus-within:border-[var(--lm-color-focus)]">
          <label htmlFor="utc-date-input" className="text-xs text-[var(--lm-color-text-muted)] font-medium flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[var(--lm-color-text-muted)]" />
            <span className="sr-only sm:not-sr-only">Date:</span>
          </label>
          <input
            id="utc-date-input"
            type="text"
            value={dateInput}
            onChange={(e) => handleDateChange(e.target.value)}
            placeholder="YYYY-MM-DD"
            className="w-24 sm:w-28 text-xs font-mono-num bg-transparent text-[var(--lm-color-text-primary)] focus:outline-none"
            aria-label="Selected UTC Date (YYYY-MM-DD)"
          />
        </div>

        {/* Time Input */}
        <div className="flex items-center gap-1.5 bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-border)] px-2.5 py-1 rounded-[var(--lm-radius-sm)] focus-within:border-[var(--lm-color-focus)]">
          <label htmlFor="utc-time-input" className="text-xs text-[var(--lm-color-text-muted)] font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[var(--lm-color-text-muted)]" />
            <span className="sr-only sm:not-sr-only">Time:</span>
          </label>
          <input
            id="utc-time-input"
            type="text"
            value={timeInput}
            onChange={(e) => handleTimeChange(e.target.value)}
            placeholder="HH:mm:ss"
            className="w-20 text-xs font-mono-num bg-transparent text-[var(--lm-color-text-primary)] focus:outline-none"
            aria-label="Selected UTC Time (HH:mm:ss)"
          />
          <span className="text-[11px] font-semibold text-[var(--lm-color-sun)] bg-[var(--lm-color-surface)] px-1.5 py-0.5 rounded-[var(--lm-radius-xs)] font-mono">
            UTC
          </span>
        </div>

        {/* Step Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleStep(-60)}
            title="Step back 1 hour"
            aria-label="Step back 1 hour (UTC)"
            className="px-2 py-1 text-xs font-mono-num rounded-[var(--lm-radius-xs)] bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-border)] text-[var(--lm-color-text-secondary)] hover:text-white hover:bg-[var(--lm-color-surface-strong)] transition-colors"
          >
            -1h
          </button>
          <button
            type="button"
            onClick={() => handleStep(-10)}
            title="Step back 10 minutes"
            aria-label="Step back 10 minutes (UTC)"
            className="px-1.5 py-1 text-xs font-mono-num rounded-[var(--lm-radius-xs)] bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-border)] text-[var(--lm-color-text-secondary)] hover:text-white hover:bg-[var(--lm-color-surface-strong)] transition-colors"
          >
            -10m
          </button>
          <button
            type="button"
            onClick={() => handleStep(10)}
            title="Step forward 10 minutes"
            aria-label="Step forward 10 minutes (UTC)"
            className="px-1.5 py-1 text-xs font-mono-num rounded-[var(--lm-radius-xs)] bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-border)] text-[var(--lm-color-text-secondary)] hover:text-white hover:bg-[var(--lm-color-surface-strong)] transition-colors"
          >
            +10m
          </button>
          <button
            type="button"
            onClick={() => handleStep(60)}
            title="Step forward 1 hour"
            aria-label="Step forward 1 hour (UTC)"
            className="px-2 py-1 text-xs font-mono-num rounded-[var(--lm-radius-xs)] bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-border)] text-[var(--lm-color-text-secondary)] hover:text-white hover:bg-[var(--lm-color-surface-strong)] transition-colors"
          >
            +1h
          </button>
        </div>

        {/* Presets dropdown */}
        <div className="flex items-center gap-1.5">
          <label htmlFor="mission-presets-select" className="sr-only">Mission Preset Epochs</label>
          <select
            id="mission-presets-select"
            aria-label="Mission preset epochs"
            onChange={(e) => {
              if (e.target.value) {
                handlePresetSelect(e.target.value);
              }
            }}
            value=""
            className="text-xs bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-border)] text-[var(--lm-color-text-secondary)] rounded-[var(--lm-radius-sm)] px-2 py-1 focus:outline-none focus:border-[var(--lm-color-focus)] cursor-pointer"
          >
            <option value="" disabled>
              Mission Presets...
            </option>
            <option value="2026-10-21T12:00:00Z">Artemis III Target (2026-10-21 12:00 UTC)</option>
            <option value="2026-12-14T00:00:00Z">South Summer Solstice (2026-12-14 00:00 UTC)</option>
            <option value="2026-06-18T00:00:00Z">South Winter Minimum (2026-06-18 00:00 UTC)</option>
            <option value="2026-11-05T06:00:00Z">VIPER Candidate Phase (2026-11-05 06:00 UTC)</option>
          </select>

          <button
            type="button"
            onClick={handleSetNow}
            title="Set to Current Real-world UTC Time"
            className="flex items-center gap-1 px-2 py-1 text-xs rounded-[var(--lm-radius-sm)] bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-border)] text-[var(--lm-color-text-muted)] hover:text-[var(--lm-color-text-primary)] hover:border-[var(--lm-color-border-subtle)] transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Now</span>
          </button>
        </div>
      </div>

      {validationError && (
        <div className="flex items-center gap-1.5 text-xs text-[var(--lm-color-warning)] bg-[var(--lm-color-surface-raised)] px-2.5 py-1 rounded-[var(--lm-radius-xs)] border border-[var(--lm-color-warning)]/30">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{validationError} — retaining previous valid epoch.</span>
        </div>
      )}
    </div>
  );
}
