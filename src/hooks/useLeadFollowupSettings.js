import { useQuery } from "@tanstack/react-query";
import { ContactService } from "@/lib/ContactService";
import { useSharedDataStore } from "@/stores/sharedData.store";
import { useLoginStore } from "@/stores/auth.store";

export const useLeadFollowupSettings = () => {
  const { token } = useLoginStore();
  const { myLeadFollowupSettings, setMyLeadFollowupSettings } = useSharedDataStore();

  return useQuery({
    queryKey: ["leadFollowupSettings", token],
    queryFn: async () => {
      setMyLeadFollowupSettings(null, true, null); // Set loading to true
      try {
        const response = await ContactService.getLeadFollowupSettings(token);

        if (response[0]?.STATUS !== "SUCCESS") {
          throw new Error(response[0]?.MSG || "Failed to fetch lead followup settings");
        }

        const data = response[0]?.DATA || {
          lead_followups: [],
          lead_outcomes: [],
        };

        setMyLeadFollowupSettings(data, false, null);
        return data;
      } catch (error) {
        console.error("Error fetching lead followup settings:", {
          message: error.message,
          response: error.response?.data,
        });
        setMyLeadFollowupSettings(null, false, error.message);
        throw error; // Re-throw for React Query
      }
    },
    enabled: !!token && myLeadFollowupSettings === null,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours cache
    retry: 2,
    refetchOnWindowFocus: false,
  });
};