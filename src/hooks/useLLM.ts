import { useCallback, useEffect, useRef, useState } from "react";
import { CreateWebWorkerMLCEngine, type MLCEngineInterface } from "@mlc-ai/web-llm";
import { SYSTEM_PROMPT } from "../lib/prompts";
import { validateQuery } from "../lib/queryValidator";

export const MODEL_ID = "Llama-3.2-1B-Instruct-q4f16-MLC";

export type LLMStatus = "idle" | "loading" | "ready" | "generating" | "error";

interface UseLLMResult {
  status: LLMStatus;
  loadProgress: number;
  loadText: string;
  error: string | null;
  isWebGPUSupported: boolean;
  generateQuery: (input: string) => Promise<string>;
  retryLoad: () => void;
}

export function useLLM(): UseLLMResult {
  const engineRef = useRef<MLCEngineInterface | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const [status, setStatus] = useState<LLMStatus>("idle");
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadText, setLoadText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isWebGPUSupported =
    typeof navigator !== "undefined" && "gpu" in navigator;

  const loadEngine = useCallback(async () => {
    if (!isWebGPUSupported) {
      setStatus("error");
      setError("WebGPU is not supported in this browser. Please use Chrome or Edge 113+.");
      return;
    }

    setStatus("loading");
    setError(null);
    setLoadProgress(0);
    setLoadText("Initializing model...");

    try {
      workerRef.current?.terminate();
      const worker = new Worker(new URL("../workers/llmWorker.ts", import.meta.url), {
        type: "module",
      });
      workerRef.current = worker;

      const engine = await CreateWebWorkerMLCEngine(worker, MODEL_ID, {
        initProgressCallback: (report) => {
          setLoadProgress(report.progress);
          setLoadText(report.text);
        },
      });

      engineRef.current = engine;
      setStatus("ready");
      setLoadProgress(1);
      setLoadText("Model ready");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to load the language model.");
    }
  }, [isWebGPUSupported]);

  useEffect(() => {
    void loadEngine();

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
      engineRef.current = null;
    };
  }, [loadEngine]);

  const generateQuery = useCallback(async (input: string): Promise<string> => {
    const engine = engineRef.current;
    if (!engine || status !== "ready") {
      throw new Error("Model is not ready yet.");
    }

    const trimmed = input.trim();
    if (!trimmed) {
      throw new Error("Please enter a description.");
    }

    setStatus("generating");
    setError(null);

    try {
      const response = await engine.chat.completions.create({
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: trimmed },
        ],
        temperature: 0.1,
        max_tokens: 256,
      });

      const raw = response.choices[0]?.message?.content ?? "";
      const validated = validateQuery(raw);

      if (!validated.ok) {
        throw new Error(validated.error);
      }

      setStatus("ready");
      return validated.query;
    } catch (err) {
      setStatus("ready");
      throw err instanceof Error ? err : new Error("Failed to generate query.");
    }
  }, [status]);

  return {
    status,
    loadProgress,
    loadText,
    error,
    isWebGPUSupported,
    generateQuery,
    retryLoad: () => {
      void loadEngine();
    },
  };
}
