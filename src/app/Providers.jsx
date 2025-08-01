// src/app/Providers.jsx
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import FaviconUpdater from "@/components/dashboard/FaviconUpdater";
// import BasicSettingsInitializer from "./BasicSettingsInitializer";
import { useLoginStore } from "@/stores/auth.store";
import BasicSettingsInitializer from "./BasicSettingsInitializer";
// import PunchStatusInitializer from "./PunchStatusInitializer";

export function Providers({ children }) {
  const { isAuthenticated } = useLoginStore();

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 5 * 60 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <FaviconUpdater /> {/* This is critical */}
      {/* {isAuthenticated && <BasicSettingsInitializer />}
      {isAuthenticated && <PunchStatusInitializer />} */}
      <BasicSettingsInitializer />
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
