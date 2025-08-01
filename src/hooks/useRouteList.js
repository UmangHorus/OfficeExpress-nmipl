// src/hooks/useRouteList.js
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api/axios";
import { useSharedDataStore } from "@/stores/sharedData.store";
import { useLoginStore } from "@/stores/auth.store";

export const useRouteList = () => {
  const { setRouteList } = useSharedDataStore();
  const { user, token } = useLoginStore();

  return useQuery({
    queryKey: ["routeList"],
    queryFn: async () => {
      try {
        const response = await api.post(
          "/expo_access_api/route_list/",
          {
            AUTHORIZEKEY: process.env.NEXT_PUBLIC_API_AUTH_KEY,
            PHPTOKEN: token,
            employee_id: user?.id
          },
          { timeout: 5000 }
        );

        if (response.data[0]?.STATUS !== "SUCCESS") {
          throw new Error(response.data?.MESSAGE || "Failed to fetch route list");
        }

        const routeListData = response.data[0]?.DATA?.routelist_arr || [];
        setRouteList(routeListData);
        
        return routeListData;
      } catch (error) {
        throw error;
      }
    },
    enabled: !!token && !!user?.id,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
};