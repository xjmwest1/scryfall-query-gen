import { buildScryfallSearchUrl } from "../lib/scryfallUrl";

interface QueryPreviewProps {
  query: string;
  onCopy?: () => void;
}

export function QueryPreview({ query, onCopy }: QueryPreviewProps) {
  const url = buildScryfallSearchUrl(query);

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
      <p className="mb-2 text-sm font-medium text-[var(--color-text-muted)]">
        Generated query — redirecting to Scryfall...
      </p>
      <code className="block break-all rounded-lg bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-accent)]">
        {query}
      </code>
      <div className="mt-3 flex flex-wrap gap-3">
        {onCopy && (
          <button
            type="button"
            onClick={onCopy}
            className="text-sm text-[var(--color-text-muted)] underline-offset-2 hover:text-[var(--color-text)] hover:underline"
          >
            Copy query
          </button>
        )}
        <a
          href={url}
          className="text-sm text-[var(--color-accent)] underline-offset-2 hover:underline"
        >
          Open link manually
        </a>
      </div>
    </div>
  );
}
