"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLoginStore } from "@/stores/auth.store";
import { useSharedDataStore } from "@/stores/sharedData.store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import BranchSelector from "@/components/selectors/BranchSelector";
import CompanySelector from "@/components/selectors/CompanySelector";
import DivisionSelector from "@/components/selectors/DivisionSelector";
import FileUploadCard from "../inputs/FileUploadCard";
import EditableProductTable from "./EditableProductTable";
import ProductSelectionTable from "./ProductSelectionTable";
import VoiceNoteRecorder from "../inputs/VoiceNoteRecorder";
import DeliveryOptions from "@/components/selectors/DeliveryOptions";
import RemarksField from "@/components/inputs/RemarksField";
import { Triangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContactSearch } from "@/components/inputs/search";
import { Modal } from "@/components/shared/Modal";
import { ContactForm } from "@/components/forms/ContactForm";
import { leadService } from "@/lib/leadService";
import { format, parse } from "date-fns";
import { OTPDialog } from "../shared/OtpDialog";
import useBasicSettingsStore from "@/stores/basicSettings.store";
import { ContactService } from "@/lib/ContactService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LeadTitleDialog } from "../shared/LeadTitleDialog";
import { Input } from "../ui/input";
import { requestLocationPermission } from "@/utils/location";
import useLocationPermission from "@/hooks/useLocationPermission";

const CreateLeadPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, token, navConfig, appConfig, location } = useLoginStore();
  const searchParams = useSearchParams();
  const {
    companyBranchDivisionData,
    companyInfo,
    companyDetails,
    setCompanyBranchDivisionData,
    setCompanyInfo,
    setCompanyDetails,
  } = useSharedDataStore();
  const { maincompany_id, mainbranch_id, setLoading, setError } =
    useBasicSettingsStore();
  const companies = companyBranchDivisionData?.companies || [];
  const divisions = companyBranchDivisionData?.division || [];
  const checkAndRequestLocation = useLocationPermission();
  const secUnitConfig = companyDetails?.sec_unit_config || "0";
  const contactIdParam = searchParams.get("contact_id");
  const contactTypeParam = searchParams.get("contact_type");
  const evIdParam = searchParams.get("ev_id");
  const enabledOtpPortal = companyDetails?.enabled_otp_portal;
  const enabledLeadTitle = companyDetails?.enable_lead_title;
  const leadLabel = navConfig?.labels?.leads || "Lead";
  const contactLabel = useLoginStore(
    (state) => state.navConfig?.labels?.contacts || "Contact"
  );
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [deliveryOption, setDeliveryOption] = useState("");
  const [remarks, setRemarks] = useState("");
  const [showAddButton, setShowAddButton] = useState(true);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactList, setContactList] = useState([]);
  const [productList, setProductList] = useState([]);
  const [activeTab, setActiveTab] = useState("Upload Order Details");
  const [singleFile, setSingleFile] = useState(null);
  const [multipleFiles, setMultipleFiles] = useState([]);
  const [voiceNoteBlob, setVoiceNoteBlob] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null); // Store selected contact
  const [pendingContactDetails, setPendingContactDetails] = useState(null); // Store CONTACT_DETAILS
  const [editableProducts, setEditableProducts] = useState([
    { id: 1, name: "", qty: "", unit: "" },
  ]);
  const [selectedtypeOption, setSelectedTypeOption] = useState("lead-option");

  // State for Lead Section
  const [leadTitleList, setLeadTitleList] = useState([]); // Array of lead titles, e.g., [{ id: '1', name: 'Lead Title A' }, ...]
  const [selectedLeadTitle, setSelectedLeadTitle] = useState(""); // ID of selected lead title
  const [isLeadTitleDialogOpen, setIsLeadTitleDialogOpen] = useState(false); // Dialog open state
  const [leadTitleValue, setLeadTitleValue] = useState(""); // Input value for new lead title
  const [inputLeadTitleValue, setInputLeadTitleValue] = useState(""); // Input value for Input field when enabledLeadTitle !== "Y"
  const [isLoading, setIsLoading] = useState(false); // Loading state for submission
  const [leadTitleErrorMsg, setLeadTitleErrorMsg] = useState(""); // Error message for lead title input
  const [lastAddedLeadTitle, setLastAddedLeadTitle] = useState(""); // Track the last added lead title
  const [isSaveContact, setIsSaveContact] = useState(false); // New state for button disable

  // Function to generate a unique ID (using timestamp for simplicity)
  const generateUniqueId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  // Initialize formValues
  const getInitialFormValues = (selectedtypeOption, secUnitConfig) => {
    // const selectedtypeOption = "salesorder-option"; // Hardcoded as per requirement

    const baseFormValues = {
      unique_id: generateUniqueId(), // Add unique_id
      productid: "",
      productname: "",
      // categoryname: "",
      // categoryid: "",
      productqty: "",
      unit: "",
      stock: "",
      rate: "",
      product_image: "",
      secondary_base_qty: "0",
      sec_unit: "",
      productcode: "",
      totalrate: "",
      SecQtyReverseCalculate: 0,
      unitvalue: "0",
      proddivision: "",
      stock_data: [],
      Attribute_data: {},
      attribute: {}, // Added attribute
      scheduleDate: format(new Date(), "yyyy-MM-dd"),
      discount: "",
      discount_amount: "",
      mrp_price: "",
      sec_unit_mrp_rate: "",
      unit_con_mode: null,
      sec_unit_rate: "0",
    };

    const enhancedFormValues = {
      ...baseFormValues,
      conversion_flg: "1",
      primary_unit_id: "",
      secondary_unit_id: "",
      SecQtyTotal: "",
    };

    if (selectedtypeOption == "lead-option") {
      return [baseFormValues];
    } else if (
      selectedtypeOption == "salesorder-option" &&
      secUnitConfig == "0"
    ) {
      return [baseFormValues];
    } else if (
      selectedtypeOption == "salesorder-option" &&
      secUnitConfig == "1"
    ) {
      return [enhancedFormValues];
    } else {
      return [baseFormValues];
    }
  };

  // Form values initialization
  const [formValues, setFormValues] = useState([]);

  // Update formValues when secUnitConfig changes
  useEffect(() => {
    const newFormValues = getInitialFormValues(
      selectedtypeOption,
      secUnitConfig
    );
    setFormValues(newFormValues);
  }, [secUnitConfig, selectedtypeOption]);

  // found contact from search params fron contact list
  useEffect(() => {
    if (searchParams && contactList.length > 0) {
      // const contactId = searchParams.get("contact_id");
      // const contactTypeParam = searchParams.get("contact_type");

      // Map contact_type parameter to numeric type
      let contactType;
      if (contactTypeParam == "C") {
        contactType = 1;
      } else if (contactTypeParam == "RC") {
        contactType = 6;
      }

      if (contactIdParam && contactType) {
        const foundContact = contactList.find(
          (contact) =>
            contact.id == contactIdParam && contact.type == contactType
        );

        if (foundContact) {
          setSelectedContact(foundContact);
        } else {
          console.warn("No matching contact found for the given parameters");
        }
      }
    }
  }, [searchParams, contactList]);

  // OTP state and create lead state start
  const [otpValue, setOtpValue] = useState("");
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpKey, setOtpKey] = useState("");

  // Mutations
  const generateOtpMutation = useMutation({
    mutationFn: (contactMobile) => leadService.generateOtp(contactMobile),
    onSuccess: (data, contactMobile) => {
      const responseData = Array.isArray(data) ? data[0] : data;

      if (responseData?.STATUS === "SUCCESS") {
        setOtpKey(responseData.DATA || "");
        setOtpDialogOpen(true);
        setOtpValue("");
        setTimeout(
          () =>
            document
              .querySelector('input[autocomplete="one-time-code"]')
              ?.focus(),
          100
        );
        toast.success(responseData.MSG || `OTP sent to ${contactMobile}`, {
          duration: 2000,
        });
      } else {
        throw new Error(responseData?.MSG || "Failed to send OTP");
      }
    },
    onError: (error) => {
      console.error("Generate OTP error:", error);
      toast.error(error.message || "Failed to generate OTP");
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: ({ contact, objectId, objectType, verifyOTP, key }) =>
      leadService.verifyOtp(contact, objectId, objectType, verifyOTP, key),
    onSuccess: async (data) => {
      const responseData = Array.isArray(data) ? data[0] : data;

      if (responseData?.STATUS === "SUCCESS") {
        if (!responseData.PHPTOKEN) {
          throw new Error("Authentication token missing");
        }
        toast.success("OTP verified successfully. Proceeding to save lead.", {
          duration: 2000,
        });
        // After successful OTP verification, save lead data
        await saveLeadMutation.mutateAsync({
          selectedContact: selectedContact,
          leadTitle:
            enabledLeadTitle == "Y" ? selectedLeadTitle : inputLeadTitleValue,
          user: user,
          selectedCompany: selectedCompany,
          selectedBranch: appConfig?.branch_id,
          maincompany_id: maincompany_id,
          mainbranch_id: mainbranch_id,
          selectedDivision: selectedDivision,
          location: location,
          activeTab: activeTab,
          singleFile: singleFile ? [singleFile] : [],
          multipleFiles: multipleFiles,
          voiceNoteBlob: voiceNoteBlob,
          formValues: formValues,
          editableProducts: editableProducts,
          remarks: remarks,
        });
      } else {
        throw new Error(responseData?.MSG || "OTP verification failed");
      }
    },
    onError: (error) => {
      throw error; // Propagate to OTPDialog
    },
  });

  const handleRecordVisitOut = async () => {
    if (!contactIdParam || !contactTypeParam || !evIdParam) return;

    try {
      const referenceType = contactTypeParam == "C" ? "1" : "6";
      const visitorResponse = await ContactService.employeeVisitorInOut(
        token,
        "out",
        user.id,
        contactIdParam,
        referenceType,
        evIdParam
      );

      const visitorResult = visitorResponse[0] || {};
      if (visitorResult.STATUS == "SUCCESS") {
        return true;
      } else {
        toast.error(visitorResult.MSG || "Visit Out recording failed.");
        return false;
      }
    } catch (error) {
      console.error("Error recording Visit Out:", error);
      toast.error("Failed to record Visit Out.");
      return false;
    }
  };

  const saveLeadMutation = useMutation({
    mutationFn: (leadData) => {
      if (!leadData) {
        throw new Error("leadData is undefined");
      }
      return leadService.saveMedBotLeadData(leadData);
    },
    onSuccess: async (data) => {
      const responseData = Array.isArray(data) ? data[0] : data;

      if (responseData?.STATUS === "SUCCESS") {
        // Reset form
        setEditableProducts([{ id: 1, name: "", qty: "", unit: "" }]);
        setSelectedContact(null);
        setOtpValue("");
        setOtpKey("");
        setActiveTab("Upload Order Details");
        setSingleFile(null);
        setMultipleFiles([]);
        setVoiceNoteBlob(null);
        setRemarks("");
        setFormValues([
          {
            unique_id: generateUniqueId(), // Add unique_id
            productid: "",
            productname: "",
            // categoryname: "",
            // categoryid: "",
            productqty: "",
            unit: "",
            stock: "",
            rate: "",
            product_image: "",
            secondary_base_qty: "0",
            sec_unit: "",
            productcode: "",
            totalrate: "",
            SecQtyReverseCalculate: 0,
            unitvalue: "0",
            proddivision: "",
            stock_data: [],
            Attribute_data: {},
            attribute: {}, // Added attribute
            scheduleDate: format(new Date(), "yyyy-MM-dd"),
            discount: "",
            discount_amount: "",
            mrp_price: "",
            sec_unit_mrp_rate: "",
            unit_con_mode: null,
            sec_unit_rate: "0",
          },
        ]);

        // Record Visit Out if params exist
        if (contactIdParam && contactTypeParam && evIdParam) {
          const visitOutSuccess = await handleRecordVisitOut();
          if (visitOutSuccess) {
            toast.success("Lead created and Visit Out recorded successfully.", {
              duration: 2000,
            });
          } else {
            toast.success(
              "Lead created successfully (Visit Out recording failed)",
              {
                duration: 2000,
              }
            );
          }
          // Redirect to /contacts when params exist
          router.push("/contacts");
        } else {
          toast.success("Lead created successfully", {
            duration: 2000,
          });
          // Redirect to /leads when params are not present
          router.push("/leads");
        }
      } else {
        throw new Error(responseData?.MSG || "Failed to save lead");
      }
    },
    onError: (error) => {
      console.error("Save lead error:", error);
      toast.error(error.message || "Failed to save lead");
    },
  });

  const handleCreateLead = async () => {
    try {
      // Check location permissions
      await checkAndRequestLocation(`${leadLabel} creation`);

      // Check if contact is selected
      if (user?.isEmployee && !selectedContact) {
        toast.error("Please select a contact to proceed", {
          duration: 2000,
        });
        return;
      }

      if (user?.isEmployee && !selectedContact?.mobile) {
        toast.error(
          "The selected contact does not have a valid mobile number. OTP cannot be sent.",
          {
            duration: 2000,
          }
        );
        return;
      }

      // Check if lead title is selected or provided
      if (enabledLeadTitle == "Y" && !selectedLeadTitle) {
        toast.error(`Please select a ${leadLabel} title to proceed`, {
          duration: 2000,
        });
        return;
      }

      if (enabledLeadTitle != "Y" && !inputLeadTitleValue.trim()) {
        toast.error(`Please enter a ${leadLabel} title to proceed`, {
          duration: 2000,
        });
        return;
      }

      // Check for Upload Order Details tab
      if (activeTab == "Upload Order Details") {
        if (!singleFile) {
          toast.error("Please upload a single file to proceed", {
            duration: 2000,
          });
          return;
        }
      }

      // Check for Upload by Products tab
      if (activeTab == "Upload by Products") {
        if (!editableProducts || editableProducts.length == 0) {
          toast.error("Please add at least one product to proceed", {
            duration: 2000,
          });
          return;
        }

        // Validate each product line item
        for (const product of editableProducts) {
          if (!product.name) {
            toast.error(
              `Product ID ${product.id}: Please provide a product name`,
              {
                duration: 2000,
              }
            );
            return;
          }
          if (!product.qty || Number(product.qty) <= 0) {
            // Modified check
            toast.error(
              `Product ID ${product.id}: Quantity must be greater than 0`,
              {
                duration: 2000,
              }
            );
            return;
          }
          if (!product.unit) {
            toast.error(`Product ID ${product.id}: Please provide a unit`, {
              duration: 2000,
            });
            return;
          }
        }
      }

      // Check for Select Products tab
      if (activeTab == "Select Products") {
        if (!formValues || formValues.length == 0) {
          toast.error("Please select at least one product to proceed", {
            duration: 2000,
          });
          return;
        }

        // Validate each product line item for productid and productqty
        for (const product of formValues) {
          if (!product.productid || product.productid == "") {
            toast.error(
              `Please select a valid product for ${
                product.productname || "item"
              }`,
              {
                duration: 2000,
              }
            );
            return;
          }
          if (
            !product.productqty ||
            Number(product.productqty) <= 0 ||
            isNaN(Number(product.productqty))
          ) {
            // Modified check
            toast.error(
              `Product ${
                product.productname || "item"
              }: Quantity must be greater than 0`,
              {
                duration: 2000,
              }
            );
            return;
          }
        }
      }

      // Check for Voice Note tab
      if (activeTab == "Voice Note") {
        if (!voiceNoteBlob) {
          toast.error("Please provide a voice recording to proceed", {
            duration: 2000,
          });
          return;
        }
      }

      if (!user?.isEmployee) {
        await saveLeadMutation.mutateAsync({
          selectedContact: selectedContact,
          leadTitle:
            enabledLeadTitle == "Y" ? selectedLeadTitle : inputLeadTitleValue,
          user: user,
          selectedCompany: selectedCompany,
          selectedBranch: appConfig?.branch_id,
          maincompany_id: maincompany_id,
          mainbranch_id: mainbranch_id,
          selectedDivision: selectedDivision,
          location: location,
          activeTab: activeTab,
          singleFile: singleFile ? [singleFile] : [],
          multipleFiles: multipleFiles,
          voiceNoteBlob: voiceNoteBlob,
          formValues: formValues,
          editableProducts: editableProducts,
          remarks: remarks,
        });
      } else {
        // Use the stored OTP setting variable
        if (enabledOtpPortal == 0) {
          // OTP disabled - directly submit lead
          await saveLeadMutation.mutateAsync({
            selectedContact: selectedContact,
            leadTitle:
              enabledLeadTitle == "Y" ? selectedLeadTitle : inputLeadTitleValue,
            user: user,
            selectedCompany: selectedCompany,
            selectedBranch: appConfig?.branch_id,
            maincompany_id: maincompany_id,
            mainbranch_id: mainbranch_id,
            selectedDivision: selectedDivision,
            location: location,
            activeTab: activeTab,
            singleFile: singleFile ? [singleFile] : [],
            multipleFiles: multipleFiles,
            voiceNoteBlob: voiceNoteBlob,
            formValues: formValues,
            editableProducts: editableProducts,
            remarks: remarks,
          });
        } else {
          // OTP enabled - generate OTP
          generateOtpMutation.mutate(selectedContact?.mobile);
        }
      }
    } catch (error) {
      toast.error(error.message, {
        position: "top-right",
        duration: 3000,
      });
    }

    // If all validations pass, proceed with OTP generation
  };

  const onSubmitOtp = async (otp) => {
    if (!selectedContact) {
      throw new Error("No contact selected");
    }
    await verifyOtpMutation.mutateAsync({
      contact: selectedContact.mobile,
      objectId: selectedContact.id,
      objectType: selectedContact.type,
      verifyOTP: otp,
      key: otpKey,
    });
  };

  const handleResendOtp = async () => {
    if (!selectedContact?.mobile) {
      throw new Error("No contact mobile selected");
    }
    await generateOtpMutation.mutateAsync(selectedContact.mobile);
  };

  // OTP state and create lead state end

  // Fetch company, branch, and division data
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

  // Fetch contact data
  const {
    data: contactData,
    error: contactError,
    isLoading: contactLoading,
  } = useQuery({
    queryKey: ["contactList", token, selectedCompany],
    queryFn: () =>
      leadService.getContactRawcontactAutoComplete(token, selectedCompany),
    enabled: !!token && !!selectedCompany,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  // Fetch product data
  const {
    data: productData,
    error: productError,
    isLoading: productLoading,
  } = useQuery({
    queryKey: [
      "productList",
      token,
      selectedCompany,
      selectedDivision,
      user?.id,
    ],
    queryFn: () =>
      leadService.getProductBasedOnCompany(
        token,
        selectedCompany,
        selectedDivision,
        user?.id // Passing employee ID
      ),
    enabled:
      !!token && !!user?.id && (user?.isEmployee ? !!selectedCompany : true),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Fetch company details
  const {
    data: companyDetailsData,
    error: companyDetailsError,
    isLoading: companyDetailsLoading,
  } = useQuery({
    queryKey: ["companyDetails"],
    queryFn: () => leadService.getCompanyDetails(),
    enabled: !companyInfo && !companyDetails,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  // Fetch lead title data
  const {
    data: leadTitleData,
    error: leadTitleError,
    isLoading: leadTitleLoading,
  } = useQuery({
    queryKey: ["leadTitleData", token],
    queryFn: () => leadService.getLeadTitle(token),
    enabled: !!token && enabledLeadTitle == "Y",
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: "always",
  });

  // Handle company, branch, and division data updates
  useEffect(() => {
    if (companyData) {
      const responseData = Array.isArray(companyData)
        ? companyData[0]
        : companyData;
      if (responseData?.STATUS === "SUCCESS") {
        setCompanyBranchDivisionData(responseData.DATA);
      } else {
        toast.error(responseData?.MSG || "Invalid company response data");
      }
    }

    const companies = companyBranchDivisionData?.companies || [];
    const divisions = companyBranchDivisionData?.division || [];

    if (companies.length > 0 && !selectedCompany) {
      setSelectedCompany(companies[0].company_id);
    }

    if (divisions.length > 0 && !selectedDivision) {
      setSelectedDivision(divisions[0].cd_id);
    }
  }, [
    companyData,
    companyBranchDivisionData,
    selectedCompany,
    selectedDivision,
    setCompanyBranchDivisionData,
  ]);

  // Handle contact data updates
  useEffect(() => {
    if (contactData) {
      const responseData = Array.isArray(contactData)
        ? contactData[0]
        : contactData;
      if (
        responseData?.STATUS === "SUCCESS" &&
        Array.isArray(responseData?.DATA?.contacts)
      ) {
        setContactList(responseData.DATA.contacts);
      } else {
        toast.error(responseData?.MSG || "Invalid contact response data");
        setContactList([]);
      }
    }
  }, [contactData]);

  // Handle product data updates
  useEffect(() => {
    if (productData) {
      const responseData = Array.isArray(productData)
        ? productData[0]
        : productData;
      if (
        responseData?.STATUS === "SUCCESS" &&
        Array.isArray(responseData?.DATA?.products)
      ) {
        setProductList(responseData.DATA.products);
      } else {
        toast.error(responseData?.MSG || "Invalid product response data");
        setProductList([]);
      }
    }
  }, [productData]);

  // Handle company details data updates
  useEffect(() => {
    if (companyDetailsData) {
      const responseData = Array.isArray(companyDetailsData)
        ? companyDetailsData[0]
        : companyDetailsData;
      if (responseData?.STATUS === "SUCCESS") {
        setCompanyInfo(responseData.DATA.Companyinfo);
        setCompanyDetails(responseData.DETAILS);
      } else {
        toast.error(
          responseData?.MSG || "Invalid company details response data"
        );
      }
    }
  }, [companyDetailsData]);

  // Handle lead title data updates and set default selection
  useEffect(() => {
    if (leadTitleData) {
      const responseData = Array.isArray(leadTitleData)
        ? leadTitleData
        : [leadTitleData];
      if (responseData?.[0]?.STATUS === "SUCCESS") {
        setLeadTitleList(responseData[0].DATA);
        // Set the first lead title as default if not already selected
        // if (responseData[0].DATA.length > 0 && !selectedLeadTitle) {
        //   setSelectedLeadTitle(responseData[0].DATA[0].Lead_Title.title);
        // }
      } else {
        // toast.error(responseData?.[0]?.MSG || "Invalid lead title response data");
        console.error(
          responseData?.[0]?.MSG || "Invalid lead title response data"
        );
      }
    }
    if (leadTitleError) {
      // toast.error("Failed to fetch lead titles");
      console.error("Failed to fetch lead titles");
    }
  }, [leadTitleData, leadTitleError]);

  // Mutation for adding lead title
  const addLeadTitleMutation = useMutation({
    mutationFn: (leadData) => {
      if (!leadData) {
        throw new Error("leadData is undefined");
      }
      return leadService.addLeadTitle(leadData);
    },
    onSuccess: async (data) => {
      const responseData = Array.isArray(data) ? data[0] : data;
      if (responseData?.STATUS == "SUCCESS") {
        setLeadTitleList([
          ...leadTitleList,
          {
            Lead_Title: responseData?.DATA,
          },
        ]);
        setLeadTitleValue("");
        setIsLeadTitleDialogOpen(false);
        setSelectedLeadTitle(responseData?.DATA?.title);
        toast.success(`${leadLabel} title added successfully`, {
          duration: 2000,
        });
      } else {
        throw new Error(responseData?.MSG || "Failed to add lead title");
      }
    },
    onError: (error) => {
      console.error("Add lead title error:", error);
      setLeadTitleErrorMsg(
        error.message || "Failed to add lead title. Please try again."
      );
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  // Handlers for Lead Section
  const leadTitleSelect = (leadTitle) => {
    setSelectedLeadTitle(leadTitle); // Set the title string
    // Add logic to handle lead title selection, e.g., update form or fetch data
  };

  const handleAddLeadTitle = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLeadTitleErrorMsg("");

    if (!leadTitleValue.trim()) {
      setLeadTitleErrorMsg("Lead title is required");
      setIsLoading(false);
      return;
    }

    await addLeadTitleMutation.mutateAsync({
      lead_title: leadTitleValue,
      company_id: user?.isEmployee ? selectedCompany : maincompany_id,
    });
  };

  // Refetch queries when selectedCompany or selectedDivision changes
  // useEffect(() => {
  //   if (selectedCompany) {
  //     queryClient.refetchQueries({
  //       queryKey: ["contactList", token, selectedCompany],
  //       exact: true,
  //     });
  //   }
  //   if (selectedCompany && selectedDivision) {
  //     queryClient.refetchQueries({
  //       queryKey: ["productList", token, selectedCompany, selectedDivision],
  //       exact: true,
  //     });
  //   }
  // }, [selectedCompany, selectedDivision]);

  // Reset form on mount
  useEffect(() => {
    setActiveTab("Upload Order Details");
    setSingleFile(null);
    setMultipleFiles([]);
    setVoiceNoteBlob(null);
    setDeliveryOption("");
    setRemarks("");
    // setContactList([]);
    // setProductList([]);
    setFormValues(() => {
      const selectedtypeOption = "lead-option";

      const baseFormValues = {
        unique_id: generateUniqueId(), // Add unique_id
        productid: "",
        productname: "",
        // categoryname: "",
        // categoryid: "",
        productqty: "",
        unit: "",
        stock: "",
        rate: "",
        product_image: "",
        secondary_base_qty: "0",
        sec_unit: "",
        productcode: "",
        totalrate: "",
        SecQtyReverseCalculate: 0,
        unitvalue: "0",
        proddivision: "",
        stock_data: [],
        Attribute_data: {},
        attribute: {}, // Added attribute
        scheduleDate: format(new Date(), "yyyy-MM-dd"),
        discount: "",
        discount_amount: "",
        mrp_price: "",
        sec_unit_mrp_rate: "",
        unit_con_mode: null,
        sec_unit_rate: "0",
      };

      const enhancedFormValues = {
        ...baseFormValues,
        conversion_flg: "1",
        primary_unit_id: "",
        secondary_unit_id: "",
        SecQtyTotal: "",
      };

      if (selectedtypeOption == "lead-option") {
        return [baseFormValues];
      } else if (
        selectedtypeOption == "salesorder-option" &&
        secUnitConfig == "0"
      ) {
        return [baseFormValues];
      } else if (
        selectedtypeOption == "salesorder-option" &&
        secUnitConfig == "1"
      ) {
        return [enhancedFormValues];
      } else {
        return [baseFormValues];
      }
    });
  }, [companyDetails]);

  const contactSelect = (contact) => {
    setSelectedContact(contact);
  };

  // Process matchedContact when contactList updates and pendingContactDetails exists
  useEffect(() => {
    if (pendingContactDetails && contactList.length > 0) {
      const contact_details = pendingContactDetails;
      let matchedContact = null;
      if (contact_details?.contact_id && contact_details?.company_id) {
        matchedContact = contactList.find(
          (contact) =>
            contact?.id == contact_details.company_id &&
            contact?.type == contact_details.company_type
        );
      } else if (contact_details?.contact_id) {
        matchedContact = contactList.find(
          (contact) =>
            contact?.id == contact_details.contact_id &&
            contact?.type == contact_details.contact_type
        );
      }
      if (matchedContact) {
        contactSelect(matchedContact);
      }

      //    const timeoutId = setTimeout(() => {
      //   const matchedContact = findMatchingContact(); // Your existing logic
      //   if (matchedContact) {
      //     contactSelect(matchedContact);
      //     setPendingContactDetails(null);
      //   }
      // }, 500); // Small delay to ensure data is ready

      // return () => clearTimeout(timeoutId);
      setPendingContactDetails(null); // Clear after processing
    }
  }, [contactList, pendingContactDetails]);

  const addContactMutation = useMutation({
    mutationFn: async ({ data, selectedcompany,inputvalue }) => {
      const contactData = {
        country: data.country,
        state: data.state,
        contact_title: data.title,
        name: data.name,
        company_name: selectedcompany ? selectedcompany.title : inputvalue, // Explicit fallback to ""
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
        setContactList([]);
        setIsContactModalOpen(false);
        toast.success("Contact added successfully!", {
          duration: 2000,
        });

        // Store CONTACT_DETAILS for processing after refetch
        if (responseData.CONTACT_DETAILS) {
          setPendingContactDetails(responseData.CONTACT_DETAILS);
        }

        // Invalidate contact list query to trigger refetch
        await queryClient.refetchQueries({
          queryKey: ["contactList", token],
        });
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

  const handleAddContact = (data, selectedcompany,inputvalue) => {
    addContactMutation.mutate({ data, selectedcompany,inputvalue });
  };

  const handleTabChange = (newTab) => {
    if (newTab !== activeTab) {
      setSingleFile(null);
      setMultipleFiles([]);
      setEditableProducts([{ id: 1, name: "", qty: "", unit: "" }]);
      setFormValues([
        {
          unique_id: generateUniqueId(), // Add unique_id
          productid: "",
          productname: "",
          // categoryname: "",
          // categoryid: "",
          productqty: "",
          unit: "",
          stock: "",
          rate: "",
          product_image: "",
          secondary_base_qty: "0",
          sec_unit: "",
          productcode: "",
          totalrate: "",
          SecQtyReverseCalculate: 0,
          unitvalue: "0",
          proddivision: "",
          stock_data: [],
          Attribute_data: {},
          attribute: {}, // Added attribute
          scheduleDate: format(new Date(), "yyyy-MM-dd"),
          discount: "",
          discount_amount: "",
          mrp_price: "",
          sec_unit_mrp_rate: "",
          unit_con_mode: null,
          sec_unit_rate: "0",
        },
      ]);
    }
    setActiveTab(newTab);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-[#4a5a6b] flex items-center gap-2">
        <Triangle />
        Create New {leadLabel}
      </h1>

      <Card>
        <CardContent className="pt-6">
          <form className="">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
              <CompanySelector
                options={companies}
                value={selectedCompany}
                onValueChange={setSelectedCompany}
              />
              <BranchSelector />
              <DivisionSelector
                options={divisions}
                value={selectedDivision}
                onValueChange={setSelectedDivision}
              />
            </div>

            <hr className="my-7 border-t border-gray-300" />

            <div className="my-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {user?.isEmployee && (
                  <div className="lg:col-span-1">
                    <div className="space-y-2">
                      <h3 className="block text-base font-medium text-[#4a5a6b]">
                        Select {contactLabel}
                        <span className="text-red-500">*</span>
                      </h3>
                      <div className="flex items-center">
                        <div className="relative flex-1">
                          <ContactSearch
                            contacts={contactList}
                            onSelect={contactSelect}
                            productSearch={false}
                            selectedItem={selectedContact}
                          />
                        </div>
                        {!contactIdParam && (
                          <>
                            <Button
                              className="h-9 px-4 ml-0 rounded-l-none bg-[#287f71] hover:bg-[#1e6a5e] text-white"
                              type="button"
                              onClick={() => setIsContactModalOpen(true)}
                            >
                              Add
                            </Button>
                            <Modal
                              open={isContactModalOpen}
                              onOpenChange={setIsContactModalOpen}
                              title={`Add New ${contactLabel}`}
                            >
                              <ContactForm
                                onAddContactSubmit={handleAddContact}
                                onCancel={() => setIsContactModalOpen(false)}
                                isSaveContact={isSaveContact} // Pass isSaveContact to ContactForm
                              />
                            </Modal>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <div className="lg:col-span-1">
                  <div className="space-y-2">
                    <h3 className="block text-base font-medium text-[#4a5a6b]">
                      {leadLabel} Title <span className="text-red-500">*</span>
                    </h3>
                    {enabledLeadTitle == "Y" ? (
                      <div className="flex items-center">
                        <div className="relative flex-1">
                          <Select
                            value={selectedLeadTitle || ""}
                            onValueChange={(value) => leadTitleSelect(value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue
                                placeholder={`Select a ${leadLabel} title`}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {leadTitleList.map((lead) => (
                                <SelectItem
                                  key={lead.Lead_Title.id}
                                  value={lead.Lead_Title.title}
                                >
                                  {lead.Lead_Title.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <>
                          <Button
                            className="h-9 px-4 ml-0 rounded-l-none bg-[#287f71] hover:bg-[#1e6a5e] text-white"
                            type="button"
                            onClick={() => setIsLeadTitleDialogOpen(true)}
                          >
                            Add
                          </Button>
                        </>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <div className="relative flex-1">
                          <Input
                            value={inputLeadTitleValue}
                            onChange={(e) =>
                              setInputLeadTitleValue(e.target.value)
                            }
                            placeholder={`Enter ${leadLabel} title`}
                            className="input-focus-style"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <label className="block text-base font-semibold text-[#4a5a6b]">
              How would you like to create {leadLabel}?
            </label>

            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="w-full mt-2"
            >
              <TabsList className="grid grid-cols-2 md:grid-cols-4 h-auto lead-tabs">
                <TabsTrigger
                  value="Upload Order Details"
                  className="data-[state=active]:bg-[#287f71] data-[state=active]:text-white hover:text-[#20665a] transition-colors py-2"
                >
                  Upload Order Details
                </TabsTrigger>
                <TabsTrigger
                  value="Upload by Products"
                  className="data-[state=active]:bg-[#287f71] data-[state=active]:text-white hover:text-[#20665a] transition-colors py-2"
                >
                  Upload by Products
                </TabsTrigger>
                <TabsTrigger
                  value="Select Products"
                  className="data-[state=active]:bg-[#287f71] data-[state=active]:text-white hover:text-[#20665a] transition-colors py-2"
                >
                  Select Products
                </TabsTrigger>
                <TabsTrigger
                  value="Voice Note"
                  className="data-[state=active]:bg-[#287f71] data-[state=active]:text-white hover:text-[#20665a] transition-colors py-2"
                >
                  Voice Note
                </TabsTrigger>
              </TabsList>

              <TabsContent value="Upload Order Details" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FileUploadCard
                    title="Upload Single File"
                    description="(Allow only JPG, PNG, JPEG, or PDF file.)"
                    onFilesSelected={(files) => setSingleFile(files[0])}
                    allowedTypes={["jpg", "png", "jpeg", "pdf"]}
                    className="h-full" // Ensure equal height
                  />
                  <FileUploadCard
                    title="Upload Multiple Files"
                    description="(Allow only XLS, XLSX, JPG, PNG, JPEG, or PDF file.)"
                    multiple={true}
                    onFilesSelected={setMultipleFiles}
                    allowedTypes={["xls", "xlsx", "jpg", "png", "jpeg", "pdf"]}
                    className="h-full" // Ensure equal height
                  />
                </div>
              </TabsContent>
              <TabsContent value="Upload by Products" className="mt-4">
                <div className="border rounded-lg p-4">
                  <EditableProductTable
                    products={editableProducts}
                    setProducts={setEditableProducts}
                  />
                  <div className="space-y-4">
                    <FileUploadCard
                      title="Upload Multiple Files"
                      description="(Allow only XLS, XLSX, JPG, PNG, JPEG, or PDF file.)"
                      multiple={true}
                      onFilesSelected={setMultipleFiles}
                      allowedTypes={[
                        "xls",
                        "xlsx",
                        "jpg",
                        "png",
                        "jpeg",
                        "pdf",
                      ]}
                    />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="Select Products" className="mt-4">
                <div className="border rounded-lg p-4">
                  <ProductSelectionTable
                    formValues={formValues}
                    setFormValues={setFormValues}
                    productList={productList}
                    selectedtypeOption={selectedtypeOption}
                    selectedCompany={selectedCompany}
                    selectedContact={selectedContact}
                  />
                  <div className="space-y-4">
                    <FileUploadCard
                      title="Upload Single File"
                      description="(Allow only JPG, PNG, JPEG, or PDF file.)"
                      onFilesSelected={(files) => setSingleFile(files[0])}
                      allowedTypes={["jpg", "png", "jpeg", "pdf"]}
                    />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="Voice Note" className="mt-4">
                <div className="p-4">
                  <div className="space-y-2">
                    <VoiceNoteRecorder onBlobChange={setVoiceNoteBlob} />
                  </div>
                  {voiceNoteBlob && (
                    <div className="mt-4">
                      <p>Saved Voice Note:</p>
                      <audio
                        controls
                        src={URL.createObjectURL(voiceNoteBlob)}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* <div className="mt-11 grid grid-cols-1 lg:grid-cols-2">
              <div className="lg:col-span-1">
                <DeliveryOptions
                  pickupOptions={pickupOptions}
                  deliveryOptions={deliveryOptions}
                  selectedOption={deliveryOption}
                  onOptionChange={setDeliveryOption}
                />
              </div>
            </div> */}
          </form>
        </CardContent>
      </Card>

      <Card>
        <div className="px-6 py-4">
          <label className="block text-base font-medium text-[#4a5a6b]">
            Remarks (Optional)
          </label>
        </div>
        <hr className="border-t border-gray-300" />
        <CardContent className="py-5">
          <RemarksField value={remarks} onChange={setRemarks} />
        </CardContent>
      </Card>

      <Button
        type="button"
        className="bg-[#287f71] hover:bg-[#20665a] text-white text-sm sm:text-base px-4 py-2"
        disabled={
          user?.isEmployee
            ? enabledOtpPortal == 0
              ? saveLeadMutation.isPending
              : generateOtpMutation.isPending
            : saveLeadMutation.isPending
        }
        onClick={handleCreateLead}
      >
        Create {leadLabel}
      </Button>

      {/* OTP Dialog */}
      <OTPDialog
        open={otpDialogOpen}
        setOpen={setOtpDialogOpen}
        otpValue={otpValue}
        setOtpValue={setOtpValue}
        selectedContact={selectedContact}
        otpKey={otpKey}
        onSubmitOtp={onSubmitOtp}
        handleResendOtp={handleResendOtp}
      />

      {/*lead Title Dialog */}
      <LeadTitleDialog
        open={isLeadTitleDialogOpen}
        setOpen={setIsLeadTitleDialogOpen}
        leadTitleValue={leadTitleValue}
        setLeadTitleValue={setLeadTitleValue}
        handleAddLeadTitle={handleAddLeadTitle}
        leadTitleErrorMsg={leadTitleErrorMsg}
        setLeadTitleErrorMsg={setLeadTitleErrorMsg}
        isLoading={isLoading}
      />
    </div>
  );
};

export default CreateLeadPage;
