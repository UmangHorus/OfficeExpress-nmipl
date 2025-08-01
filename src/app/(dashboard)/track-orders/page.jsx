// src/app/(dashboard)/track-orders/page.jsx

import OrderTable from "@/components/orders/OrderTable";


const TrackOrdersPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-6">Track Orders</h1>

      <OrderTable />
    </div>
  );
};

export default TrackOrdersPage;
