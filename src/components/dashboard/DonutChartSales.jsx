"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useLoginStore } from "@/stores/auth.store";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function DonutChartSales({ dashboardData, dashboardType }) {
  const { isAuthenticated, navConfig } = useLoginStore();
  const leadLabel = navConfig?.labels?.leads || "Lead";
  const orderLabel = navConfig?.labels?.orders || "Order";

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

  const [chartData, setChartData] = useState({
    series: [],
    options: {
      chart: {
        type: "donut",
        width: "100%",
        height: 400,
      },
      labels: [],
      legend: {
        show: false,
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: "100%",
              height: 300,
            },
          },
        },
      ],
      tooltip: {
        y: {
          formatter: function (val) {
            return dashboardType === "lead"
              ? `${val} Won ${pluralize(leadLabel).toLowerCase()}`
              : `${val} ${pluralize(orderLabel).toLowerCase()}`;
          },
        },
      },
      plotOptions: {
        donut: {
          size: "70%",
        },
      },
    },
  });

  const [selectedPeriod, setSelectedPeriod] = useState("last_7_days");
  const periods = [
    { value: "last_7_days", label: "Last 7 Days" },
    { value: "last_month", label: "Last Month" },
    { value: "last_3_months", label: "Last 3 Months" },
    { value: "last_6_months", label: "Last 6 Months" },
    { value: "last_year", label: "Last Year" },
  ];

  useEffect(() => {
    if (dashboardData) {
      const dataKey =
        dashboardType === "lead" ? "topSellersLead" : "top_seller";
      const topSellers = dashboardData?.[dataKey]?.[selectedPeriod] || [];
      const series = topSellers.map((seller) => seller?.total_orders || 0);
      const labels = topSellers.map((seller) => seller?.seller_name || "");

      setChartData((prev) => ({
        ...prev,
        series,
        options: {
          ...prev.options,
          labels,
          tooltip: {
            y: {
              formatter: function (val) {
                return dashboardType === "lead"
                  ? `${val} Won ${pluralize(leadLabel).toLowerCase()}`
                  : `${val} ${pluralize(orderLabel).toLowerCase()}`;
              },
            },
          },
        },
      }));
    } else {
      setChartData((prev) => ({
        ...prev,
        series: [],
        options: {
          ...prev.options,
          labels: [],
        },
      }));
    }
  }, [dashboardData, selectedPeriod, dashboardType, leadLabel, orderLabel]);

  const chartKey = `${selectedPeriod}-${chartData.series.join("-")}`;

  // if (!isAuthenticated) {
  //   return (
  //     <div className="p-4 text-red-500">
  //       Please log in to view the sales chart.
  //     </div>
  //   );
  // }

  if (!dashboardData) {
    return (
      <div className="p-4 text-red-500">
        No data available for the sales chart.
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold">Most Active Sales Executives</h2>
        <div className="flex items-center gap-2">
          <label
            htmlFor="donutPeriod"
            className="font-medium whitespace-nowrap text-sm sm:text-base"
          >
            Period:
          </label>
          <select
            id="donutPeriod"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base min-w-[140px]"
          >
            {periods.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div id="donut-chart" className="mt-2">
        {chartData.series.length > 0 ? (
          <ReactApexChart
            key={chartKey}
            options={chartData.options}
            series={chartData.series}
            type="donut"
            height={350}
            className="donut-chart-dashboard"
          />
        ) : (
          <div className="flex items-center justify-center p-8 text-gray-500 h-[350px] border border-dashed rounded-lg">
            No seller data available for the selected period.
          </div>
        )}
      </div>
    </div>
  );
}
