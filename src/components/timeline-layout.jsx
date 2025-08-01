"use client";

import {
  Timeline,
  TimelineItem,
  TimelineTitle,
  TimelineDescription,
  TimelineTime,
  TimelineHeader,
} from "@/components/timeline";
import { useState, useEffect } from "react";
import api from "@/lib/api/axios";
import { useLoginStore } from "@/stores/auth.store";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import OrderService from "@/lib/OrderService";

export const TimelineLayout = () => {
  const { token, user, appConfig } = useLoginStore();
  const [selectedEmployee, setSelectedEmployee] = useState(
    user?.employee_id || ""
  );
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [employees, setEmployees] = useState([]);
  const [timelineData, setTimelineData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const AUTHORIZE_KEY = process.env.NEXT_PUBLIC_API_AUTH_KEY;

  // Fetch company, branch, and division data
  const {
    data: companyData,
    error: companyError,
    isLoading: companyLoading,
  } = useQuery({
    queryKey: ["companyBranchDivisionData", user?.id, token],
    queryFn: () => OrderService.getCompanyBranchDivisionData(token, user?.id),
    enabled: !!user?.id && !!token,
    refetchOnMount: "always",
    staleTime: 0,
    cacheTime: 0,
  });

  // Process company data to set employees
  useEffect(() => {
    if (companyData) {
      const responseData = Array.isArray(companyData)
        ? companyData[0]
        : companyData;
      if (responseData?.STATUS === "SUCCESS" && responseData.DATA?.employee) {
        setEmployees(responseData.DATA.employee);
      } else {
        // setError(responseData?.MSG || "Invalid company response data");
        // toast.error(responseData?.MSG || "Invalid company response data");
        console.error(responseData?.MSG || "Invalid company response data");
      }
    }
    if (companyError) {
      // setError(companyError.message || "Error fetching company data");
      // toast.error(companyError.message || "Error fetching company data");
      console.error(companyError.message || "Error fetching company data");
    }
    setLoading(companyLoading);
  }, [companyData, companyError, companyLoading]);

  useEffect(() => {
    setSelectedEmployee(user?.id);
  }, [user?.id]);

  // Fetch timeline data
  const fetchTimelineData = async (employeeId, selectedDate) => {
    if (!employeeId || !selectedDate || !token || !AUTHORIZE_KEY) {
      setTimelineData([]);
      setError("Missing required parameters or authentication credentials");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [year, month, day] = selectedDate.split("-");
      const formattedDate = `${day}-${month}-${year}`;

      const formData = new FormData();
      formData.append("AUTHORIZEKEY", AUTHORIZE_KEY);
      formData.append("PHPTOKEN", token);
      formData.append("employee_id", employeeId);
      formData.append("employee_id", selectedEmployee);
      formData.append("activity_date", formattedDate);

      const response = await api.post(
        "/expo_access_api/getTimelineLog",
        formData
      );
      const data = response.data;

      if (data.STATUS === "SUCCESS" && data.DATA) {
        setTimelineData(data.DATA);
      } else {
        setTimelineData([]);
        setError(data.MSG || "No timeline data found");
      }
    } catch (err) {
      setTimelineData([]);
      setError(
        err.response?.data?.MSG || err.message || "Error fetching timeline data"
      );
      console.error("Timeline Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger timeline data fetch when selectedEmployee, selectedDate, or token changes
  useEffect(() => {
    if (selectedEmployee) {
      fetchTimelineData(selectedEmployee, selectedDate);
    }
  }, [selectedEmployee, selectedDate, token]);

  const handleEmployeeChange = (event) => {
    const newEmployeeId = event.target.value;
    setSelectedEmployee(newEmployeeId);
  };

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
  };

  return (
    <div className="bg-white rounded-lg">
      {/* Filters Section */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:space-x-4">
        <div className="mb-4 sm:mb-0">
          <label
            htmlFor="employee-select"
            className="mr-2 text-sm font-medium text-gray-700"
          >
            Employee:
          </label>
          <select
            id="employee-select"
            value={selectedEmployee}
            onChange={handleEmployeeChange}
            disabled={loading}
            className="rounded-md border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 w-full"
          >
            <option value={user?.id}>Select Employee</option>
            {employees.map((employee) => (
              <option key={employee.employee_id} value={employee.employee_id}>
                {employee.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="date-picker"
            className="mr-2 text-sm font-medium text-gray-700"
          >
            Date:
          </label>
          <input
            id="date-picker"
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="rounded-md border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
          />
        </div>
      </div>

      {/* Loading and Error Messages */}
      {loading && <div className="mb-4 text-gray-600 text-sm">Loading...</div>}
      {/* {error && <div className="mb-4 text-red-600 text-sm">{error}</div>} */}

      {/* Timeline */}
      {timelineData.length > 0 ? (
        <Timeline className="mt-4 timeline-main-div">
          {timelineData.map((item) => (
            <TimelineItem key={item.id}>
              <TimelineHeader>
                <TimelineTime>{item.time}</TimelineTime>
                <TimelineTitle>{item.title}</TimelineTitle>
              </TimelineHeader>
              {item.description && (
                <TimelineDescription>{item.description}</TimelineDescription>
              )}
            </TimelineItem>
          ))}
        </Timeline>
      ) : (
        !loading &&
        !error &&
        selectedEmployee &&
        selectedDate && (
          <div className="text-gray-600 text-sm">
            No timeline data available for the selected employee and date.
          </div>
        )
      )}
    </div>
  );
};

export default TimelineLayout;
