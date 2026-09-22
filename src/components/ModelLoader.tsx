interface ModelLoaderProps {
  progress: number;
  text: string;
}

export function ModelLoader({ progress, text }: ModelLoaderProps) {
  const percent = Math.round(progress * 100);

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6">
      <p className="mb-2 text-sm font-medium text-[var(--color-text-muted)]">
        Downloading AI model (~1.2 GB, cached after first visit)
      </p>
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-[var(--color-border)]">
        <div
          className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-sm text-[var(--color-text)]">
        {percent}% — {text || "Preparing..."}
      </p>
    </div>
  );
}
