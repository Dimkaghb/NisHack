"use client";

import { create } from "zustand";
import type {
  AppState,
  BusinessType,
  ScoredListing,
  ContactResponse,
} from "@/types";

interface LocationIQStore {
  appState: AppState;
  setAppState: (s: AppState) => void;

  sessionId: string | null;
  setSessionId: (id: string | null) => void;

  businessType: BusinessType | null;
  district: string | null;
  budgetTenge: number;
  areaSqmMin: number;
  competitorTolerance: number;
  setBusinessType: (t: BusinessType) => void;
  setDistrict: (d: string | null) => void;
  setBudget: (b: number) => void;
  setArea: (a: number) => void;
  setCompetitorTolerance: (n: number) => void;

  listings: ScoredListing[];
  setListings: (l: ScoredListing[]) => void;
  activeListingId: string | null;
  setActiveListingId: (id: string | null) => void;
  expandedListingId: string | null;
  setExpandedListingId: (id: string | null) => void;

  contactDraft: ContactResponse | null;
  setContactDraft: (d: ContactResponse | null) => void;

  pipelineStatus: string | null;
  setPipelineStatus: (s: string | null) => void;

  // Last searched params (to detect stale results)
  lastSearchedParams: string | null;
  setLastSearchedParams: (p: string | null) => void;

  resetSearch: () => void;
}

export const useLocationIQStore = create<LocationIQStore>((set) => ({
  appState: "idle",
  setAppState: (s) => set({ appState: s }),

  sessionId: null,
  setSessionId: (id) => set({ sessionId: id }),

  businessType: null,
  district: null,
  budgetTenge: 500000,
  areaSqmMin: 50,
  competitorTolerance: 3,
  setBusinessType: (t) => set({ businessType: t }),
  setDistrict: (d) => set({ district: d }),
  setBudget: (b) => set({ budgetTenge: b }),
  setArea: (a) => set({ areaSqmMin: a }),
  setCompetitorTolerance: (n) => set({ competitorTolerance: n }),

  listings: [],
  setListings: (l) => set({ listings: l }),
  activeListingId: null,
  setActiveListingId: (id) => set({ activeListingId: id }),
  expandedListingId: null,
  setExpandedListingId: (id) => set({ expandedListingId: id }),

  contactDraft: null,
  setContactDraft: (d) => set({ contactDraft: d }),

  pipelineStatus: null,
  setPipelineStatus: (s) => set({ pipelineStatus: s }),

  lastSearchedParams: null,
  setLastSearchedParams: (p) => set({ lastSearchedParams: p }),

  resetSearch: () =>
    set({
      sessionId: null,
      listings: [],
      activeListingId: null,
      expandedListingId: null,
      contactDraft: null,
      pipelineStatus: null,
      appState: "idle",
      lastSearchedParams: null,
    }),
}));
