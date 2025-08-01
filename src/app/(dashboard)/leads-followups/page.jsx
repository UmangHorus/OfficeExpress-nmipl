"use client";

import LeadFollowup from "@/components/followups/LeadFollowup";
import { useLoginStore } from "@/stores/auth.store";

const LeadFollowupsPage = () => {
  const { navConfig = {} } = useLoginStore();
  const { labels = {} } = navConfig;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-6">
        {`${labels.leads || "Leads"} Followups`}
      </h1>
      <LeadFollowup />
    </div>
  );
};

export default LeadFollowupsPage;
