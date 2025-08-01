"use client";
import { useLoginStore } from "@/stores/auth.store";
import {
  Users,
  UserCheck,
  Package,
  ShoppingBag,
  Clock,
  CheckCircle,
  CalendarCheck,
  CalendarClock,
  Calendar,
} from "lucide-react";

export default function CountReports({ dashboardData, dashboardType }) {
  const { navConfig } = useLoginStore();
  const leadLabel = navConfig?.labels?.leads || "Lead";
  const contactLabel = navConfig?.labels?.contacts || "Contact";
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

  // Get current financial year
  const getFinancialYear = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-11
    return month >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  };

  if (!dashboardData) {
    return (
      <div className="p-4 text-red-500">
        No data available for the count reports.
      </div>
    );
  }

  // Color classes configuration
  const colorClasses = {
    blue: {
      bg: "bg-blue-100",
      lightBg: "bg-blue-50",
      border: "border-blue-500",
      iconBg: "bg-blue-500",
      textColor: "text-blue-500",
    },
    green: {
      bg: "bg-green-100",
      lightBg: "bg-green-50",
      border: "border-green-500",
      iconBg: "bg-green-500",
      textColor: "text-green-500",
    },
    teal: {
      bg: "bg-teal-100",
      lightBg: "bg-teal-50",
      border: "border-teal-500",
      iconBg: "bg-teal-500",
      textColor: "text-teal-500",
    },
    red: {
      bg: "bg-red-100",
      lightBg: "bg-red-50",
      border: "border-red-500",
      iconBg: "bg-red-500",
      textColor: "text-red-500",
    },
    orange: {
      bg: "bg-orange-100",
      lightBg: "bg-orange-50",
      border: "border-orange-500",
      iconBg: "bg-orange-500",
      textColor: "text-orange-500",
    },
    purple: {
      bg: "bg-purple-100",
      lightBg: "bg-purple-50",
      border: "border-purple-500",
      iconBg: "bg-purple-500",
      textColor: "text-purple-500",
    },
    indigo: {
      bg: "bg-indigo-100",
      lightBg: "bg-indigo-50",
      border: "border-indigo-500",
      iconBg: "bg-indigo-500",
      textColor: "text-indigo-500",
    },
    amber: {
      bg: "bg-amber-100",
      lightBg: "bg-amber-50",
      border: "border-amber-500",
      iconBg: "bg-amber-500",
      textColor: "text-amber-500",
    },
  };

  // Month name mapping
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Date Badge Component
  const DateBadge = ({ color, dateText }) => (
    <div
      className={`absolute right-2 top-2 flex gap-2 rounded-full px-2 py-1 text-sm font-medium text-gray-800 ${colorClasses[color].lightBg}`}
    >
      <Calendar className={`h-4 w-4 ${colorClasses[color].textColor}`} />
      {dateText}
    </div>
  );

  // Box component to avoid repetition
  const StatBox = ({
    title,
    value,
    icon: Icon,
    color = "blue",
    showCondition = true,
  }) => {
    if (!showCondition) return null;

    return (
      <div className="relative flex h-full flex-col justify-between rounded-[12px] border border-[#DBE0E5] bg-white p-4 shadow-[0_8px_24px_0_rgba(27,46,94,0.12)]">
        <div className="mb-2 flex items-center">
          <div
            className={`mr-2 rounded-full border border-opacity-10 p-2 ${colorClasses[color].border} ${colorClasses[color].bg}`}
          >
            <div
              className={`${colorClasses[color].iconBg} flex h-10 w-10 items-center justify-center rounded-full`}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-800">{title}</p>
          <p className={`count-label ${colorClasses[color].textColor}`}>
            {value}
          </p>
        </div>
        {/* Badges for month or financial year */}
        {title.includes(`New ${pluralize(leadLabel)}`) &&
          dashboardData?.timestamp && (
            <DateBadge
              color={color}
              dateText={monthNames[parseInt(dashboardData.timestamp.month) - 1]}
            />
          )}
        {title.includes(`Lost ${pluralize(leadLabel)}`) &&
          dashboardData?.timestamp && (
            <DateBadge
              color={color}
              dateText={monthNames[parseInt(dashboardData.timestamp.month) - 1]}
            />
          )}
        {title.includes(`Won ${pluralize(leadLabel)}`) &&
          dashboardData?.timestamp && (
            <DateBadge
              color={color}
              dateText={monthNames[parseInt(dashboardData.timestamp.month) - 1]}
            />
          )}
        {title.includes(`Total ${pluralize(leadLabel)}`) &&
          dashboardData?.years && (
            <DateBadge color={color} dateText={getFinancialYear()} />
          )}
        {title.includes(`New ${pluralize(orderLabel)}`) &&
          dashboardData?.timestamp && (
            <DateBadge
              color={color}
              dateText={monthNames[parseInt(dashboardData.timestamp.month) - 1]}
            />
          )}
        {title.includes(`Pending ${pluralize(orderLabel)}`) &&
          dashboardData?.timestamp && (
            <DateBadge
              color={color}
              dateText={monthNames[parseInt(dashboardData.timestamp.month) - 1]}
            />
          )}
        {title.includes(`Completed ${pluralize(orderLabel)}`) &&
          dashboardData?.timestamp && (
            <DateBadge
              color={color}
              dateText={monthNames[parseInt(dashboardData.timestamp.month) - 1]}
            />
          )}
        {title.includes(`Total ${pluralize(orderLabel)}`) &&
          dashboardData?.years && (
            <DateBadge color={color} dateText={getFinancialYear()} />
          )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl grid">
      {dashboardType === "lead" ? (
        <>
          {/* Lead Dashboard Layout */}
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <StatBox
              title={`Total ${pluralize(contactLabel)}`}
              value={dashboardData?.contact?.contact}
              icon={Users}
              color="blue"
            />
            <StatBox
              title={`Total Raw ${pluralize(contactLabel)}`}
              value={dashboardData?.contact?.raw_contact}
              icon={Clock}
              color="green"
            />
          </div>
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatBox
              title={`New ${pluralize(leadLabel)}`}
              value={dashboardData?.new_lead}
              icon={UserCheck}
              color="teal"
            />
            <StatBox
              title={`Total ${pluralize(leadLabel)}`}
              value={dashboardData?.total_lead_financial}
              icon={Package}
              color="red"
            />
            <StatBox
              title={`Won ${pluralize(leadLabel)}`}
              value={dashboardData?.won_lead}
              icon={ShoppingBag}
              color="orange"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatBox
              title={`Lost ${pluralize(leadLabel)}`}
              value={dashboardData?.lost_lead}
              icon={CheckCircle}
              color="purple"
            />
            <StatBox
              title="Total Lead Followup Done"
              value={dashboardData?.done_lead_followup}
              icon={CalendarCheck}
              color="indigo"
            />
            <StatBox
              title="Total Pending Followup"
              value={dashboardData?.pending_lead_followup}
              icon={CalendarClock}
              color="amber"
            />
          </div>
        </>
      ) : (
        <>
          {/* Sales Dashboard Layout */}
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <StatBox
              title={`Total ${pluralize(contactLabel)}`}
              value={dashboardData?.contact?.contact}
              icon={Users}
              color="blue"
            />
            <StatBox
              title={`Active ${pluralize(contactLabel)}`}
              value={dashboardData?.active_contact}
              icon={UserCheck}
              color="teal"
            />
          </div>
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <StatBox
              title="Total Products"
              value={dashboardData?.products}
              icon={Package}
              color="red"
            />
            <StatBox
              title={`New ${pluralize(orderLabel)}`}
              value={dashboardData?.new_order}
              icon={ShoppingBag}
              color="orange"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <StatBox
              title={`Pending ${pluralize(orderLabel)}`}
              value={dashboardData?.so_pending}
              icon={Clock}
              color="green"
            />
            <StatBox
              title={`Completed ${pluralize(orderLabel)}`}
              value={dashboardData?.so_accept}
              icon={CheckCircle}
              color="purple"
            />
          </div>
        </>
      )}
    </div>
  );
}
