"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
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
import { ChevronDown, ArrowUpDown, MapPin, Eye, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import { ContactService } from "@/lib/ContactService";
import { leadService } from "@/lib/leadService";
import { useLoginStore } from "@/stores/auth.store";
import { Badge } from "@/components/ui/badge";
import LeadDetailsDialog from "../shared/LeadDetailsDialog";
import { useRouter } from "next/navigation";
import LeadFollowupForm from "../forms/LeadFollowupForm";
import useLocationPermission from "@/hooks/useLocationPermission";

const LeadTable = () => {
  const { user, token, location, appConfig } = useLoginStore();
  const router = useRouter();
  const leadLabel = useLoginStore(
    (state) => state.navConfig?.labels?.leads || "Lead"
  );
  const contactLabel = useLoginStore(
    (state) => state.navConfig?.labels?.contacts || "Contact"
  );
  const checkAndRequestLocation = useLocationPermission();
  const [data, setData] = useState([]);
  const [visitorFound, setVisitorFound] = useState([]);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({ id: false });
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [disabledVisitIn, setDisabledVisitIn] = useState(false);
  const [disabledVisitOut, setDisabledVisitOut] = useState(false);
  const [isFollowupDialogOpen, setIsFollowupDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Check export permissions
  const canExport =
    appConfig?.user_role?.lead?.canExportReport == 1 &&
    appConfig?.user_role?.lead?.canExportToCSVLead == 1;

  const mapStatus = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "Completed";
      case "pending":
        return "Pending";
      case "cancelled":
        return "Cancelled";
      default:
        return status || "Unknown";
    }
  };

  const {
    data: leadData,
    error: leadError,
    isLoading: leadLoading,
    refetch: refetchLeads,
  } = useQuery({
    queryKey: ["leadPastOrders", user?.id, token],
    queryFn: () => leadService.getLeadPastOrders(token, user?.id, user?.type),
    enabled: !!token && !!user?.id,
    refetchOnMount: "always",
  });

  useEffect(() => {
    if (leadData) {
      const responseData = Array.isArray(leadData) ? leadData[0] : leadData;
      if (responseData?.STATUS === "SUCCESS") {
        const leadList = responseData?.DATA?.lead_orders
          .filter((item) => item && item.order_no)
          .map((order) => {
            return {
              id: order.order_no || "",
              leadno: order.fullorder_no || `${order.order_no}`,
              customername: order.reference_name_optional || "Unknown",
              lead_title: order.lead_title || "",
              createdate: order.lead_dt || "",
              visitStatus:
                responseData?.DATA?.visitor_found[0]?.reference_id ==
                  order.order_no
                  ? "out"
                  : null,
              leadstatus: mapStatus(order.status),
              location: order.gmapAddress,
              gmapAddress: order.gmapAddress,
              gmapurl: order.gmapurl,
              ev_id: order.ev_id || null,
              customer_address: order.reference_address || "",
              created_by: order.created_by || "",
            };
          });
        setVisitorFound(responseData?.DATA?.visitor_found || []);
        setData(leadList);
      } else {
        // toast.error(responseData?.MSG || "Failed to fetch lead orders");
        console.error(responseData?.MSG || "Failed to fetch lead orders");
      }
    }
    if (leadError) {
      // toast.error("Error fetching leads: " + leadError.message);
      console.error("Error fetching leads:", leadError.message);
    }
  }, [leadData]);

  const handleCreateLead = () => {
    router.push("/leads/create");
  };

  const handleVisitIn = async (lead, action) => {
    setDisabledVisitIn(true);
    try {
      if (!user?.id || !user?.type) {
        toast.error("User information is missing.");
        return;
      }

      const leadType = "7";
      const response = await ContactService.employeeVisitorInOut(
        token,
        action,
        user.id,
        lead.id,
        leadType
      );

      const result = response[0] || {};
      if (result.STATUS === "SUCCESS") {
        await refetchLeads();
        toast.success("Visit In recorded successfully.", {
          duration: 2000,
        });
      } else {
        toast.error(result.MSG || "Failed to record Visit In.");
      }
    } catch (error) {
      console.error(
        "Error recording Visit In:",
        error.message,
        error.response?.data
      );
      toast.error("An error occurred while recording Visit In.");
    } finally {
      setDisabledVisitIn(false);
    }
  };

  const handleVisitOut = async (lead, action) => {
    setDisabledVisitOut(true);
    try {
      if (!user?.id || !user?.type) {
        toast.error("User information is missing.");
        return;
      }

      if (!visitorFound[0]?.ev_id) {
        toast.error("No active visitor ID found.");
        return;
      }

      setSelectedLead({
        id: lead.leadno,
        // leadno: lead.leadno,
      });
      setIsFollowupDialogOpen(true);
    } catch (error) {
      console.error(
        "Error preparing Visit Out:",
        error.message,
        error.response?.data
      );
      toast.error("An error occurred while preparing Visit Out.");
    } finally {
      setDisabledVisitOut(false);
    }
  };

  const handleFollowupSubmit = async (followupData) => {
    try {
      // First check location permissions
      await checkAndRequestLocation("followup submission");

      const followupResponse = await leadService.saveLeadFollowup(
        token,
        followupData.leadId,
        user.id,
        followupData.outcomeId,
        followupData.followupTypeId,
        followupData.description,
        followupData.followupDate,
        followupData.nextActionDate,
        followupData.singleFile,
        location
      );

      const followupResult = followupResponse[0] || {};
      if (followupResult.STATUS === "SUCCESS") {
        const leadType = followupData.leadType;
        const visitorResponse = await ContactService.employeeVisitorInOut(
          token,
          "out",
          user.id,
          followupData.leadId,
          leadType,
          visitorFound[0].ev_id
        );

        const visitorResult = visitorResponse[0] || {};
        if (visitorResult.STATUS === "SUCCESS") {
          await refetchLeads();
          toast.success("Followup and Visit Out recorded successfully.", {
            duration: 2000,
          });
          setIsFollowupDialogOpen(false);
          setSelectedLead(null);
        } else {
          toast.error(visitorResult.MSG || "Failed to record Visit Out.");
        }
      } else {
        toast.error(followupResult.MSG || "Failed to save followup.");
      }
    } catch (error) {
      console.error(
        "Error processing followup and visit out:",
        error.message,
        error.response?.data
      );
      toast.error(error.message, {
        position: "top-right",
        duration: 3000,
      });
    }
  };

  const columns = useMemo(
    () => [
      ...(!user?.isEmployee
        ? []
        : [
          {
            id: "visit",
            header: () => <div className="text-center text-white">Visit</div>,
            cell: ({ row }) => {
              const lead = row.original || {};
              if (lead.visitStatus === "out") {
                return (
                  <div className="text-center">
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700 mx-auto"
                      onClick={() => handleVisitOut(lead, "out")}
                      disabled={
                        disabledVisitOut ||
                        (visitorFound.length > 0 &&
                          lead.id != visitorFound[0]?.reference_id)
                      }
                    >
                      Visit Out
                    </Button>
                  </div>
                );
              }
              return (
                <div className="text-center">
                  <Button
                    variant="default"
                    size="sm"
                    className={`mx-auto text-white ${lead.ev_id
                        ? "bg-[#4a5a6b] hover:bg-[#5c6b7a]"
                        : "bg-[#287f71] hover:bg-[#20665a]"
                      }`}
                    onClick={() => handleVisitIn(lead, "in")}
                    disabled={
                      disabledVisitIn ||
                      (visitorFound.length > 0 &&
                        lead.id != visitorFound[0]?.reference_id)
                    }
                  >
                    Visit In
                  </Button>
                </div>
              );
            },
            enableHiding: false,
          },
        ]),
      {
        accessorFn: (row) => ({
          CustomerAddress: row.customer_address,
          CreatedAddress: row.location,
        }),
        id: "location",
        header: () => <div className="text-center text-white">Location</div>,
        cell: ({ row }) => {
          const { CustomerAddress, CreatedAddress } = row.getValue("location");
          const isCustomerAddressDisabled =
            !CustomerAddress || CustomerAddress.trim() === "";
          const isCreatedAddressDisabled =
            !CreatedAddress || CreatedAddress.trim() === "";

          return (
            <div className="flex items-center justify-center">
              {isCustomerAddressDisabled ? (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={true}
                  title="No contact address available"
                  className="cursor-not-allowed pr-0"
                >
                  <MapPin className="h-4 w-4 text-gray-400" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  title={`Contact Address: ${CustomerAddress}`}
                >
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      CustomerAddress
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#287F71] hover:text-[#1a5c4d] pr-0"
                  >
                    <MapPin className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {isCreatedAddressDisabled ? (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={true}
                  title="No followup address available"
                  className="cursor-not-allowed pr-0"
                >
                  <MapPin className="h-4 w-4 text-gray-400" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  title={`Created Address: ${CreatedAddress}`}
                >
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      CreatedAddress
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="created-address-icon pr-0"
                  >
                    <MapPin className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "leadno",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left w-full justify-start text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            {`${leadLabel} No`}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="capitalize text-left">{row.getValue("leadno")}</div>
        ),
      },
      {
        accessorKey: "createdate",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left w-full justify-start text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            Created At
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="capitalize text-left">
            {row.getValue("createdate")}
          </div>
        ),
      },
      {
        accessorKey: "lead_title",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left w-full justify-start text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            {`${leadLabel} Title`}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-left">{row.getValue("lead_title")}</div>
        ),
      },
      {
        accessorKey: "customername",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left w-full justify-start text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            {`${contactLabel} Name`}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-left">{row.getValue("customername")}</div>
        ),
      },
      {
        accessorKey: "created_by",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left w-full justify-start text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            Created By
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-left">{row.getValue("created_by")}</div>
        ),
      },
      {
        accessorKey: "leadstatus",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-center w-full justify-center text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const status = row.getValue("leadstatus");
          const badgeStyles = {
            Completed: "bg-[#287F71] text-white",
            Pending: "bg-[#f59440] text-white",
            Cancelled: "bg-[#ec344c] text-white",
          };
          return (
            <div className="text-center">
              <Badge
                className={`${badgeStyles[status] || "bg-gray-500 text-white"}`}
              >
                {status}
              </Badge>
            </div>
          );
        },
      },
      {
        id: "viewLead",
        header: () => <div className="text-center text-white">Actions</div>,
        cell: ({ row }) => {
          const lead = row.original;
          return (
            <div className="text-center flex justify-center gap-2">
              <Eye
                className="h-5 w-5 text-[#287F71] hover:text-[#1a5c50] cursor-pointer"
                onClick={() => {
                  setSelectedLeadId(lead.leadno);
                  setDialogOpen(true);
                }}
              />
            </div>
          );
        },
        enableHiding: false,
      },
    ],
    [visitorFound, user?.isEmployee, disabledVisitIn, disabledVisitOut]
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
      return (
        row.getValue("leadno")?.toLowerCase().includes(search) ||
        row.getValue("createdate")?.toLowerCase().includes(search) ||
        row.getValue("customername")?.toLowerCase().includes(search) ||
        row.getValue("lead_title")?.toLowerCase().includes(search) ||
        row.getValue("leadstatus")?.toLowerCase().includes(search) ||
        row.getValue("created_by")?.toLowerCase().includes(search)
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

  const handleExportCSV = () => {
    // Excel-compatible CSV format with BOM for UTF-8
    const BOM = "\uFEFF";
    const headers = [
      `${contactLabel} Address`,
      "Created Address",
      `${leadLabel} Number`,
      "Create Date", // Already in "27/06/2025 03:25 pm" format
      `${leadLabel} Title`,
      "Customer Name",
      "Created By",
      "Status",
    ];

    const csvData = data.map((lead) => {
      const escapeCsv = (str) => {
        if (!str) return "";
        return `"${String(str).replace(/"/g, '""')}"`;
      };

      return [
        escapeCsv(lead.customer_address),
        escapeCsv(lead.location),
        escapeCsv(lead.leadno),
        escapeCsv(lead.createdate), // Use date as-is
        escapeCsv(lead.lead_title),
        escapeCsv(lead.customername),
        escapeCsv(lead.created_by),
        escapeCsv(lead.leadstatus),
      ];
    });

    const csvContent =
      BOM +
      [headers.join(","), ...csvData.map((row) => row.join(","))].join("\r\n");

    // Download with current date in filename
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadFile(csvContent, `${leadLabel}_report_${dateStr}.csv`);
  };

  // Unchanged download helper function
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

  return (
    <div className="w-full">
      {visitorFound.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-100 border-l-4 border-yellow-500">
          <p className="font-bold text-yellow-700">
            <>
              Visit status: <span className="">Pending check-out</span> for{" "}
              <span className="underline">
                {`${leadLabel} No`}: {visitorFound[0].reference_id}
              </span>
            </>
          </p>
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 py-4">
        {/* Search and Filter Section */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Input
            placeholder={`Search ${leadLabel}...`}
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="w-full sm:max-w-sm bg-[#fff]"
          />
        </div>

        {/* Action Buttons Section */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:ml-auto">
          {/* Columns Visibility Dropdown */}
          <div className="flex justify-end w-full sm:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-auto">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
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
                      {column.id.replace(/_/g, " ")}{" "}
                      {/* Convert underscores to spaces */}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Export and Create Buttons */}
          <div className="flex gap-3 w-full sm:w-auto">
            {canExport && (
              <Button
                onClick={handleExportCSV}
                className="w-full sm:w-auto bg-[#287F71] hover:bg-[#1a5c4d] text-white"
              >
                Export CSV
              </Button>
            )}
            <Button
              onClick={handleCreateLead}
              className="w-full sm:w-auto bg-[#287F71] hover:bg-[#1a5c4d] text-white"
            >
              Create {leadLabel}
            </Button>
          </div>
        </div>
      </div>
      <div>
        <Table className="min-w-full listing-tables">
          <TableHeader className="text-left">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="bg-[#4a5a6b] text-white text-center"
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
          <TableBody className="bg-white text-center">
            {leadLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-left">
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
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4 pagination-responsive">
        <div className="flex flex-col md:flex-row items-center space-x-4">
          <div className="flex items-center rows-per-page-container gap-2">
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
          {/* <div className="text-sm text-muted-foreground">
            {pagination.pageIndex * pagination.pageSize + 1}-
            {Math.min(
              (pagination.pageIndex + 1) * pagination.pageSize,
              data.length
            )}{" "}
            of {data.length} rows
          </div> */}
          <div className="text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length === 0
              ? "0-0 of 0 rows"
              : `${pagination.pageIndex * pagination.pageSize + 1}-${Math.min(
                (pagination.pageIndex + 1) * pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )} of ${table.getFilteredRowModel().rows.length} rows`}
          </div>
          <div className="flex pagination-buttons gap-2">
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
      {selectedLeadId && (
        <LeadDetailsDialog
          leadId={selectedLeadId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
      {selectedLead && (
        <LeadFollowupForm
          isOpen={isFollowupDialogOpen}
          onClose={() => {
            setIsFollowupDialogOpen(false);
            setSelectedLead(null);
          }}
          onFollowupSubmit={handleFollowupSubmit}
          lead={selectedLead}
        />
      )}
    </div>
  );
};

export default LeadTable;
