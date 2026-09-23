import type { KeyboardEvent } from "react";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { QueryPreview } from "./QueryPreview";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (newTab: boolean) => void;
  disabled?: boolean;
  isGenerating?: boolean;
  previewQuery?: string | null;
  onCopy?: () => void;
}

export function SearchInput({
  value,
  onChange,
  onSubmit,
  disabled,
  isGenerating,
  previewQuery,
  onCopy,
}: SearchInputProps) {
  const handleTranscript = (transcript: string) => {
    onChange(value.trim() ? `${value.trim()} ${transcript}` : transcript);
  };

  const { isListening, isSupported, startListening } = useSpeechRecognition(handleTranscript);

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
      <div className="relative">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={4}
          placeholder='e.g. "red creatures that deal damage when they enter the battlefield"'
          className="w-full resize-y rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 pr-12 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 disabled:cursor-not-allowed disabled:opacity-60"
        />
        {isSupported && (
          <button
            type="button"
            onClick={startListening}
            disabled={disabled}
            aria-label={isListening ? "Stop listening" : "Start speech input"}
            title={isListening ? "Stop listening" : "Speech to text"}
            className={`absolute right-3 top-3 rounded-lg p-1.5 transition disabled:cursor-not-allowed disabled:opacity-50 ${
              isListening
                ? "bg-[var(--color-error)]/20 text-[var(--color-error)]"
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className={`h-5 w-5 ${isListening ? "animate-pulse" : ""}`}
              aria-hidden="true"
            >
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </button>
        )}
      </div>

      {(isGenerating || previewQuery) && (
        <QueryPreview
          query={previewQuery ?? undefined}
          isLoading={isGenerating && !previewQuery}
          onCopy={onCopy}
        />
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onSubmit(false)}
          disabled={disabled || !value.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-5 py-2.5 font-medium text-white transition hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating && (
            <span
              className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
              aria-hidden="true"
            />
          )}
          {isGenerating ? "Generating..." : "Search on Scryfall"}
        </button>
        <p className="text-xs text-[var(--color-text-muted)]">
          Enter to search · Ctrl+Enter to open in new tab
          {isSupported ? " · Mic for speech input" : ""}
        </p>
      </div>
    </div>
  );
}
