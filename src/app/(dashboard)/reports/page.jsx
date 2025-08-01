// src/app/(dashboard)/track-orders/page.jsx

import AttendanceReport from "@/components/reports/AttendanceReport";

const ReportsPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-6">Reports</h1>
      <AttendanceReport />
    </div>
  );
};

export default ReportsPage;
