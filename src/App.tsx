import { useCallback, useState } from "react";
import { ExamplePrompts } from "./components/ExamplePrompts";
import { ModelLoader } from "./components/ModelLoader";
import { QueryPreview } from "./components/QueryPreview";
import { SearchInput } from "./components/SearchInput";
import { useLLM } from "./hooks/useLLM";
import { redirectToScryfall } from "./lib/scryfallUrl";

const PREVIEW_DELAY_MS = 800;

export default function App() {
  const { status, loadProgress, loadText, error, generateQuery, retryLoad } = useLLM();
  const [input, setInput] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [previewQuery, setPreviewQuery] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isModelLoading = status === "loading" || status === "idle";
  const isGenerating = status === "generating" || isSubmitting;
  const isReady = status === "ready";
  const isDisabled = !isReady || isGenerating;

  const handleSubmit = useCallback(
    async (newTab: boolean) => {
      setSubmitError(null);
      setPreviewQuery(null);
      setIsSubmitting(true);

      try {
        const query = await generateQuery(input);
        setPreviewQuery(query);

        window.setTimeout(() => {
          redirectToScryfall(query, newTab);
          if (newTab) {
            setPreviewQuery(null);
            setIsSubmitting(false);
          }
        }, PREVIEW_DELAY_MS);
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
        setIsSubmitting(false);
      }
    },
    [generateQuery, input],
  );

  const handleCopy = useCallback(async () => {
    if (!previewQuery) return;
    await navigator.clipboard.writeText(previewQuery);
  }, [previewQuery]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-12 sm:px-6">
      <header className="mb-10 text-center">
        <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Scryfall Query Generator
        </h1>
        <p className="text-[var(--color-text-muted)]">
          Describe cards in plain English. We&apos;ll turn it into a Scryfall search and take you
          there.
        </p>
      </header>

      <div className="space-y-6">
        {isModelLoading && <ModelLoader progress={loadProgress} text={loadText} />}

        {status === "error" && (
          <div className="rounded-xl border border-[var(--color-error)]/40 bg-[var(--color-error)]/10 p-4">
            <p className="text-sm text-[var(--color-error)]">{error}</p>
            <button
              type="button"
              onClick={retryLoad}
              className="mt-3 text-sm font-medium text-[var(--color-accent)] hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        <SearchInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          disabled={isDisabled}
          isGenerating={isGenerating}
        />

        <ExamplePrompts
          onSelect={setInput}
          disabled={isDisabled}
        />

        {submitError && (
          <p className="text-sm text-[var(--color-error)]">{submitError}</p>
        )}

        {previewQuery && <QueryPreview query={previewQuery} onCopy={handleCopy} />}
      </div>

      <footer className="mt-auto pt-12 text-center text-xs text-[var(--color-text-muted)]">
        LLM runs entirely in your browser. Only the generated query is sent to Scryfall.
      </footer>
    </main>
  );
}
