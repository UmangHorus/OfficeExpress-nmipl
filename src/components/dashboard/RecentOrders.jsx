"use client";

import { useState, useEffect, useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, MapPin,Eye } from "lucide-react";
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
import OrderDetailsDialog from "../shared/OrderDetailsDialog";
import { Badge } from "@/components/ui/badge";
import OrderService from "@/lib/OrderService";

export default function RecentOrders() {
  const { user = {}, navConfig, token } = useLoginStore();
  const ordersLabel = navConfig?.labels?.orders || "Sales Order";
  const isAuthenticated = !!user?.id;

  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [data, setData] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // Fetch orders using useQuery
  const {
    data: orderData,
    error: orderError,
    isLoading: orderLoading,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ["orderPastOrders", user?.id, token],
    queryFn: () => OrderService.getLeadPastOrders(token, user?.id, user?.type),
    enabled: !!token && !!user?.id && isAuthenticated,
    refetchOnMount: "always", // Force refetch when component mounts
    staleTime: 0, // Mark data as stale immediately
    cacheTime: 0, // Disable caching (use gcTime: 0 for React Query v5)
  });

  // Handle order data
  useEffect(() => {
    if (orderData) {
      const responseData = Array.isArray(orderData) ? orderData[0] : orderData;
      if (responseData?.STATUS == "SUCCESS") {
        const orderList = responseData?.DATA?.lead_orders
          .filter((item) => item && item.order_no)
          .map((order) => ({
            id: order.order_no || "",
            fullorder_no: order.fullorder_no || `${order.order_no}`,
            customername: order.reference_name_optional || "Unknown",
            createdate: order.lead_dt || "",
            status_flg: order.status_flg || "N/A",
            location: order.gmapAddress,
            gmapAddress: order.gmapAddress,
            gmapurl: order.gmapurl,
            customer_address: order.reference_address || "",
            create_from: order.create_from || "",
          }))
          .slice(0, 10); // Limit to first 10 results
        setData(orderList);
      } else {
        // toast.error(responseData?.MSG || "Failed to fetch order data");
        console.error("Failed to fetch order data:", responseData?.MSG);
      }
    }
    if (orderError) {
      // toast.error("Error fetching orders: " + orderError.message);
      console.error("Error fetching orders:", orderError.message);
    }
  }, [orderData, orderError]);

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
            !CustomerAddress || CustomerAddress.trim() == "";
          const isCreatedAddressDisabled =
            !CreatedAddress || CreatedAddress.trim() == "";

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
        accessorKey: "fullorder_no",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() == "asc")}
            className="text-left w-full justify-start text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            Order Number
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-left">{row.getValue("fullorder_no")}</div>
        ),
      },
      {
        accessorKey: "createdate",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() == "asc")}
            className="text-left w-full justify-start text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            Created Date
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
        accessorKey: "customername",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() == "asc")}
            className="text-left w-full justify-start text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            Customer Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-left">{row.getValue("customername")}</div>
        ),
      },
      {
        accessorKey: "status_flg",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() == "asc")}
            className="text-center w-full justify-center text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const status = row.getValue("status_flg");
          const displayStatus =
            status == "A"
              ? "Approved"
              : status == "C"
              ? "Rejected"
              : status == "P"
              ? "Pending"
              : "N/A";
          const badgeStyles = {
            Approved: "bg-[#287F71] text-white",
            Rejected: "bg-[#ec344c] text-white",
            Pending: "bg-[#f59440] text-white",
            "N/A": "bg-gray-500 text-white",
          };
          return (
            <div className="text-center">
              <Badge
                className={`${
                  badgeStyles[displayStatus] || "bg-gray-500 text-white"
                }`}
              >
                {displayStatus}
              </Badge>
            </div>
          );
        },
      },
      {
        accessorKey: "create_from",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() == "asc")}
            className="text-center w-full justify-center text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            Source
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const createFrom = row.getValue("create_from");
          let displaySource;
          if (createFrom == "OE" || createFrom == "officeexpre") {
            displaySource = "Office Express";
          } else if (createFrom == "NP") {
            displaySource = "E-Commerce";
          } else if (
            createFrom == "" ||
            createFrom == null ||
            createFrom.includes("salesorder_")
          ) {
            displaySource = "H-Office";
          } else {
            displaySource = createFrom || "N/A";
          }
          return <div className="text-center">{displaySource}</div>;
        },
      },
      {
        id: "viewOrder",
        header: () => <div className="text-center text-white">Actions</div>,
        cell: ({ row }) => {
          const order = row.original;
          return (
            <div className="text-center flex justify-center gap-2">
              <Eye
                className="h-5 w-5 text-[#287F71] hover:text-[#1a5c50] cursor-pointer"
                onClick={() => {
                  setSelectedOrderId(order.id);
                  setDialogOpen(true);
                }}
              />
            </div>
          );
        },
        enableHiding: false,
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
            {orderLoading ? (
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
      {selectedOrderId && (
        <OrderDetailsDialog
          salesorderId={selectedOrderId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </div>
  );
}