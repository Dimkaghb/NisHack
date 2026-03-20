"use client";

import { useQuery } from "@tanstack/react-query";
import { pollSearch } from "@/lib/api";
import { useLocationIQStore } from "@/store/useLocationIQStore";
import { useEffect } from "react";

const TERMINAL_STATUSES = new Set(["complete", "failed"]);

export function useSearchPolling() {
  const sessionId = useLocationIQStore((s) => s.sessionId);
  const appState = useLocationIQStore((s) => s.appState);
  const setAppState = useLocationIQStore((s) => s.setAppState);
  const setListings = useLocationIQStore((s) => s.setListings);
  const setPipelineStatus = useLocationIQStore((s) => s.setPipelineStatus);
  const setExplanation = useLocationIQStore((s) => s.setExplanation);

  const isPolling = appState === "loading" && sessionId !== null;

  const query = useQuery({
    queryKey: ["search-poll", sessionId],
    queryFn: () => pollSearch(sessionId!),
    enabled: isPolling,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 2000;
      return TERMINAL_STATUSES.has(data.status) ? false : 2000;
    },
    retry: 2,
  });

  useEffect(() => {
    if (!query.data) return;

    const { status, results, explanation } = query.data;
    setPipelineStatus(status);

    if (status === "complete") {
      if (results && results.length > 0) {
        setListings(results);
      }
      if (explanation) setExplanation(explanation);
      // Small delay for "preparing results" transition
      setTimeout(() => setAppState("results"), 1200);
    } else if (status === "failed") {
      setAppState("idle");
    }
  }, [query.data, setPipelineStatus, setListings, setAppState, setExplanation]);

  return query;
}
