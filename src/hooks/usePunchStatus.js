import { punchService } from "@/lib/punchService";
import { usePunchStore } from "@/stores/punch.store";
import { useQuery } from "@tanstack/react-query";

export const usePunchStatus = (attrId) => {
  const {
    setEmpInTime,
    setEmpOutTime,
    setPunchOut,
    setBreakIn,
    setPunchIn,
    setBreakOut,
    setBreakId,
  } = usePunchStore();

  return useQuery({
    queryKey: ["punchStatus", attrId],
    queryFn: async () => {
      if (!attrId) {
        throw new Error("Attribute ID is required");
      }

      const response = await punchService.getBreakOutIDByAttrID(attrId);

      if (response && response[0]?.STATUS !== "SUCCESS") {
        throw new Error(response[0]?.MESSAGE || "Failed to fetch punch status");
      }

      const { emp_breakid, emp_in_time, emp_out_time } = response[0]?.DATA || {};
      setEmpInTime(emp_in_time);
      setEmpOutTime(emp_out_time);

      if (emp_breakid > 0 && emp_in_time && !emp_out_time) {
        setPunchOut(true);
        setBreakIn(false);
        setPunchIn(false);
        setBreakOut(true);
        setBreakId(emp_breakid);
      } else if (!emp_breakid && emp_in_time && !emp_out_time) {
        setPunchOut(true);
        setBreakIn(true);
        setPunchIn(false);
        setBreakOut(false);
      } else if (!emp_breakid && emp_in_time && emp_out_time) {
        setPunchOut(false);
        setBreakIn(false);
        setPunchIn(true);
        setBreakOut(false);
      }

      return response[0]?.DATA;
    },
    enabled: !!attrId, // Only fetch if attrId exists
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 2,
    refetchOnWindowFocus: false,
  });
};