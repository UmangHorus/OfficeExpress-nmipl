"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLoginStore } from "@/stores/auth.store";
import SalesOrderGraph from "@/components/dashboard/SalesOrderGraph";
import DonutChartProduct from "@/components/dashboard/DonutChartProduct";
import CountReports from "@/components/dashboard/CountReports";
import DonutChartSales from "@/components/dashboard/DonutChartSales";
import DashboardService from "@/lib/DashboardService";
import RecentOrders from "@/components/dashboard/RecentOrders";
import RecentLeads from "@/components/dashboard/RecentLeads";
import TimelineLayout from "@/components/timeline-layout";

export default function DashboardPage() {
  const { isAuthenticated, token, user, navConfig } = useLoginStore();
  const leadLabel = navConfig?.labels?.leads || "Lead";
  const orderLabel = navConfig?.labels?.orders || "Order";
  const [selectedDashboard, setSelectedDashboard] = useState("lead");

  // Helper function for pluralization
  const pluralize = (word) => {
    if (word.toLowerCase() === "inquiry") {
      return "Inquiries";
    }
    if (word.toLowerCase().endsWith("y") && !/[aeiou]y$/i.test(word)) {
      return word.slice(0, -1) + "ies";
    }
    return word + "s";
  };

  // Determine dashboard type and title
  const showBothDashboards =
    navConfig?.permissions?.showLeads && navConfig?.permissions?.showOrders;
  const dashboardType = showBothDashboards
    ? selectedDashboard
    : navConfig?.permissions?.showLeads
    ? "lead"
    : navConfig?.permissions?.showOrders
    ? "sales"
    : "lead";
  const dashboardTitle =
    dashboardType === "lead"
      ? `${leadLabel} Dashboard`
      : `${orderLabel} Dashboard`;

  // Fetch dashboard data using useQuery
  const { data, error, isLoading } = useQuery({
    queryKey: ["dashboardData", token, user?.id],
    queryFn: () => DashboardService.getDashboardData(token, user?.id),
    enabled: !!isAuthenticated && !!token && !!user?.id,
    refetchOnMount: "always",
    staleTime: 0,
    cacheTime: 0,
  });

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading dashboard data: {error?.message}
      </div>
    );
  }

  // Merge common fields (years, contact) with dashboard-specific data
  const dashboardData = {
    ...(dashboardType == "lead" ? data?.DATA?.["7"] : data?.DATA?.["21"]),
    years: data?.DATA?.years,
    contact: data?.DATA?.contact,
    timestamp: data?.DATA?.timestamp,
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">{dashboardTitle}</h1>
        {showBothDashboards && (
          <div className="flex items-center gap-2 px-4">
            <select
              id="dashboardType"
              value={selectedDashboard}
              onChange={(e) => setSelectedDashboard(e.target.value)}
              className="border rounded p-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
            >
              <option value="lead">{leadLabel} Dashboard</option>
              <option value="sales">{orderLabel} Dashboard</option>
            </select>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SalesOrderGraph
          dashboardData={dashboardData}
          dashboardType={dashboardType}
        />
        <CountReports
          dashboardData={dashboardData}
          dashboardType={dashboardType}
        />
        <DonutChartProduct
          dashboardData={dashboardData}
          dashboardType={dashboardType}
        />
        <DonutChartSales
          dashboardData={dashboardData}
          dashboardType={dashboardType}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        {dashboardType === "lead" ? <RecentLeads /> : <RecentOrders />}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <TimelineLayout />
        </div>
      </div>
    </div>
  );
}
