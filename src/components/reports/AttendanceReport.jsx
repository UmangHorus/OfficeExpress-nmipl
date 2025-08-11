"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ArrowUpDown, MapPin } from "lucide-react";
import { toast } from "sonner";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import { useLoginStore } from "@/stores/auth.store";
import { format, parse } from "date-fns";
import { punchService } from "@/lib/punchService";
import { useSharedDataStore } from "@/stores/sharedData.store";
import OrderService from "@/lib/OrderService";

const formatDateToDDMMYYYY = (dateStr) => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}-${month}-${year}`;
};

const AttendanceReport = () => {
  const { user, token, appConfig } = useLoginStore();
  const loggedInUserId = user?.id;
  const [companyConfigData, setCompanyConfigData] = useState(null);
  const [data, setData] = useState([]);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({ id: false });
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [startDateInput, setStartDateInput] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [endDateInput, setEndDateInput] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [isRefetching, setIsRefetching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTrigger, setSearchTrigger] = useState(0);
  const isAdmin = appConfig?.main_admin_flg || "N";
  // 3. Update your searchParams state (if not already done)
  const [searchParams, setSearchParams] = useState({
    employeeId: loggedInUserId || "",
    search_employee_id: "0", // Default to "All Employees"
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });

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

  useEffect(() => {
    if (companyData) {
      const responseData = Array.isArray(companyData)
        ? companyData[0]
        : companyData;
      if (responseData?.STATUS === "SUCCESS") {
        setCompanyConfigData(responseData.DATA);
      } else {
        toast.error(responseData?.MSG || "Invalid company response data");
      }
    }
  }, [companyData]);

  useEffect(() => {
    // Initial fetch with default params
    if (loggedInUserId) {
      setSearchParams({
        employeeId: loggedInUserId,
        search_employee_id: "0",
        startDate: format(new Date(), "yyyy-MM-dd"),
        endDate: format(new Date(), "yyyy-MM-dd"),
      });
      setSearchTrigger(1); // Trigger initial fetch
    }
  }, [loggedInUserId]);

  const fetchAttendance = async (
    startDateStr,
    endDateStr,
    employeeId,
    searchEmployeeId
  ) => {
    if (!token) throw new Error("Authentication details missing");

    const formattedStartDate = format(
      parse(startDateStr, "yyyy-MM-dd", new Date()),
      "dd-MM-yy"
    );
    const formattedEndDate = format(
      parse(endDateStr, "yyyy-MM-dd", new Date()),
      "dd-MM-yy"
    );

    const payload = {
      is_admin: isAdmin,
      employee_id: employeeId,
      search_employee_id: searchEmployeeId, // Add to payload
      fromdt: formattedStartDate,
      todt: formattedEndDate,
    };

    const response = await punchService.getLoginHours(payload);
    return response;
  };

  // Main attendance data query
  const {
    data: attendanceData,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["attendanceReport", searchParams],
    queryFn: () =>
      fetchAttendance(
        searchParams.startDate,
        searchParams.endDate,
        searchParams.employeeId,
        searchParams.search_employee_id
      ),
    enabled: !!token && !!searchParams.employeeId,
    refetchOnMount: "always",
    staleTime: 0,
    cacheTime: 0,
  });

  // Process attendance data
  useEffect(() => {
    if (attendanceData) {
      try {
        const loginHours = attendanceData?.DATA?.login_hours || [];
        const hoursArray = Array.isArray(loginHours) ? loginHours : [];

        if (hoursArray.length > 0) {
          const formattedData = hoursArray.map((item) => ({
            id: item.id,
            userName: item.username,
            date: item.att_date.split("/").reverse().join("-"),
            loginTime: item.login_time,
            logoutTime: item.logout_time,
            loginHours: item.login_hours,
            breakHours: item.breakTime,
            visitingHours: item.visitors_hours || "00:00:00",
            workingHours: item.net_hours || "00:00:00",
            punch_in_gmapAddress: item.punch_in_gmapAddress || "",
            punch_out_gmapAddress: item.punch_out_gmapAddress || "",
          }));
          setData(formattedData);
        } else {
          setData([]);
        }
      } catch (err) {
        console.error("Failed to process attendance data:", err);
        setData([]);
        // toast.error("Failed to process attendance data: " + err.message);
      }
    }
    if (error) {
      console.error("Failed to retrieve login hours:", error.response || error);
      setData([]);
      // toast.error(
      //   `Failed to retrieve login hours: ${
      //     error.response?.data?.message || error.message
      //   }`
      // );
    }
  }, [attendanceData, error]);

  const handleExportCSV = () => {
    // Excel-compatible CSV format with BOM for UTF-8
    const BOM = "\uFEFF";
    const headers = [
      "User Name",
      "Date",
      "Login Time",
      "Logout Time",
      "Login Hours",
      "Break Hours",
      "Visiting Hours",
      "Working Hours",
      "Punch In Address",
      "Punch Out Address",
    ];

    const csvData = data.map((item) => {
      const escapeCsv = (str) => {
        if (!str) return "";
        return `"${String(str).replace(/"/g, '""')}"`;
      };

      return [
        escapeCsv(item.userName),
        escapeCsv(formatDateToDDMMYYYY(item.date)),
        escapeCsv(item.loginTime),
        escapeCsv(item.logoutTime),
        escapeCsv(item.loginHours),
        escapeCsv(item.breakHours),
        escapeCsv(item.visitingHours),
        escapeCsv(item.workingHours),
        escapeCsv(item.punch_in_gmapAddress),
        escapeCsv(item.punch_out_gmapAddress),
      ];
    });

    const csvContent =
      BOM +
      [headers.join(","), ...csvData.map((row) => row.join(","))].join("\r\n"); // \r\n for Excel compatibility

    // Download with current date in filename
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadFile(csvContent, `attendance_report_${dateStr}.csv`);
  };

  // Helper function for download (same as your example)
  const downloadFile = (content, filename) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  };

  // Helper function to format date as DD-MM-YYYY
  const formatDateToDDMMYYYY = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Search handler
  const handleDateSearch = async () => {
    try {
      const parsedStart = parse(startDateInput, "yyyy-MM-dd", new Date());
      const parsedEnd = parse(endDateInput, "yyyy-MM-dd", new Date());

      if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime())) {
        toast.error("Invalid date format. Please select a valid date.");
        return;
      }

      setIsRefetching(true);

      setSearchParams({
        employeeId: loggedInUserId,
        search_employee_id:
          selectedUser?.value == "0" ? "0" : selectedUser?.value,
        startDate: startDateInput,
        endDate: endDateInput,
      });

      setSearchTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("Search API error:", err);
      toast.error("Error during search: " + err.message);
    } finally {
      setIsRefetching(false);
    }
  };

  // Reset handler
  const handleReset = async () => {
    try {
      if (!token) {
        toast.error("Authentication details missing. Please log in again.");
        return;
      }
      const today = new Date();
      const todayStr = format(today, "yyyy-MM-dd");

      setStartDateInput(todayStr);
      setEndDateInput(todayStr);
      setGlobalFilter("");
      setSelectedUser({
        value: "0",
        label: "All Employees",
      });

      setSearchParams({
        employeeId: loggedInUserId,
        search_employee_id: "0",
        startDate: todayStr,
        endDate: todayStr,
      });

      setData([]);
      setSearchTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("Reset error:", err);
      toast.error(err.message || "Error during reset");
    } finally {
      setIsRefetching(false);
    }
  };

  // Employee selection handler
  const handleEmployeeChange = (value) => {
    if (value == "0") {
      setSelectedUser({
        value: "0",
        label: "All Employees",
      });
    } else {
      const employee = (companyConfigData?.employee || []).find(
        (emp) => emp.employee_id == value
      );
      setSelectedUser({
        value: employee?.employee_id,
        label: employee?.name,
      });
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorFn: (row) => ({
          PunchInAddress: row.punch_in_gmapAddress,
          PunchOutAddress: row.punch_out_gmapAddress,
        }),
        id: "location",
        header: () => <div className="text-center text-white">Location</div>,
        cell: ({ row }) => {
          const { PunchInAddress, PunchOutAddress } = row.getValue("location");

          const isPunchInAddressDisabled =
            !PunchInAddress || PunchInAddress.trim() === "";
          const isPunchOutAddressDisabled =
            !PunchOutAddress || PunchOutAddress.trim() === "";

          return (
            <div className="flex items-center justify-center gap-2">
              {/* Punch In Address */}
              {isPunchInAddressDisabled ? (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={true}
                  title="No punch-in address available"
                  className="cursor-not-allowed"
                >
                  <MapPin className="h-5 w-5 text-gray-500 stroke-2" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  title={`Punch In Address: ${PunchInAddress}`}
                  className="hover:bg-blue-50"
                >
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      PunchInAddress
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin className="h-5 w-5 text-blue-600 stroke-blue-600" />
                  </a>
                </Button>
              )}

              {/* Punch Out Address */}
              {isPunchOutAddressDisabled ? (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={true}
                  title="No punch-out address available"
                  className="cursor-not-allowed"
                >
                  <MapPin className="h-5 w-5 text-gray-500 stroke-2" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  title={`Punch Out Address: ${PunchOutAddress}`}
                  className="hover:bg-red-50"
                >
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      PunchOutAddress
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin className="h-5 w-5 text-orange-600 stroke-orange-600" />
                  </a>
                </Button>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "userName",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-center w-full justify-center text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            User Name
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div>{row.getValue("userName")}</div>,
      },
      {
        accessorKey: "date",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-center w-full justify-center text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            Date
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <>
            <div>{formatDateToDDMMYYYY(row.getValue("date"))}</div>
          </>
        ),
      },
      {
        accessorKey: "loginTime",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-center w-full justify-center text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            Login Time
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div>{row.getValue("loginTime")}</div>,
      },
      {
        accessorKey: "logoutTime",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-center w-full justify-center text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            Logout Time
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div>{row.getValue("logoutTime")}</div>,
      },
      {
        accessorKey: "loginHours",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-center w-full justify-center text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            Login Hours
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div>{row.getValue("loginHours")}</div>,
      },
      {
        accessorKey: "breakHours",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-center w-full justify-center text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            Break Hours
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div>{row.getValue("breakHours")}</div>,
      },
      {
        accessorKey: "visitingHours",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-center w-full justify-center text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            Visiting Hours
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div>{row.getValue("visitingHours")}</div>,
      },
      {
        accessorKey: "workingHours",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-center w-full justify-center text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            Working Hours
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div>{row.getValue("workingHours")}</div>,
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      const search = filterValue.toLowerCase();
      return Object.keys(row.original).some((key) =>
        String(row.getValue(key)).toLowerCase().includes(search)
      );
    },
    onPaginationChange: (updater) => {
      setPagination((prev) => {
        const newPagination =
          typeof updater === "function" ? updater(prev) : updater;
        return {
          ...prev,
          ...newPagination,
          pageIndex:
            newPagination.pageSize !== prev.pageSize
              ? 0
              : newPagination.pageIndex,
        };
      });
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      pagination,
    },
  });

  return (
    <div className="w-full">
      <div className="flex flex-col gap-4 py-4">
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <div className="flex flex-col gap-1 w-full sm:w-48">
            <label className="text-sm font-medium text-gray-700">
              From Date
            </label>
            <Input
              type="date"
              value={startDateInput}
              onChange={(e) => setStartDateInput(e.target.value)}
              className="w-full bg-white"
            />
          </div>
          <div className="flex flex-col gap-1 w-full sm:w-48">
            <label className="text-sm font-medium text-gray-700">To Date</label>
            <Input
              type="date"
              value={endDateInput}
              onChange={(e) => setEndDateInput(e.target.value)}
              className="w-full bg-white"
            />
          </div>
          <div className="flex flex-col gap-1 w-full sm:w-48">
            <label className="text-sm font-medium text-gray-700">
              Employee
            </label>
            <Select
              value={selectedUser?.value || "0"}
              onValueChange={handleEmployeeChange}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Select Employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="all-employees" value="0">
                  All Employees
                </SelectItem>
                {(companyConfigData?.employee || []).map((emp) => (
                  <SelectItem key={emp.employee_id} value={emp.employee_id}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-row justify-center gap-4">
          <Button
            onClick={handleDateSearch}
            className="w-full sm:w-auto bg-[#287F71] hover:bg-[#1a5c4d]"
            disabled={isRefetching}
          >
            Search
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            className="w-full sm:w-auto"
            disabled={isRefetching}
          >
            Reset
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* <Input
            type="text"
            placeholder="Search attendance..."
            value={globalFilter || ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full sm:w-80 bg-white border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#287F71]"
          /> */}
          <div className="flex flex-row sm:ml-auto gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  Columns <ChevronDown className="ml-2 h-4 text-right w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              onClick={handleExportCSV}
              className="w-full sm:w-auto bg-[#287F71] hover:bg-[#1a5c4d] text-white"
            >
              Export CSV
            </Button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table className="min-w-full listing-tables">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="bg-[#4a5a6b] text-white text-center sm:text-sm text-base whitespace-nowrap"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="bg-[#fff] text-left">
            {isLoading || isRefetching ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-10 text-center"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="text-center sm:text-sm text-base py-1 whitespace-nowrap"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-10 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4 pagination-responsive">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <span className="text-sm text-muted-foreground">
              Rows per page:
            </span>
            <Select
              value={pagination.pageSize.toString()}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="w-[70px] bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 75, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={pageSize.toString()}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            {pagination.pageIndex * pagination.pageSize + 1}-
            {Math.min(
              (pagination.pageIndex + 1) * pagination.pageSize,
              data.length
            )}{" "}
            of {data.length} rows
          </div>
          <div className="space-x-2 flex pagination-buttons">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              Last
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceReport;
