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
import { ChevronDown, ArrowUpDown, MapPin, Download } from "lucide-react";
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
import { format, startOfDay, endOfDay, parse } from "date-fns";
import { ContactService } from "@/lib/ContactService";
import AddFollowupForm from "../forms/AddFollowupForm";
import useLocationPermission from "@/hooks/useLocationPermission";

const ContactFollowup = () => {
  const { user, token, location } = useLoginStore();
  const checkAndRequestLocation = useLocationPermission();

  const [data, setData] = useState([]);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({ id: false });
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [startDate, setStartDate] = useState(startOfDay(new Date()));
  const [endDate, setEndDate] = useState(endOfDay(new Date()));
  const [startDateInput, setStartDateInput] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [endDateInput, setEndDateInput] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [isRefetching, setIsRefetching] = useState(false);
  const [isFollowupDialogOpen, setIsFollowupDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  const formatDateForApi = (date, isStart) => {
    const parsedDate = parse(date, "yyyy-MM-dd", new Date());
    return (
      format(parsedDate, "dd-MM-yyyy") + (isStart ? " 00:01 AM" : " 23:59 PM")
    );
  };

  const fetchFollowups = async (startDateStr, endDateStr) => {
    if (!token || !user?.id) {
      throw new Error("Authentication details missing");
    }
    const formData = new FormData();
    formData.append("PHPTOKEN", token);
    formData.append("created_by", user.id);
    formData.append("s_nextaction_dt", formatDateForApi(startDateStr, true));
    formData.append("e_nextaction_dt", formatDateForApi(endDateStr, false));

    const response = await ContactService.getContactRawcontactFollowUP(
      token,
      formData
    );
    return response;
  };

  const handleFollowupSubmit = async (followupData) => {
    try {
      // Save Followup
      // First check location permissions
      await checkAndRequestLocation("followup submission");

      const followupResponse =
        await ContactService.saveContactRawcontactFollowUP(
          token,
          followupData.contactId,
          followupData.contactType,
          user.id,
          followupData.outcomeId,
          followupData.followupTypeId,
          followupData.description,
          followupData.subordinateId,
          followupData.subordinateName,
          followupData.followupDate,
          followupData.nextActionDate,
          followupData.singleFile,
          location // location parameter, assuming null as not provided in original
        );

      const followupResult = followupResponse[0] || {};
      if (followupResult.STATUS === "SUCCESS") {
        // Refresh table data by calling fetchFollowups
        const response = await fetchFollowups(startDateInput, endDateInput);
        const responseData = Array.isArray(response) ? response[0] : response;
        if (
          responseData &&
          (responseData.STATUS === "SUCCESS" ||
            responseData.status === "SUCCESS" ||
            responseData.Status === "SUCCESS")
        ) {
          const mappedData = (responseData.DATA || responseData.data || []).map(
            (item) => ({
              id: item.interaction_id,
              contactAddress: item.full_address || "",
              followupAddress: item.gmapAddress || "",
              contactName: `${item?.contact_name} (${item?.contact_type == "1" ? "C" : "RC"
                })`,
              associateName: item.subsubordinate_names || "",
              contactMobile: item.contact_mobile_no || "",
              contactEmail: item.contact_email_address || "",
              contactCity: item.contact_city || "",
              contactRoute: item.route_name || "",
              contactIndustry: item.industries_name || "",
              followupType: item.followup_type || "",
              followupOutcome: item.outcome_name || "",
              followupTakenDate: item.followup_taken_dt || "",
              nextActionDate: item.nextaction_dt || "",
              keyAccountManager: item.emp_name_key || "",
              createdDate: item.interaction_dt || "",
              createdBy: item.emp_name || "",
              followupDescription: item.comments || "",
              attachment: [],
              interaction_id: item.interaction_id,
              contact_type: item.contact_type,
            })
          );
          setData(mappedData);
          toast.success("Follow-up added successfully.", {
            duration: 2000,
          });
          setIsFollowupDialogOpen(false);
          setSelectedContact(null);
        } else {
          toast.error(
            responseData?.MSG ||
            responseData?.message ||
            "Failed to refresh followup data."
          );
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

  const handleDownloadInteractionFile = async (interactionId, contactType) => {
    try {
      const formData = new FormData();
      formData.append("interaction_id", interactionId);
      formData.append("contact_type", contactType);

      const response = await ContactService.downloadInteractionsFile(
        token,
        formData
      );
      const responseData = Array.isArray(response) ? response[0] : response;

      if (
        responseData &&
        (responseData.STATUS === "SUCCESS" ||
          responseData.status === "SUCCESS" ||
          responseData.Status === "SUCCESS")
      ) {
        const DATA = responseData.DATA || responseData.data || [];
        if (DATA.length > 0) {
          toast.success(responseData.MSG || "File downloaded successfully", {
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "colored",
          });

          const fileUrl = DATA[0]?.file_url;
          if (fileUrl) {
            const link = document.createElement("a");
            link.href = fileUrl;
            link.download = fileUrl.split("/").pop();
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        } else {
          toast.warning("Attachment Not Uploaded", {
            description: "No documents were uploaded for this interaction.",
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "colored",
          });
        }
      } else {
        toast.error(
          responseData?.MSG ||
          responseData?.message ||
          "Failed to download file"
        );
      }
    } catch (err) {
      console.error("Download API error:", err);
      toast.error(err.message || "Error downloading file");
    }
  };

  const {
    data: followupData,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["contactFollowups", user?.id, token],
    queryFn: () => fetchFollowups(startDateInput, endDateInput),
    enabled: !!token && !!user?.id, // Only fetch when token and user.id are available
    refetchOnMount: "always", // Will refetch every time component mounts
    // enabled: false, // Disable automatic fetching
  });

  // Initial data fetch on mount
  // useEffect(() => {
  //   if (token && user?.id) {
  //     refetch();
  //   }
  // }, [token, user?.id, refetch]);

  useEffect(() => {
    if (followupData) {
      const responseData = Array.isArray(followupData)
        ? followupData[0]
        : followupData;
      if (responseData && responseData.STATUS === "SUCCESS") {
        const mappedData = (responseData.DATA || responseData.data || []).map(
          (item) => ({
            id: item.interaction_id,
            contactAddress: item.full_address || "",
            followupAddress: item.gmapAddress || "",
            contactName: `${item?.contact_name} (${item?.contact_type == "1" ? "C" : "RC"
              })`,
            associateName: item.subsubordinate_names || "",
            contactMobile: item.contact_mobile_no || "",
            contactEmail: item.contact_email_address || "",
            contactCity: item.contact_city || "",
            contactRoute: item.route_name || "",
            contactIndustry: item.industries_name || "",
            followupType: item.followup_type || "",
            followupOutcome: item.outcome_name || "",
            followupTakenDate: item.followup_taken_dt || "",
            nextActionDate: item.nextaction_dt || "",
            keyAccountManager: item.emp_name_key || "",
            createdDate: item.interaction_dt || "",
            createdBy: item.emp_name || "",
            followupDescription: item.comments || "",
            attachment: [],
            interaction_id: item.interaction_id,
            contact_type: item.contact_type,
          })
        );
        setData(mappedData);
      } else {
        // toast.error(
        //   responseData?.MSG ||
        //     responseData?.message ||
        //     "Failed to fetch followup data"
        // );
        console.error(
          responseData?.MSG ||
          responseData?.message ||
          "Failed to fetch followup data"
        );
      }
    }
    if (error) {
      // toast.error("Error fetching followups: " + error.message);
      console.error("Error fetching followups: " + error.message);
    }
  }, [followupData, error]);

  const handleExportCSV = () => {
    const headers = [
      "Contact Address",
      "Followup Address",
      "Contact Name",
      "Associate Name",
      "Contact Mobile",
      "Contact Email",
      "Contact City",
      "Contact Route",
      "Contact Industry",
      "Followup Type",
      "Followup Outcome",
      "Followup Taken Date",
      "Next Action Date",
      "Key A/C Manager",
      "Created Date",
      "Created By",
      "Followup Description",
    ];
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        [
          `"${row.contactAddress || ""}"`,
          `"${row.followupAddress || ""}"`,
          `"${row.contactName || ""}"`,
          `"${row.associateName || ""}"`,
          `"${row.contactMobile || ""}"`,
          `"${row.contactEmail || ""}"`,
          `"${row.contactCity || ""}"`,
          `"${row.contactRoute || ""}"`,
          `"${row.contactIndustry || ""}"`,
          `"${row.followupType || ""}"`,
          `"${row.followupOutcome || ""}"`,
          `"${row.followupTakenDate || ""}"`,
          `"${row.nextActionDate || ""}"`,
          `"${row.keyAccountManager || ""}"`,
          `"${row.createdDate || ""}"`,
          `"${row.createdBy || ""}"`,
          `"${row.followupDescription || ""}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "followups.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleReset = async () => {
    try {
      if (!token || !user?.id) {
        toast.error("Authentication details missing. Please log in again.");
        return;
      }
      const today = new Date();
      const todayStr = format(today, "yyyy-MM-dd");
      setStartDate(startOfDay(today));
      setEndDate(endOfDay(today));
      setStartDateInput(todayStr);
      setEndDateInput(todayStr);
      setGlobalFilter("");
      setIsRefetching(true);
      // Ensure state updates are applied before fetching
      await Promise.resolve();
      const response = await fetchFollowups(todayStr, todayStr);
      const responseData = Array.isArray(response) ? response[0] : response;
      if (
        responseData &&
        (responseData.STATUS === "SUCCESS" ||
          responseData.status === "SUCCESS" ||
          responseData.Status === "SUCCESS")
      ) {
        const mappedData = (responseData.DATA || responseData.data || []).map(
          (item) => ({
            id: item.interaction_id,
            contactAddress: item.full_address || "",
            followupAddress: item.gmapAddress || "",
            contactName: `${item?.contact_name} (${item?.contact_type == "1" ? "C" : "RC"
              })`,
            associateName: item.subsubordinate_names || "",
            contactMobile: item.contact_mobile_no || "",
            contactEmail: item.contact_email_address || "",
            contactCity: item.contact_city || "",
            contactRoute: item.route_name || "",
            contactIndustry: item.industries_name || "",
            followupType: item.followup_type || "",
            followupOutcome: item.outcome_name || "",
            followupTakenDate: item.followup_taken_dt || "",
            nextActionDate: item.nextaction_dt || "",
            keyAccountManager: item.emp_name_key || "",
            createdDate: item.interaction_dt || "",
            createdBy: item.emp_name || "",
            followupDescription: item.comments || "",
            attachment: [],
            interaction_id: item.interaction_id,
            contact_type: item.contact_type,
          })
        );
        setData(mappedData);
      } else {
        toast.error(
          responseData?.MSG ||
          responseData?.message ||
          "Failed to fetch followup data"
        );
      }
    } catch (err) {
      console.error("Reset API error:", err);
      toast.error(err.message || "Error during reset");
    } finally {
      setIsRefetching(false);
    }
  };

  const handleDateSearch = async () => {
    try {
      const parsedStart = parse(startDateInput, "yyyy-MM-dd", new Date());
      const parsedEnd = parse(endDateInput, "yyyy-MM-dd", new Date());
      if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime())) {
        toast.error("Invalid date format. Please select a valid date.");
        return;
      }
      setStartDate(startOfDay(parsedStart));
      setEndDate(endOfDay(parsedEnd));
      setIsRefetching(true);
      await refetch();
    } catch (err) {
      console.error("Search API error:", err);
      toast.error("Error during search: " + err.message);
    } finally {
      setIsRefetching(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorFn: (row) => ({
          contactAddress: row.contactAddress,
          followupAddress: row.followupAddress,
          interaction_id: row.interaction_id,
          contact_type: row.contact_type,
        }),
        id: "location",
        header: () => <div className="text-center text-white">Location</div>,
        cell: ({ row }) => {
          const {
            contactAddress,
            followupAddress,
            interaction_id,
            contact_type,
          } = row.getValue("location");
          const isContactAddressDisabled =
            !contactAddress || contactAddress.trim() === "";
          const isFollowupAddressDisabled =
            !followupAddress || followupAddress.trim() === "";

          return (
            <div className="flex items-center justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  handleDownloadInteractionFile(interaction_id, contact_type)
                }
                title="Download Interaction File"
                className="text-[#287F71] hover:text-[#1a5c4d] pr-0"
              >
                <Download className="h-4 w-4" />
              </Button>
              {isContactAddressDisabled ? (
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
                  title={`Contact Address: ${contactAddress}`}
                >
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      contactAddress
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#287F71] hover:text-[#1a5c4d] pr-0"
                  >
                    <MapPin className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {isFollowupAddressDisabled ? (
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
                  title={`Followup Address: ${followupAddress}`}
                >
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      followupAddress
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
        accessorKey: "contactName",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left w-full justify-start text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            Contact Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-left">{row.getValue("contactName")}</div>
        ),
      },
      {
        accessorKey: "associateName",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left w-full justify-start text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            Associate Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-left">{row.getValue("associateName")}</div>
        ),
      },
      {
        accessorKey: "contactMobile",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left w-full justify-start text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            Contact Mobile
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-left">{row.getValue("contactMobile")}</div>
        ),
      },
      {
        accessorKey: "contactEmail",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left w-full justify-start text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            Contact Email
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-left">{row.getValue("contactEmail")}</div>
        ),
      },
      {
        accessorKey: "contactCity",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left w-full justify-start text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            Contact City
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-left">{row.getValue("contactCity")}</div>
        ),
      },
      {
        accessorKey: "contactRoute",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left w-full justify-start text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            Contact Route
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-left">{row.getValue("contactRoute")}</div>
        ),
      },
      {
        accessorKey: "contactIndustry",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left w-full justify-start text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            Contact Industry
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-left">{row.getValue("contactIndustry")}</div>
        ),
      },
      {
        accessorKey: "followupType",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left w-full justify-start text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            Followup Type
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-left">{row.getValue("followupType")}</div>
        ),
      },
      {
        accessorKey: "followupOutcome",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left w-full justify-start text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            Followup Outcome
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-left">{row.getValue("followupOutcome")}</div>
        ),
      },
      {
        accessorKey: "followupTakenDate",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left w-full justify-start text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            Followup Taken Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-left">{row.getValue("followupTakenDate")}</div>
        ),
      },
      {
        accessorKey: "nextActionDate",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left w-full justify-start text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            Next Action Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-left">{row.getValue("nextActionDate")}</div>
        ),
      },
      {
        accessorKey: "keyAccountManager",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left w-full justify-start text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            Key A/C Manager
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-left">{row.getValue("keyAccountManager")}</div>
        ),
      },
      {
        accessorKey: "createdDate",
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
          <div className="text-left">{row.getValue("createdDate")}</div>
        ),
      },
      {
        accessorKey: "createdBy",
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
          <div className="text-left">{row.getValue("createdBy")}</div>
        ),
      },
      {
        accessorKey: "followupDescription",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left w-full justify-start text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            Followup Description
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-left">
            {row.getValue("followupDescription")
              ? row.getValue("followupDescription").length > 15
                ? row.getValue("followupDescription").substring(0, 15) + "..."
                : row.getValue("followupDescription")
              : ""}
          </div>
        ),
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
        row.getValue("contactName")?.toLowerCase().includes(search) ||
        row.getValue("associateName")?.toLowerCase().includes(search) ||
        row.getValue("contactMobile")?.toLowerCase().includes(search) ||
        row.getValue("contactEmail")?.toLowerCase().includes(search) ||
        row.getValue("contactCity")?.toLowerCase().includes(search) ||
        row.getValue("contactRoute")?.toLowerCase().includes(search) ||
        row.getValue("contactIndustry")?.toLowerCase().includes(search) ||
        row.getValue("followupType")?.toLowerCase().includes(search) ||
        row.getValue("followupOutcome")?.toLowerCase().includes(search) ||
        row.getValue("followupTakenDate")?.toLowerCase().includes(search) ||
        row.getValue("nextActionDate")?.toLowerCase().includes(search) ||
        row.getValue("keyAccountManager")?.toLowerCase().includes(search) ||
        row.getValue("createdDate")?.toLowerCase().includes(search) ||
        row.getValue("createdBy")?.toLowerCase().includes(search) ||
        row.getValue("followupDescription")?.toLowerCase().includes(search)
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
              Next Action From Date
            </label>
            <Input
              type="date"
              value={startDateInput}
              onChange={(e) => setStartDateInput(e.target.value)}
              className="w-full bg-white"
            />
          </div>
          <div className="flex flex-col gap-1 w-full sm:w-48">
            <label className="text-sm font-medium text-gray-700">
              Next Action To Date
            </label>
            <Input
              type="date"
              value={endDateInput}
              onChange={(e) => setEndDateInput(e.target.value)}
              className="w-full bg-white"
            />
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
          <Input
            type="text"
            placeholder="Search followups..."
            value={globalFilter || ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full sm:max-w-sm bg-[#fff]"
          />
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
            <Button
              className="w-full sm:w-auto bg-[#287F71] hover:bg-[#1a5c4d] text-white"
              onClick={() => setIsFollowupDialogOpen(true)}
            >
              Add Followup
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
                      className="text-left sm:text-sm text-base py-1 whitespace-nowrap"
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
          {/* <div className="text-sm">
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
              disabled={false}
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
      {isFollowupDialogOpen && (
        <AddFollowupForm
          isOpen={isFollowupDialogOpen}
          onClose={() => {
            setIsFollowupDialogOpen(false);
            setSelectedContact(null);
          }}
          onFollowupSubmit={handleFollowupSubmit}
        />
      )}
    </div>
  );
};

export default ContactFollowup;
