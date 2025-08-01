// src/app/(dashboard)/track-orders/page.jsx

import LeadTable from "@/components/lead/LeadTable";

const TrackLeadsPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-6">Track Leads</h1>
      <LeadTable />
    </div>
  );
};

export default TrackLeadsPage;
