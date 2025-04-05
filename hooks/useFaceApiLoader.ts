// hooks/useFaceApiLoader.ts
import { useState, useEffect } from "react";
import { loadModels, areModelsLoaded } from "@/lib/face-api-utils";

type LoadingState = "idle" | "loading" | "loaded" | "error";

export const useFaceApiLoader = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>(
    areModelsLoaded() ? "loaded" : "idle"
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only attempt to load if models aren't already loaded and we haven't started loading yet
    if (!areModelsLoaded() && loadingState === "idle") {
      setLoadingState("loading");
      setError(null);
      loadModels()
        .then(() => {
          setLoadingState("loaded");
        })
        .catch((err: any) => {
          console.error("Hook: Error loading models", err);
          setError(err.message || "Failed to load models");
          setLoadingState("error");
        });
    }
  }, [loadingState]); // Rerun effect if loadingState changes (e.g., from idle)

  return { loadingState, error };
};
