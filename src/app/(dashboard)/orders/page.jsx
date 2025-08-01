"use client";
import OrderTable from "@/components/orders/OrderTable";
import { useLoginStore } from "@/stores/auth.store";
const TrackOrdersPage = () => {
  const ordersLabel = useLoginStore(
    (state) => state.navConfig?.labels?.orders || "Sales Order"
  );
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-6">{ordersLabel}</h1>
      <OrderTable />
    </div>
  );
};

export default TrackOrdersPage;
