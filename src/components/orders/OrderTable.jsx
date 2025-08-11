"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { useLoginStore } from "@/stores/auth.store";
import { Badge } from "@/components/ui/badge";
import OrderDetailsDialog from "../shared/OrderDetailsDialog";
import { useRouter } from "next/navigation";
import OrderService from "@/lib/OrderService";

const OrderTable = () => {
  const { user, token } = useLoginStore();
  const router = useRouter();
  const orderLabel = useLoginStore(
    (state) => state.navConfig?.labels?.orders || "Order"
  );
  const contactLabel = useLoginStore(
    (state) => state.navConfig?.labels?.contacts || "Contact"
  );
  const [data, setData] = useState([]);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({ id: false });
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: orderData,
    error: orderError,
    isLoading: orderLoading,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ["orderPastOrders", user?.id, token],
    queryFn: () => OrderService.getLeadPastOrders(token, user?.id, user?.type),
    enabled: !!token && !!user?.id,
    refetchOnMount: "always",
  });

  useEffect(() => {
    if (orderData) {
      const responseData = Array.isArray(orderData) ? orderData[0] : orderData;
      if (responseData?.STATUS === "SUCCESS") {
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
            create_from: order.create_from || "", // Add create_from to data mapping
            created_by: order.created_by || "",
          }));
        setData(orderList);
      } else {
        // toast.error(responseData?.MSG || "Failed to fetch order data");
        console.error(responseData?.MSG || "Failed to fetch order data"); // Log for debugging
      }
    }
    if (orderError) {
      // toast.error("Error fetching orders: " + orderError.message);
      console.error("Error fetching orders:", orderError.message); // Log for debugging
    }
  }, [orderData, orderError]);

  const handleCreateOrder = () => {
    router.push("/orders/create");
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
        accessorKey: "fullorder_no",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
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
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
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
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
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
        accessorKey: "status_flg",
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
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-center w-full justify-center text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            Source
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const createFrom = row.getValue("create_from");
          let displaySource;
          if (createFrom === "OE" || createFrom === "officeexpre") {
            displaySource = "Office Express";
          } else if (createFrom === "NP") {
            displaySource = "E-Commerce";
          } else if (
            createFrom === "" ||
            createFrom === null ||
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
              <Pencil
                className="h-5 w-5 text-[#D97706] hover:text-[#B45309] cursor-pointer"
                onClick={() => {
                  router.push(`/orders/create?orderId=${order.id}`);
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
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      const search = filterValue.toLowerCase();
      return (
        row.getValue("fullorder_no")?.toLowerCase().includes(search) ||
        row.getValue("createdate")?.toLowerCase().includes(search) ||
        row.getValue("customername")?.toLowerCase().includes(search) ||
        (row.getValue("status_flg") === "A"
          ? "Approved"
          : row.getValue("status_flg") === "C"
          ? "Rejected"
          : row.getValue("status_flg") === "P"
          ? "Pending"
          : "N/A"
        )
          .toLowerCase()
          .includes(search) ||
        (row.getValue("create_from") === "OE" ||
        row.getValue("create_from") === "officeexpre"
          ? "Office Express"
          : row.getValue("create_from") === "NP"
          ? "E-Commerce"
          : row.getValue("create_from") === "" ||
            row.getValue("create_from") === null ||
            row.getValue("create_from").includes("salesorder_")
          ? "H-Office"
          : row.getValue("create_from") || "N/A"
        )
          .toLowerCase()
          .includes(search) ||
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

  // CSV Export function
  const handleExportCSV = () => {
    // Excel-compatible CSV format with BOM for UTF-8
    const BOM = "\uFEFF";
    const headers = [
      `${contactLabel} Address`,
      "Created Address",
      "Order Number",
      "Create Date", // Will show as "27/06/2025 03:25 pm"
      "Customer Name",
      "Created By",
      "Status", // Will show human-readable status
      "Source", // Will show human-readable source
    ];

    const csvData = data.map((order) => {
      const escapeCsv = (str) => {
        if (!str) return "";
        return `"${String(str).replace(/"/g, '""')}"`;
      };

      // Status display logic
      const displayStatus =
        order.status_flg == "A"
          ? "Approved"
          : order.status_flg == "C"
          ? "Rejected"
          : order.status_flg == "P"
          ? "Pending"
          : "N/A";

      // Source display logic
      const displaySource =
        order.create_from === "OE" || order.create_from === "officeexpre"
          ? "Office Express"
          : order.create_from === "NP"
          ? "E-Commerce"
          : order.create_from === "" ||
            order.create_from === null ||
            (order.create_from && order.create_from.includes("salesorder_"))
          ? "H-Office"
          : order.create_from || "N/A";

      return [
        escapeCsv(order.customer_address),
        escapeCsv(order.location),
        escapeCsv(order.fullorder_no),
        escapeCsv(order.createdate), // Keep original date format
        escapeCsv(order.customername),
        escapeCsv(order.created_by),
        escapeCsv(displayStatus), // Use formatted status
        escapeCsv(displaySource), // Use formatted source
      ];
    });

    const csvContent =
      BOM +
      [headers.join(","), ...csvData.map((row) => row.join(","))].join("\r\n");

    // Download with current date in filename
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadFile(csvContent, `orders_report_${dateStr}.csv`);
  };

  // Helper function for download (unchanged)
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 py-4">
        {/* Search Section */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Input
            placeholder={`Search ${orderLabel}...`}
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
                      {column.id.replace(/_/g, " ")}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Export and Create Buttons */}
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              onClick={handleExportCSV}
              className="w-full sm:w-auto bg-[#287F71] hover:bg-[#1a5c4d] text-white"
              disabled={data.length === 0}
            >
              Export CSV
            </Button>
            <Button
              onClick={handleCreateOrder}
              className="w-full sm:w-auto bg-[#287F71] hover:bg-[#1a5c4d] text-white"
            >
              Create {orderLabel}
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
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 rows-per-page-container">
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
      {selectedOrderId && (
        <OrderDetailsDialog
          salesorderId={selectedOrderId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </div>
  );
};

export default OrderTable;
