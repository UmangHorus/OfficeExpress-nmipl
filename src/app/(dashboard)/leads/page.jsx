"use client";

import LeadTable from "@/components/lead/LeadTable";
import { Triangle } from "lucide-react";
import { useLoginStore } from "@/stores/auth.store";
import { leadMetadata } from "@/app/metadata";

const TrackLeadsPage = () => {
  // Get the lead label from Zustand store
  const leadLabel = useLoginStore(
    (state) => state.navConfig?.labels?.leads || "Lead"
  );

  return (
    <div className="space-y-6">
      {/* <h1 className="text-lg font-semibold text-[#4a5a6b] flex items-center gap-2">
        <Triangle />
        {`${leadLabel}`}
      </h1> */}
       <h1 className="text-2xl font-bold mb-6">{leadLabel}</h1>
      <LeadTable />
    </div>
  );
};

export default TrackLeadsPage;
