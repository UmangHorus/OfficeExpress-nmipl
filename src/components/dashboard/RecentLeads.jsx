"use client";
import { useState, useEffect, useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, MapPin, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLoginStore } from "@/stores/auth.store";
import { useQuery } from "@tanstack/react-query";
import toast, { Toaster } from "react-hot-toast";
import LeadDetailsDialog from "../shared/LeadDetailsDialog";
import { Badge } from "@/components/ui/badge";
import { leadService } from "@/lib/leadService";

export default function RecentLeads() {
  const { user = {}, navConfig, token } = useLoginStore();
  const leadLabel = navConfig?.labels?.leads || "Lead";
  const contactLabel = navConfig?.labels?.contacts || "Contact";
  const isAuthenticated = !!user?.id;

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

  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [data, setData] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(null);

  // Fetch leads using useQuery
  const {
    data: leadData,
    error: leadError,
    isLoading: leadLoading,
    refetch: refetchLeads,
  } = useQuery({
    queryKey: ["leadPastOrders", user?.id, token],
    queryFn: () => leadService.getLeadPastOrders(token, user?.id, user?.type),
    enabled: !!token && !!user?.id && isAuthenticated,
    refetchOnMount: "always",
    staleTime: 0,
    cacheTime: 0,
  });

  // Handle lead data
  useEffect(() => {
    if (leadData) {
      const responseData = Array.isArray(leadData) ? leadData[0] : leadData;
      if (responseData?.STATUS === "SUCCESS") {
        const leadList = responseData?.DATA?.lead_orders
          .filter((item) => item && item.order_no)
          .map((order) => ({
            id: order.order_no || "",
            leadno: order.fullorder_no || `${order.order_no}`,
            customername: order.reference_name_optional || "Unknown",
            lead_title: order.lead_title || "",
            createdate: order.lead_dt || "",
            leadstatus: mapStatus(order.status),
            location: order.gmapAddress,
            gmapAddress: order.gmapAddress,
            gmapurl: order.gmapurl,
            ev_id: order.ev_id || null,
            customer_address: order.reference_address || "",
            created_by: order.created_by || "",
          }))
          .slice(0, 10); // Limit to first 10 results
        setData(leadList);
      } else {
        console.error(responseData?.MSG || "Failed to fetch lead orders");
      }
    }
    if (leadError) {
      console.error("Error fetching leads:", leadError.message);
    }
  }, [leadData, leadError]);

  // Map status function
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

  const columns = useMemo(
    () => [
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
                  className="cursor-not-allowed"
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
                    className="text-[#287F71] hover:text-[#1a5c4d]"
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
                  className="cursor-not-allowed"
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
                    className="created-address-icon"
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
            "N/A": "bg-gray-500 text-white",
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
    [leadLabel, contactLabel]
  );

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div className="w-full">
      <Toaster />
      <div className="rounded-md border">
        <Table className="min-w-full listing-tables">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="bg-[#4a5a6b] text-white"
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
          <TableBody className="bg-white">
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
                    <TableCell key={cell.id} className="text-center">
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
      {selectedLeadId && (
        <LeadDetailsDialog
          leadId={selectedLeadId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </div>
  );
}