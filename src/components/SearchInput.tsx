import type { KeyboardEvent } from "react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (newTab: boolean) => void;
  disabled?: boolean;
  isGenerating?: boolean;
}

export function SearchInput({
  value,
  onChange,
  onSubmit,
  disabled,
  isGenerating,
}: SearchInputProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      onSubmit(true);
      return;
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit(false);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-[var(--color-text-muted)]">
          Describe the cards you want
        </span>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={4}
          placeholder='e.g. "red creatures that deal damage when they enter the battlefield"'
          className="w-full resize-y rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onSubmit(false)}
          disabled={disabled || !value.trim()}
          className="rounded-xl bg-[var(--color-accent)] px-5 py-2.5 font-medium text-white transition hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating ? "Generating..." : "Search on Scryfall"}
        </button>
        <p className="text-xs text-[var(--color-text-muted)]">
          Enter to search · Ctrl+Enter to open in new tab
        </p>
      </div>
    </div>
  );
}
