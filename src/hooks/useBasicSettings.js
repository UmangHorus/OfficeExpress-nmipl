import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api/axios";
import useBasicSettingsStore from "@/stores/basicSettings.store";

export const useBasicSettings = () => {
  const { countries, setBasicSettings, setLoading, setError } =
    useBasicSettingsStore();

  return useQuery({
    queryKey: ["basicSettings"],
    queryFn: async () => {
      setLoading(true);
      try {
        const response = await api.post(
          "/expo_access_api/getBasicSettings/",
          { AUTHORIZEKEY: process.env.NEXT_PUBLIC_API_AUTH_KEY },
          { timeout: 5000 }
        );

        if (response.data[0]?.STATUS !== "SUCCESS") {
          throw new Error(response.data?.MESSAGE || "Failed to fetch settings");
        }

        const data = {
          countries: response.data[0]?.DATA?.country || [],
          titles: response.data[0]?.DATA?.titles_data || [],
          maincompany_id: response.data[0]?.DATA?.company_id || "",
          maincompanyname: response.data[0]?.DATA?.company_name || "",
          mainbranch_id: response.data[0]?.DATA?.branch_id || "",
          mainbranchname: response.data[0]?.DATA?.branch_name || "",
        };

        setBasicSettings(data);
        return data;
      } catch (error) {
        setError(error.message);
        throw error; // Re-throw for React Query to handle
      } finally {
        setLoading(false);
      }
    },
    enabled: countries.length === 0, // Only fetch if no data exists
    staleTime: 24 * 60 * 60 * 1000, // 24 hours cache
    retry: 2,
    refetchOnWindowFocus: false,
  });
};
