// store/globalFundStore.ts
import { create } from "zustand";

interface GlobalFundState {
  globalFund: number | null;
  isLoading: boolean;
  setGlobalFund: (amount: number) => void;
  fetchGlobalFund: () => Promise<void>;
}

export const useGlobalFundStore = create<GlobalFundState>((set) => ({
  globalFund: null,
  isLoading: false,

  setGlobalFund: (amount) => {
    console.log("GlobalFundStore: Setting fund to", amount);
    set({ globalFund: amount });
  },

  fetchGlobalFund: async () => {
    try {
      set({ isLoading: true });
      console.log("GlobalFundStore: Fetching global fund data");

      const response = await fetch("/api/global-fund");
      if (!response.ok) {
        throw new Error("Failed to fetch global fund data");
      }

      const data = await response.json();
      set({ globalFund: data.totalFund, isLoading: false });
      console.log("GlobalFundStore: Updated global fund to", data.totalFund);

      return data.totalFund;
    } catch (error) {
      console.error("GlobalFundStore: Error fetching global fund:", error);
      set({ isLoading: false });
      return null;
    }
  },
}));
