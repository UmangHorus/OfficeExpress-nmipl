// src/hooks/useFavicon.js
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useFaviconStore } from "@/stores/favicon.store";
import { useEffect } from "react";
import api from "@/lib/api/axios";

const getCompanyIdentifier = () => {
  if (typeof window === "undefined") return null;

  const host = window.location.hostname;

  if (host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return "default";
  }

  if (host.endsWith("ondemandcrm.co")) {
    return host.split(".")[0];
  }

  return host.replace(/\..+$/, "");
};

export const useFavicon = () => {
  const { setFaviconUrl, setIsLoading, setError } = useFaviconStore();
  const companyIdentifier = getCompanyIdentifier();
  const query = useQuery({
    queryKey: ["favicon", companyIdentifier],
    queryFn: async () => {
      if (!companyIdentifier) {
        setFaviconUrl("/favicon.ico");
        return null;
      }
      setIsLoading(true);
      try {
        const response = await api.post(
          "/expo_access_api/getCompanyFavicon",
          { AUTHORIZEKEY: process.env.NEXT_PUBLIC_API_AUTH_KEY },
          {
            timeout: 3000,
          }
        );

        if (response.data?.STATUS === "SUCCESS" && response.data?.DATA) {
          setFaviconUrl(response.data.DATA);
          return response.data.DATA;
        }

        setFaviconUrl("/favicon.ico");
        return null;
      } catch (error) {
        console.error("API Error:", error);
        setError(error.message);
        setFaviconUrl("/favicon.ico");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    enabled: !!companyIdentifier && typeof window !== "undefined",
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });

  useEffect(() => {}, [query.status, query.data]);

  return query;
};
