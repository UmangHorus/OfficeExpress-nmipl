"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ChevronDown,
  ArrowUpDown,
  MapPin,
  CalendarCheck,
  UserPlus,
  ShoppingCart,
  Pencil,
} from "lucide-react";
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
import { useLeadContactStore } from "@/stores/leadContact.store";
import { useRouter } from "next/navigation";
import ContactFollowupForm from "./ContactFollowupForm";
import { format } from "date-fns";
import { leadService } from "@/lib/leadService";
import { ContactForm } from "../forms/ContactForm";
import { useSharedDataStore } from "@/stores/sharedData.store";
import { ContactService } from "@/lib/ContactService";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "@radix-ui/react-label";
import { Modal } from "../shared/Modal";
import useLocationPermission from "@/hooks/useLocationPermission";

const ContactList = () => {
  const { user, token, location, appConfig } = useLoginStore();
  const contactLabel = useLoginStore(
    (state) => state.navConfig?.labels?.contacts || "Contact"
  );
  const { setLeadContact } = useLeadContactStore();
  const { companyBranchDivisionData, setCompanyBranchDivisionData, routeList } =
    useSharedDataStore();
  const checkAndRequestLocation = useLocationPermission();

  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [visitorFound, setVisitorFound] = useState([]);
  const [matchedVisitor, setMatchedVisitor] = useState(null);
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
  const [selectedContact, setSelectedContact] = useState(null);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isVisitOutDialogOpen, setIsVisitOutDialogOpen] = useState(false);
  const [visitOutContact, setVisitOutContact] = useState(null);
  const [visitOutAction, setVisitOutAction] = useState("");
  const [editContact, setEditContact] = useState(null); // New state for editing contact
  const [isSaveContact, setIsSaveContact] = useState(false); // New state for button disable

  // Check export permissions
  const canExport =
    appConfig?.user_role?.contact?.canExport == 1 &&
    appConfig?.user_role?.raw_contact?.canExportR == 1;

  // const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState("all");
  const queryClient = useQueryClient();
  const router = useRouter();

  const {
    data: contactData,
    error: contactError,
    isLoading: contactLoading,
    refetch: refetchContacts,
  } = useQuery({
    queryKey: ["contactList", user?.id, token],
    queryFn: () => ContactService.getContactList(token, user?.type, user?.id),
    enabled: !!user?.id && !!token,
    refetchOnMount: "always",
    staleTime: 0,
    cacheTime: 0,
  });

  useEffect(() => {
    if (contactData) {
      const responseData = Array.isArray(contactData)
        ? contactData[0]
        : contactData;
      if (responseData?.STATUS === "SUCCESS") {
        const contactList =
          responseData.DATA?.filter(
            (item) => item && item.contact_id && item.contact_name
          ).map((item) => {
            const contactTypeMap = {
              C: "1",
              RC: "6",
            };
            const mappedContactType = contactTypeMap[item.contact_type] || "";
            const isVisitorOut =
              responseData?.visitor_found[0]?.reference_id == item.contact_id &&
              responseData?.visitor_found[0]?.reference_type ==
                mappedContactType;
            const routes =
              item.route_values?.length > 0
                ? item.route_values.map((route) => route.RouteMaster.route_name)
                : [item.route_name || ""];
            return {
              id: item.contact_id || "",
              name: item?.contact_name || "",
              mobile: item.contact_mobile_no || "",
              email: item.contact_email_address || "",
              industry: item.industries_name || "",
              industries_id: item.industries_id || "",
              address_id: item.address_id || "",
              address1: item.address1 || "",
              area: item.area || "",
              city: item.city_name || "",
              zipcode: item.zipcode || "",
              route: routes,
              route_values: item.route_values || [],
              state: item.state || "",
              country: item.country || "",
              location: item.full_address || "",
              visitStatus: isVisitorOut ? "out" : null,
              contact_type: item.contact_type || "",
              contact_title: item.contact_title || "",
              ev_id: item.ev_id || null,
            };
          }) || [];
        setVisitorFound(responseData?.visitor_found || []);
        setData(contactList);
        setFilteredData(contactList);
      } else {
        console.error(responseData?.MSG || "Failed to fetch contact list");
        toast.error(responseData?.MSG || "Failed to fetch contact list");
      }
    }
    if (contactError) {
      console.error("Error fetching contacts:", contactError.message);
      toast.error("Error fetching contacts: " + contactError.message);
    }
  }, [contactData, contactError]);

  // const {
  //   data: routeData,
  //   error: routeError,
  //   isLoading: routeLoading,
  // } = useQuery({
  //   queryKey: ["routeList", token, user?.id],
  //   queryFn: () => ContactService.getRouteList(token, user?.id),
  //   enabled: !!token && !!user?.id,
  //   refetchOnMount: "always",
  //   staleTime: 0,
  //   cacheTime: 0,
  // });

  // useEffect(() => {
  //   if (routeData) {
  //     const responseData = Array.isArray(routeData) ? routeData[0] : routeData;
  //     if (responseData?.STATUS === "SUCCESS") {
  //       setRoutes(responseData?.DATA?.routelist_arr || []);
  //     } else {
  //       console.error(responseData?.MSG || "Failed to fetch route list");
  //       // toast.error(responseData?.MSG || "Failed to fetch route list");
  //     }
  //   }
  //   if (routeError) {
  //     console.error("Error fetching routes:", routeError.message);
  //     toast.error("Error fetching routes: " + routeError.message);
  //   }
  // }, [routeData, routeError]);

  useEffect(() => {
    const value = selectedRoute === "all" ? "" : selectedRoute;
    if (value) {
      const filtered = data.filter((item) =>
        item.route_values.some(
          (route) => route.RouteMaster.route_id == selectedRoute
        )
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(data);
    }
  }, [data, selectedRoute]);

  const {
    data: companyData,
    error: companyError,
    isLoading: companyLoading,
  } = useQuery({
    queryKey: ["companyBranchDivisionData", user?.id, token],
    queryFn: () => leadService.getCompanyBranchDivisionData(token, user?.id),
    enabled: !!user?.id && !!token && !companyBranchDivisionData,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (companyData) {
      const responseData = Array.isArray(companyData)
        ? companyData[0]
        : companyData;
      if (responseData?.STATUS === "SUCCESS") {
        setCompanyBranchDivisionData(responseData.DATA);
      } else {
        console.error(responseData?.MSG || "Invalid company response data");
        toast.error(responseData?.MSG || "Invalid company response data");
      }
    }
  }, [companyData, companyBranchDivisionData, setCompanyBranchDivisionData]);

  useEffect(() => {
    if (visitorFound.length > 0) {
      const visitor = visitorFound[0];
      const contactType =
        visitor.reference_type == "1"
          ? "C"
          : visitor.reference_type == "6"
          ? "RC"
          : null;

      if (contactType) {
        const found = data.find(
          (item) =>
            item.id == visitor.reference_id && item.contact_type == contactType
        );
        setMatchedVisitor(found);
      }
    }
  }, [visitorFound]);

  const addContactMutation = useMutation({
    mutationFn: async ({ data, selectedcompany, inputvalue }) => {
      const contactData = {
        country: data.country,
        state: data.state,
        contact_title: data.title,
        name: data.name,
        company_name: selectedcompany ? selectedcompany.title : inputvalue,
        email: data.Email,
        mobile: data.mobile,
        address1: data.address,
        city: data.city,
        industry_id: data.industry,
        zipcode: data.pincode,
        area: data.area,
        created_by: user.id,
        routes: data.routes,
      };
      const response = await leadService.saveRawContact(contactData);
      return { response };
    },
    onMutate: () => {
      setIsSaveContact(true); // Disable button before API call
    },
    onSuccess: async ({ response }) => {
      const responseData = Array.isArray(response) ? response[0] : response;
      if (responseData?.STATUS === "SUCCESS") {
        setIsContactDialogOpen(false);
        toast.success("Contact added successfully!",{
            duration: 2000,
          });
        refetchContacts();
      } else {
        throw new Error(responseData?.MSG || "Failed to add contact");
      }
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.MSG ||
        error.message ||
        "Failed to add contact. Please try again.";
      toast.error(errorMessage);
    },
    onSettled: () => {
      setIsSaveContact(false); // Re-enable button after API call
    },
  });

  const editContactMutation = useMutation({
    mutationFn: async ({
      data,
      selectedcompany,
      inputvalue,
      contactId,
      contactType,
      addressId,
    }) => {
      const contactTypeMap = {
        C: "1",
        RC: "6",
      };
      const mappedContactType = contactTypeMap[contactType] || contactType;
      const contactData = {
        contact_id: contactId,
        contact_type: mappedContactType,
        country: data.country,
        state: data.state,
        // contact_title: data.title,
        name: data.name,
        // company_name: selectedcompany ? selectedcompany.title : inputvalue,
        email: data.Email,
        // mobile: data.mobile,
        address_id: addressId, // Use address_id if available
        address1: data.address,
        city: data.city,
        industry_id: data.industry,
        zipcode: data.pincode,
        area: data.area,
        routes: data.routes,
      };
      const response = await leadService.updateContactandRawContact(
        contactData
      );
      return { response };
    },
    onMutate: () => {
      setIsSaveContact(true); // Disable button before API call
    },
    onSuccess: async ({ response }) => {
      const responseData = Array.isArray(response) ? response[0] : response;
      if (responseData?.STATUS === "SUCCESS") {
        setIsContactDialogOpen(false);
        setEditContact(null);
        toast.success("Contact updated successfully!",{
            duration: 2000,
          });
        refetchContacts();
      } else {
        throw new Error(responseData?.MSG || "Failed to update contact");
      }
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.MSG ||
        error.message ||
        "Failed to update contact. Please try again.";
      toast.error(errorMessage);
    },
    onSettled: () => {
      setIsSaveContact(false); // Re-enable button after API call
    },
  });

  const handleAddContact = (data, selectedcompany, inputvalue) => {
    addContactMutation.mutate({ data, selectedcompany, inputvalue });
  };

  const handleEditContact = (
    data,
    selectedcompany,
    inputvalue,
    contactId,
    contactType,
    addressId
  ) => {
    editContactMutation.mutate({
      data,
      selectedcompany,
      inputvalue,
      contactId,
      contactType,
      addressId,
    });
  };

  // const handleExportCSV = () => {
  //   try {
  //     const rows = globalFilter
  //       ? table.getRowModel().rows.map((row) => row.original)
  //       : filteredData;
  //     if (!rows || rows.length === 0) {
  //       toast.error("No data available to export");
  //       return;
  //     }
  //     const headers = [
  //       "ID",
  //       "Name",
  //       "Mobile",
  //       "Email",
  //       "Industry",
  //       "Area",
  //       "City",
  //       "Route",
  //       "State",
  //       "Country",
  //       "Location",
  //       "Contact Type",
  //     ];
  //     const csvContent = [
  //       headers.join(","),
  //       ...rows.map((row) =>
  //         [
  //           row.id || "",
  //           `"${row.name || ""}"`,
  //           row.mobile || "",
  //           `"${row.email || ""}"`,
  //           row.industry || "",
  //           row.area || "",
  //           row.city || "",
  //           row.route || "",
  //           row.state || "",
  //           row.country || "",
  //           `"${row.location || ""}"`,
  //           row.contact_type || "",
  //         ].join(",")
  //       ),
  //     ].join("\n");
  //     const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  //     const link = document.createElement("a");
  //     const url = URL.createObjectURL(blob);
  //     link.href = url;
  //     link.download = `${contactLabel}_${format(new Date(), "yyyy-MM-dd")}.csv`;
  //     document.body.appendChild(link);
  //     link.click();
  //     setTimeout(() => {
  //       document.body.removeChild(link);
  //       URL.revokeObjectURL(url);
  //     }, 100);
  //   } catch (error) {
  //     console.error("Export failed:", error);
  //     toast.error("Failed to export data. Please try again.");
  //   }
  // };

  const handleExportCSV = () => {
    // Excel-compatible CSV format with BOM for UTF-8
    const BOM = "\uFEFF";
    const headers = [
      "Location",
      "Name",
      "Mobile",
      "Email",
      "Industry",
      "Area",
      "City",
      "State",
      "Country",
      "Postal Code",
      "Routes",
    ];

    const csvData = filteredData.map((contact) => {
      const escapeCsv = (str) => {
        if (!str) return "";
        return `"${String(str).replace(/"/g, '""')}"`;
      };

      // Append contact type to name if it exists
      const formattedName = contact.contact_type
        ? `${contact.name} (${contact.contact_type})`
        : contact.name;

      return [
        escapeCsv(contact.location),
        escapeCsv(formattedName), // Now includes contact type in parentheses
        contact.mobile,
        contact.email,
        escapeCsv(contact.industry),
        escapeCsv(contact.area),
        escapeCsv(contact.city),
        escapeCsv(contact.state),
        escapeCsv(contact.country),
        contact.zipcode,
        escapeCsv(contact.route?.join(", ")),
      ];
    });

    const csvContent =
      BOM +
      [headers.join(","), ...csvData.map((row) => row.join(","))].join("\r\n"); // \r\n for Excel compatibility

    // Download with current date in filename
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadFile(csvContent, `${contactLabel}_export_${dateStr}.csv`);
  };

  // Helper function for download
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

  const handleAddLead = (id, type) => {
    setLeadContact(id, type, visitorFound[0]);
    const queryParams = new URLSearchParams({
      contact_id: id,
      contact_type: type,
      ev_id: visitorFound[0]?.ev_id || "",
    });
    router.replace(`/leads/create?${queryParams.toString()}`); // 👈 Replaces URL
  };

  const handleAddOrder = (id, type) => {
    setLeadContact(id, type, visitorFound[0]);
    const queryParams = new URLSearchParams({
      contact_id: id,
      contact_type: type,
      ev_id: visitorFound[0]?.ev_id || "",
    });
    router.replace(`/orders/create?${queryParams.toString()}`); // 👈 Replaces URL
  };

  const handleVisitIn = async (id, contactType) => {
    setDisabledVisitIn(true);
    try {
      if (!user?.id || !user?.type) {
        toast.error("User information is missing.");
        return;
      }
      const referenceType = contactType === "C" ? "1" : "6";
      const response = await ContactService.employeeVisitorInOut(
        token,
        "in",
        user.id,
        id,
        referenceType
      );
      const result = response[0] || {};
      if (result.STATUS === "SUCCESS") {
        await refetchContacts();
        toast.success("Visit In recorded successfully.",{
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

  const handleVisitOut = async (id, contactType, name) => {
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
      setVisitOutContact({ id, contactType, name });
      setIsVisitOutDialogOpen(true);
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

  const handleVisitOutAction = () => {
    if (!visitOutContact) return;
    const { id, contactType, name } = visitOutContact;
    switch (visitOutAction) {
      case "followup":
        setSelectedContact({ id, contactType, name });
        setIsFollowupDialogOpen(true);
        break;
      case "lead":
        handleAddLead(id, contactType);
        break;
      case "order":
        handleAddOrder(id, contactType);
        break;
      default:
        toast.error("Please select an action.");
        return;
    }
    setIsVisitOutDialogOpen(false);
    setVisitOutAction("");
    setVisitOutContact(null);
  };

  const handleFollowupSubmit = async (followupData) => {
    try {
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
          location
        );
      const followupResult = followupResponse[0] || {};
      if (followupResult.STATUS === "SUCCESS") {
        const referenceType = followupData.contactType === "C" ? "1" : "6";
        const visitorResponse = await ContactService.employeeVisitorInOut(
          token,
          "out",
          user.id,
          followupData.contactId,
          referenceType,
          visitorFound[0].ev_id
        );
        const visitorResult = visitorResponse[0] || {};
        if (visitorResult.STATUS === "SUCCESS") {
          await refetchContacts();
          toast.success("Follow-up added and Visit Out recorded successfully.",{
            duration: 2000,
          });
          setIsFollowupDialogOpen(false);
          setSelectedContact(null);
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
      {
        id: "visit",
        header: "Visit",
        cell: ({ row }) => {
          const lead = row.original || {};
          const contactTypeMap = {
            C: "1",
            RC: "6",
          };
          const mappedContactType = contactTypeMap[lead.contact_type] || "";
          const isVisitorMismatch =
            visitorFound.length > 0 &&
            (lead.id != visitorFound[0]?.reference_id ||
              mappedContactType != visitorFound[0]?.reference_type);
          if (lead.visitStatus === "out") {
            return (
              <Button
                variant="default"
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 w-full px-1"
                onClick={() =>
                  handleVisitOut(lead.id, lead.contact_type, lead.name)
                }
                disabled={disabledVisitOut || isVisitorMismatch}
              >
                Visit Out
              </Button>
            );
          }
          return (
            <Button
              variant="default"
              size="sm"
              className={`mx-auto text-white w-full px-1 ${
                lead.ev_id
                  ? "bg-[#4a5a6b] hover:bg-[#5c6b7a]"
                  : "bg-[#287f71] hover:bg-[#20665a]"
              }`}
              onClick={() => handleVisitIn(lead.id, lead.contact_type)}
              disabled={disabledVisitIn || isVisitorMismatch}
            >
              Visit In
            </Button>
          );
        },
        enableHiding: false,
      },
      {
        accessorKey: "location",
        header: "Location",
        cell: ({ row }) => {
          const location = row.getValue("location") || "";
          const isLocationDisabled = !location || location.trim() === "";
          return (
            <div className="flex items-center justify-center">
              {isLocationDisabled ? (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={true}
                  title="No location available"
                  className="cursor-not-allowed"
                >
                  <MapPin className="h-4 w-4 text-gray-400" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  title={`Contact Address: ${location}`}
                >
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      location
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#287f71] hover:text-[#1a5c4d]"
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
        id: "edit",
        header: () => <div className="text-center text-white">Edit</div>,
        cell: ({ row }) => {
          const contact = row.original;
          return (
            <div className="text-center flex justify-center gap-2">
              <Pencil
                className="h-5 w-5 text-[#D97706] hover:text-[#B45309] cursor-pointer"
                onClick={() => {
                  setEditContact(contact);
                  setIsContactDialogOpen(true);
                }}
              />
            </div>
          );
        },
        enableHiding: false,
      },
      {
        accessorKey: "id",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left w-full justify-start text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            ID
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div>{row.getValue("id") || ""}</div>,
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left w-full justify-start text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div>
            {row.getValue("name") || ""}
            {row.original.contact_type && (
              <span className="ml-1">({row.original.contact_type})</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "mobile",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left w-full justify-start text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            Mobile
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div>{row.getValue("mobile") || ""}</div>,
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left w-full justify-start text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            Email
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div>{row.getValue("email") || ""}</div>,
      },
      {
        accessorKey: "industry",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left w-full justify-start text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            Industry
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div>{row.getValue("industry") || ""}</div>,
      },
      {
        accessorKey: "area",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left w-full justify-start text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            Area
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div>{row.getValue("area") || ""}</div>,
      },
      {
        accessorKey: "city",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left w-full justify-start text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            City
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div>{row.getValue("city") || ""}</div>,
      },
      {
        accessorKey: "route",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left w-full justify-start text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            Route
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const routes = row.getValue("route") || [];
          if (routes.length === 0) {
            return <div>-</div>;
          }
          return <div>{routes.join(" / ")}</div>;
        },
      },
      {
        accessorKey: "state",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left w-full justify-start text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            State
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div>{row.getValue("state") || ""}</div>,
      },
      {
        accessorKey: "country",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left w-full justify-start text-white hover:text-white hover:bg-[#4a5a6b]"
          >
            Country
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div>{row.getValue("country") || ""}</div>,
      },
    ],
    [
      handleVisitIn,
      handleVisitOut,
      filteredData,
      visitorFound,
      disabledVisitIn,
      disabledVisitOut,
    ]
  );

  const table = useReactTable({
    data: filteredData,
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
      if (!filterValue) return true;
      const search = filterValue.toLowerCase();
      const fields = [
        "id",
        "name",
        "mobile",
        "email",
        "industry",
        "area",
        "city",
        "route",
        "state",
        "country",
        "location",
      ];
      return fields.some((field) => {
        const value = row.getValue(field);
        return value ? String(value).toLowerCase().includes(search) : false;
      });
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
      {visitorFound.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-100 border-l-4 border-yellow-500">
          <p className="font-bold text-yellow-700">
            {matchedVisitor ? (
              <>
                Visit status: <span className="">Pending check-out</span> for{" "}
                <span className="underline">{matchedVisitor.name}</span>
                {matchedVisitor.mobile && (
                  <>, Mobile: {matchedVisitor.mobile}</>
                )}
              </>
            ) : (
              <>
                Visit status: <span className="">Pending check-out</span> for{" "}
                <span className="underline">
                  Reference ID: {visitorFound[0].reference_id}
                </span>
                (Type:{" "}
                {visitorFound[0].reference_type == "1" ? "Customer" : "RC"})
              </>
            )}
          </p>
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 py-4">
        {/* Search and Route Selector */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Input
            placeholder={`Search ${contactLabel}...`}
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="w-full sm:max-w-sm bg-[#fff]"
          />

          {routeList.length > 0 && (
            <Select
              value={selectedRoute}
              onValueChange={setSelectedRoute}
              // disabled={routeLoading || routeError}
            >
              <SelectTrigger className="w-full sm:w-[200px] bg-[#fff]">
                <SelectValue placeholder="Select Route" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Routes</SelectItem>
                {routeList.map((route) => (
                  <SelectItem key={route.route_id} value={route.route_id}>
                    {route.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Action Buttons - Two lines on mobile */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:ml-auto">
          {/* Second Line - Columns (aligned to end) */}
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
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {/* First Line - Add New + Export */}

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
              onClick={() => setIsContactDialogOpen(true)}
              className="w-full sm:w-auto bg-[#287F71] hover:bg-[#1a5c4d] text-white"
            >
              {`Add New ${contactLabel}`}
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
            {contactLoading ? (
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
        <div className="flex items-center flex-col md:flex-row space-x-4">
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
          <div className="text-sm text-muted-foreground">
            {pagination.pageIndex * pagination.pageSize + 1}-
            {Math.min(
              (pagination.pageIndex + 1) * pagination.pageSize,
              filteredData.length
            )}{" "}
            of {filteredData.length} rows
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
      {selectedContact && (
        <ContactFollowupForm
          isOpen={isFollowupDialogOpen}
          onClose={() => {
            setIsFollowupDialogOpen(false);
            setSelectedContact(null);
          }}
          onFollowupSubmit={handleFollowupSubmit}
          contact={selectedContact}
        />
      )}
      {/* dialog for three option after visit out  */}
      <Dialog
        open={isVisitOutDialogOpen}
        onOpenChange={setIsVisitOutDialogOpen}
      >
        <DialogContent className="w-[90vw] max-w-[425px] md:w-full md:max-w-[600px] lg:max-w-[800px] max-h-[90vh] overflow-y-auto bg-white p-4 sm:p-6 rounded-lg">
          <DialogHeader>
            <DialogTitle>Select Post Visit Action</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <RadioGroup
              value={visitOutAction}
              onValueChange={setVisitOutAction}
              className="grid gap-4 py-4"
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem
                  value="followup"
                  id="followup"
                  className="text-white data-[state=checked]:border-[#287f71] [&[data-state=checked]>span>svg]:fill-[#287f71] h-5 w-5"
                />
                <Label
                  htmlFor="followup"
                  className="flex items-center gap-2 font-normal cursor-pointer"
                >
                  <div className="p-2 rounded-lg bg-[#287f71]/10 text-[#287f71]">
                    <CalendarCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Add Followup</p>
                    <p className="text-sm text-muted-foreground">
                      Schedule a future follow-up
                    </p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <RadioGroupItem
                  value="lead"
                  id="lead"
                  className="text-white data-[state=checked]:border-[#287f71] [&[data-state=checked]>span>svg]:fill-[#287f71] h-5 w-5"
                />
                <Label
                  htmlFor="lead"
                  className="flex items-center gap-2 font-normal cursor-pointer"
                >
                  <div className="p-2 rounded-lg bg-[#287f71]/10 text-[#287f71]">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Create Lead</p>
                    <p className="text-sm text-muted-foreground">
                      Convert to potential business
                    </p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <RadioGroupItem
                  value="order"
                  id="order"
                  className="text-white data-[state=checked]:border-[#287f71] [&[data-state=checked]>span>svg]:fill-[#287f71] h-5 w-5"
                />
                <Label
                  htmlFor="order"
                  className="flex items-center gap-2 font-normal cursor-pointer"
                >
                  <div className="p-2 rounded-lg bg-[#287f71]/10 text-[#287f71]">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Place Order</p>
                    <p className="text-sm text-muted-foreground">
                      Create a sales order
                    </p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsVisitOutDialogOpen(false);
                setVisitOutAction("");
                setVisitOutContact(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVisitOutAction}
              disabled={!visitOutAction}
              className="bg-[#287f71] hover:bg-[#20665a]"
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Form Dialog */}
      <Modal
        open={isContactDialogOpen}
        onOpenChange={setIsContactDialogOpen}
        title={editContact ? `Edit ${contactLabel}` : `Add New ${contactLabel}`}
        onCancel={() => {
          setIsContactDialogOpen(false);
          setEditContact(null);
        }}
      >
        <ContactForm
          onAddContactSubmit={
            editContact ? handleEditContact : handleAddContact
          }
          onCancel={() => {
            setIsContactDialogOpen(false);
            setEditContact(null);
          }}
          contact={editContact}
          isSaveContact={isSaveContact} // Pass isSaveContact to ContactForm
        />
      </Modal>

      
    </div>
  );
};

export default ContactList;
