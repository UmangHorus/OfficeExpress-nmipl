// src/stores/favicon.store.js
import { create } from "zustand";

export const useFaviconStore = create((set) => ({
  faviconUrl: "/favicon.ico", // Default favicon
  isLoading: false,
  error: null,
  setFaviconUrl: (url) => set({ faviconUrl: url || "/favicon.ico" }), // Fallback to default
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) =>
    set({
      error: error
        ? {
            message: error.message || String(error),
            timestamp: Date.now(),
          }
        : null,
    }),
}));
