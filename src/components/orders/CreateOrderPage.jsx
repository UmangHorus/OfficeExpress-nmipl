"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import BranchSelector from "@/components/selectors/BranchSelector";
import CompanySelector from "@/components/selectors/CompanySelector";
import DivisionSelector from "@/components/selectors/DivisionSelector";
import PaymentTermsSelector from "@/components/selectors/PaymentTermsSelector";
import DeliveryOptions from "@/components/selectors/DeliveryOptions";
import RemarksField from "@/components/inputs/RemarksField";
import { Columns2 } from "lucide-react";
import ProductSelectionTable from "@/components/lead/ProductSelectionTable";
import { Button } from "@/components/ui/button";
import { ContactSearch } from "@/components/inputs/search";
import { useLoginStore } from "@/stores/auth.store";
import { useSharedDataStore } from "@/stores/sharedData.store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import OrderService from "@/lib/OrderService";
import { format, parse } from "date-fns";
import { leadService } from "@/lib/leadService";
import { Modal } from "../shared/Modal";
import { ContactForm } from "../forms/ContactForm";
import { OTPDialog } from "../shared/OtpDialog";
import { useRouter, useSearchParams } from "next/navigation";
import useBasicSettingsStore from "@/stores/basicSettings.store";
import { AddressForm } from "../forms/AddressForm";
import WonLeadDialog from "../shared/WonLeadDialog";
import { ContactService } from "@/lib/ContactService";
import { requestLocationPermission } from "@/utils/location";
import useLocationPermission from "@/hooks/useLocationPermission";

const CreateOrderPage = () => {
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
  const contactLabel = useLoginStore(
    (state) => state.navConfig?.labels?.contacts || "Contact"
  );
  const checkAndRequestLocation = useLocationPermission();
  const router = useRouter();
  const queryClient = useQueryClient();
  const secUnitConfig = companyDetails?.sec_unit_config || "0";
  const ordersLabel = navConfig?.labels?.orders || "Sales Order";
  const addressType = companyDetails?.address_type || "";
  const unitMaster = companyDetails?.unit_master; // Placeholder: Define your unit master data
  const contactIdParam = searchParams.get("contact_id");
  const contactTypeParam = searchParams.get("contact_type");
  const evIdParam = searchParams.get("ev_id");
  const orderIdParam = searchParams.get("orderId");
  const enabledOtpPortal = companyDetails?.enabled_otp_portal;
  const companies = companyBranchDivisionData?.companies || [];
  const divisions = companyBranchDivisionData?.division || [];
  const [salesOrderDetails, setSalesOrderDetails] = useState(null);
  // const selectedtypeOption = "salesorder-option"
  const [selectedtypeOption, setSelectedTypeOption] =
    useState("salesorder-option");
  const [isSaveContact, setIsSaveContact] = useState(false); // New state for button disable

  // Function to generate a unique ID (using timestamp for simplicity)
  const generateUniqueId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  // Initialize formValues
  const getInitialFormValues = (
    selectedtypeOption,
    secUnitConfig,
    selectedWonLead
  ) => {
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
      secQtyReverseCalculate: 0,
      unitvalue: "0",
      proddivision: "",
      stock_data: [],
      pricelist_data: {},
      Attribute_data: {},
      attribute: {}, // Added attribute
      scheduleDate: format(new Date(), "yyyy-MM-dd"),
      discount: "",
      discount_amount: "",
      mrp_price: "",
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

    if (selectedWonLead?.products && selectedWonLead.products.length > 0) {
      const updatedFormValues = selectedWonLead.products.map((product) => {
        const baseProductValues = {
          unique_id: product?.unique_id || generateUniqueId(), // Add unique_id
          productid: product.product_id || "",
          productname: product.productname || "",
          // categoryname: "",
          // categoryid: "",
          productqty: "",
          unit: product.unit_name || "",
          stock: product.current_stock || "",
          rate: product.productrate || "0",
          product_image: product.product_image || "",
          secondary_base_qty: product.prod_conversion || "0",
          sec_unit: secUnitConfig == "1" ? product.second_unit : "",
          productcode: product.productcode || "",
          totalrate: "",
          SecQtyReverseCalculate: product.SecQtyReverseCalculate || 0,
          unitvalue: "0",
          proddivision: product.proddivision || "",
          stock_data: [],
          pricelist_data: product?.pricelist_data || {},
          Attribute_data: product.Attribute_data || {},
          attribute: {}, // Added attribute
          scheduleDate: format(new Date(), "yyyy-MM-dd"),
          discount: "",
          discount_amount: "",
          mrp_price: "",
          unit_con_mode: null,
          sec_unit_rate: "0",
        };

        if (selectedtypeOption == "lead-option") {
          return baseProductValues;
        } else if (
          selectedtypeOption == "salesorder-option" &&
          secUnitConfig == "0"
        ) {
          return baseProductValues;
        } else if (
          selectedtypeOption == "salesorder-option" &&
          secUnitConfig == "1"
        ) {
          // Find matching primary unit ID
          const primaryUnit = unitMaster.find(
            (unit) =>
              unit.unit_name.toLowerCase() ==
              (product.unit_name || "").toLowerCase()
          );
          // Find matching secondary unit ID
          const secondaryUnit = unitMaster.find(
            (unit) =>
              unit.unit_name.toLowerCase() ==
              (product.second_unit || "").toLowerCase()
          );

          return {
            ...baseProductValues,
            conversion_flg: "1",
            primary_unit_id: primaryUnit ? primaryUnit.unit_id : "",
            secondary_unit_id: secondaryUnit ? secondaryUnit.unit_id : "",
            SecQtyTotal: "",
          };
        } else {
          return baseProductValues; // Default fallback
        }
      });
      return updatedFormValues;
    } else {
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
        return [baseFormValues]; // Default fallback
      }
    }
  };

  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [deliveryOption, setDeliveryOption] = useState("");
  const [remarks, setRemarks] = useState("");
  const [showAddButton, setShowAddButton] = useState(true);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [contactList, setContactList] = useState([]);
  const [productList, setProductList] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null); // Store selected contact
  const [pendingContactDetails, setPendingContactDetails] = useState(null); // Store CONTACT_DETAILS
  const [contactBillingAddresses, setContactBillingAddresses] = useState([]);

  //won-lead related states
  const [wonLeadData, setWonLeadData] = useState([]);
  const [showClickHere, setShowClickHere] = useState(false);
  const [selectedWonLead, setSelectedWonLead] = useState(null);
  const [isWonLeadModalOpen, setIsWonLeadModalOpen] = useState(false);

  // Delivery-related states
  const [deliveryType, setDeliveryType] = useState("pickup");
  const [billToAddress, setBillToAddress] = useState(null); // Stores address_id
  const [shipToAddress, setShipToAddress] = useState(null); // Stores address_id
  const [isSameAddress, setIsSameAddress] = useState(null); // Stores address_id if "same address" is

  // Payment-related states
  const [selectedTerm, setSelectedTerm] = useState("");
  const [customDays, setCustomDays] = useState("");

  // Payment options
  const paymentOptions = [
    { value: "A", label: "100% Advance" },
    { value: "F", label: "Full(Credit days)" },
    { value: "P", label: "Part / Advance" },
    { value: "E", label: "EMI" },
  ];

  // Transform contactBillingAddresses into deliveryOptions
  const deliveryOptions = contactBillingAddresses.map((address) => ({
    id: address.address_id,
    address: [
      address.address_1,
      address.address_2,
      address.area,
      address.city_name,
      address.state,
      address.country,
      address.zipcode,
    ]
      .filter(Boolean)
      .join(", "),
  }));

  // Reset showClickHere and selectedLead when selectedContact is not available
  useEffect(() => {
    if (!selectedContact) {
      setShowClickHere(false);
      setWonLeadData([]);
      setSelectedWonLead(null);
      setCustomDays("");
    }
  }, [selectedContact]);

  // Handle payment terms change
  const handlePaymentTermsChange = ({ term, days }) => {
    setSelectedTerm(term);
    setCustomDays(days);
  };

  // Form values initialization
  const [formValues, setFormValues] = useState([]);

  // Update formValues when secUnitConfig changes
  useEffect(() => {
    // Only proceed if selectedWonLead exists
    if (selectedWonLead) {
      const newFormValues = getInitialFormValues(
        selectedtypeOption,
        secUnitConfig,
        selectedWonLead
      );
      setFormValues(newFormValues);
    } else {
      const newFormValues = getInitialFormValues(
        selectedtypeOption,
        secUnitConfig
      );
      setFormValues(newFormValues);
    }
  }, [selectedWonLead, selectedtypeOption, secUnitConfig]);

  // Fetch sales order details
  const {
    data: salesOrderData,
    error: salesOrderError,
    isLoading: salesOrderLoading,
  } = useQuery({
    queryKey: ["salesOrderDetails", orderIdParam],
    queryFn: () => OrderService.checkSalesorder(orderIdParam),
    enabled: !!orderIdParam, // Only fetch if orderIdParam exists
    refetchOnMount: "always",
    staleTime: 0,
    cacheTime: 0,
  });

  // Handle sales order data
  useEffect(() => {
    if (salesOrderData && salesOrderData[0]?.STATUS == "SUCCESS") {
      setSalesOrderDetails(salesOrderData[0].DATA.salesorderdetail.Salesorder);
    } else if (salesOrderData && salesOrderData[0]?.STATUS == "ERROR") {
      console.error("Failed to fetch order details:", salesOrderData[0]?.MSG);
      // toast.error(salesOrderData[0]?.MSG || 'Failed to fetch order details');
    }
    if (salesOrderError) {
      console.error("Error fetching order details:", salesOrderError);
      // toast.error('An error occurred while fetching order details');
    }
  }, [salesOrderData, salesOrderError]);

  // Set selectedContact based on searchParams and contactList
  useEffect(() => {
    if (searchParams && contactList?.length > 0 && !orderIdParam) {
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
  }, [
    searchParams,
    contactList,
    contactIdParam,
    contactTypeParam,
    orderIdParam,
  ]);

  // Set selectedContact based on salesOrderDetails
  useEffect(() => {
    if (salesOrderDetails && contactList?.length > 0 && orderIdParam) {
      const contactType = salesOrderDetails.contact_type; // Numeric (1 or 6)

      if (salesOrderDetails.contact_id && contactType) {
        const foundContact = contactList.find(
          (contact) =>
            contact.id == salesOrderDetails.contact_id &&
            contact.type == contactType
        );

        if (foundContact) {
          setSelectedContact(foundContact);
        } else {
          console.warn("No matching contact found for sales order details");
        }
      }
    }
  }, [salesOrderDetails, contactList, orderIdParam]);

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
        toast.success("OTP verified successfully. Proceeding to save order.", {
          duration: 2000,
        });

        // After successful OTP verification, save order data

        // Use the appropriate mutation based on orderIdParam
        if (orderIdParam) {
          await saveEditOrderMutation.mutateAsync({
            salesOrderDetails: salesOrderDetails,
            formValues: formValues,
            location: location,
            user: user,
          });
        } else {
          await saveOrderMutation.mutateAsync({
            selectedContact: selectedContact,
            user: user,
            selectedCompany: selectedCompany,
            selectedBranch: appConfig?.branch_id,
            maincompany_id: maincompany_id,
            mainbranch_id: mainbranch_id,
            selectedDivision: selectedDivision,
            location: location,
            formValues: formValues,
            billToAddress: billToAddress,
            shipToAddress: shipToAddress,
            isSameAddress: isSameAddress,
            deliveryType: deliveryType,
            selectedTerm: selectedTerm,
            customDays: customDays,
            remarks: remarks,
            selectedWonLead: selectedWonLead,
          });
        }
      } else {
        throw new Error(responseData?.MSG || "OTP verification failed");
      }
    },
    onError: (error) => {
      throw error; // Propagate to OTPDialog
    },
  });

  // Mutation for saving new order
  const saveOrderMutation = useMutation({
    mutationFn: (orderData) => {
      if (!orderData) {
        throw new Error("orderData is undefined");
      }
      return OrderService.insertSOData(orderData);
    },
    onSuccess: async (data) => {
      const responseData = Array.isArray(data) ? data[0] : data;

      if (responseData?.STATUS === "SUCCESS") {
        // Reset form
        setFormValues(getInitialFormValues());
        setSelectedContact(null);
        setOtpValue("");
        setOtpKey("");
        setDeliveryType("pickup");
        setBillToAddress(null);
        setShipToAddress(null);
        setIsSameAddress(null);
        setSelectedTerm("");
        setCustomDays("");
        setContactBillingAddresses([]);
        setSelectedWonLead(null);
        setWonLeadData([]);
        setShowClickHere(false);

        // Record Visit Out if params exist
        if (contactIdParam && contactTypeParam && evIdParam) {
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
              toast.success(
                "Order created and Visit Out recorded successfully.",
                {
                  duration: 2000,
                }
              );
            } else {
              toast.error(visitorResult.MSG || "Visit Out recording failed.");
            }
            router.push("/contacts");
          } catch (error) {
            console.error("Error recording Visit Out:", error);
            toast.error("Order created but failed to record Visit Out.");
          }
        } else {
          toast.success("Order created successfully", {
            duration: 2000,
          });
          router.push("/orders");
        }
      } else {
        throw new Error(responseData?.MSG || "Failed to save order");
      }
    },
    onError: (error) => {
      console.error("Save order error:", error);
      toast.error(error.message || "Failed to save order");
    },
  });

  // Mutation for editing existing order
  const saveEditOrderMutation = useMutation({
    mutationFn: (orderData) => {
      if (!orderData) {
        throw new Error("orderData is undefined");
      }
      return OrderService.editSOData(orderData);
    },
    onSuccess: async (data) => {
      const responseData = Array.isArray(data) ? data[0] : data;

      if (responseData?.STATUS === "SUCCESS") {
        // Reset form (optional for edit flow)
        setFormValues(getInitialFormValues());
        setSelectedContact(null);
        setOtpValue("");
        setOtpKey("");
        setDeliveryType("pickup");
        setBillToAddress(null);
        setShipToAddress(null);
        setIsSameAddress(null);
        setSelectedTerm("");
        setCustomDays("");
        setContactBillingAddresses([]);
        setSelectedWonLead(null);
        setWonLeadData([]);
        setShowClickHere(false);

        toast.success("Order updated successfully", {
          duration: 2000,
        });
        router.push("/orders");
      } else {
        throw new Error(responseData?.MSG || "Failed to update order");
      }
    },
    onError: (error) => {
      console.error("Update order error:", error);
      toast.error(error.message || "Failed to update order");
    },
  });

  // create order function
  const handleCreateOrder = async () => {
    try {
      // Check location permissions
      await checkAndRequestLocation(`${ordersLabel} creation`);

      if (user?.isEmployee && !selectedContact) {
        toast.error("Please select a contact to proceed", {
          duration: 2000,
        });
        return;
      }

      // Check if contact is selected
      if (user?.isEmployee && !selectedContact?.mobile) {
        toast.error(
          "The selected contact does not have a valid mobile number. OTP cannot be sent.",
          {
            duration: 2000,
          }
        );
        return;
      }

      // Validate formValues for Select Products
      if (!formValues || formValues.length == 0) {
        toast.error("Please select at least one product to proceed", {
          duration: 2000,
        });
        return;
      }

      // Validate each product line item
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

        // Check quantity based on conversion_flg
        if (product.conversion_flg == "1") {
          // Validate productqty when conversion_flg is "1"
          if (
            !product.productqty ||
            product.productqty == "" ||
            Number(product.productqty) <= 0 ||
            isNaN(Number(product.productqty))
          ) {
            toast.error(
              `Product ${
                product.productname || "item"
              }: Primary quantity must be greater than 0`,
              {
                duration: 2000,
              }
            );
            return;
          }
        } else if (product.conversion_flg == "2") {
          // Validate SecQtyTotal when conversion_flg is "2"
          if (
            !product.SecQtyTotal ||
            product.SecQtyTotal == "" ||
            Number(product.SecQtyTotal) <= 0 ||
            isNaN(Number(product.SecQtyTotal))
          ) {
            toast.error(
              `Product ${
                product.productname || "item"
              }: Secondary quantity must be greater than 0`,
              {
                duration: 2000,
              }
            );
            return;
          }
        } else {
          // Default case (if conversion_flg is neither "1" nor "2")
          if (
            !product.productqty ||
            product.productqty == "" ||
            Number(product.productqty) <= 0 ||
            isNaN(Number(product.productqty))
          ) {
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

      // Validate addresses for deliveryType === "delivery"
      if (deliveryType == "delivery") {
        if (!isSameAddress) {
          // If isSameAddress is not set, check billToAddress and shipToAddress
          if (!billToAddress) {
            toast.error("Please select a bill to address", {
              duration: 2000,
            });
            return;
          }
          if (!shipToAddress) {
            toast.error("Please select a ship to address", {
              duration: 2000,
            });
            return;
          }
        }
        // If isSameAddress is set, no further address validation needed
      }

      if (!user?.isEmployee) {
        // For Non-employees, directly save order without OTP
        // Use the appropriate mutation based on orderIdParam
        if (orderIdParam) {
          await saveEditOrderMutation.mutateAsync({
            salesOrderDetails: salesOrderDetails,
            formValues: formValues,
            location: location,
            user: user,
          });
        } else {
          await saveOrderMutation.mutateAsync({
            selectedContact: selectedContact,
            user: user,
            selectedCompany: selectedCompany,
            selectedBranch: appConfig?.branch_id,
            maincompany_id: maincompany_id,
            mainbranch_id: mainbranch_id,
            selectedDivision: selectedDivision,
            location: location,
            formValues: formValues,
            billToAddress: billToAddress,
            shipToAddress: shipToAddress,
            isSameAddress: isSameAddress,
            deliveryType: deliveryType,
            selectedTerm: selectedTerm,
            customDays: customDays,
            remarks: remarks,
          });
        }
      } else {
        // For employees, check OTP portal setting
        if (enabledOtpPortal == 0) {
          // OTP disabled - directly submit order
          if (orderIdParam) {
            await saveEditOrderMutation.mutateAsync({
              salesOrderDetails: salesOrderDetails,
              formValues: formValues,
              location: location,
              user: user,
            });
          } else {
            await saveOrderMutation.mutateAsync({
              selectedContact: selectedContact,
              user: user,
              selectedCompany: selectedCompany,
              selectedBranch: appConfig?.branch_id,
              maincompany_id: maincompany_id,
              mainbranch_id: mainbranch_id,
              selectedDivision: selectedDivision,
              location: location,
              formValues: formValues,
              billToAddress: billToAddress,
              shipToAddress: shipToAddress,
              isSameAddress: isSameAddress,
              deliveryType: deliveryType,
              selectedTerm: selectedTerm,
              customDays: customDays,
              remarks: remarks,
              selectedWonLead: selectedWonLead,
            });
          }
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

  // Fetch company, branch, and division data using useQuery
  const {
    data: companyData,
    error: companyError,
    isLoading: companyLoading,
  } = useQuery({
    queryKey: ["companyBranchDivisionData", user?.id, token],
    queryFn: () => OrderService.getCompanyBranchDivisionData(token, user?.id),
    enabled: !!user?.id && !!token && !companyBranchDivisionData,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  // Fetch contact data using useQuery
   const {
     data: contactData,
     error: contactError,
     isLoading: contactLoading,
   } = useQuery({
     queryKey: [
       "contactList",
       token,
       orderIdParam ? salesOrderDetails?.company_id : selectedCompany,
     ],
     queryFn: () =>
       OrderService.getContactRawcontactAutoComplete(
         token,
         orderIdParam ? salesOrderDetails?.company_id : selectedCompany
       ),
     enabled:
       !!token &&
       (orderIdParam ? !!salesOrderDetails?.company_id : !!selectedCompany),
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
       orderIdParam ? salesOrderDetails?.company_id : selectedCompany,
       orderIdParam ? salesOrderDetails?.division_id : selectedDivision,
       user?.id,
     ],
     queryFn: () =>
       leadService.getProductBasedOnCompany(
         token,
         orderIdParam ? salesOrderDetails?.company_id : selectedCompany,
         orderIdParam ? salesOrderDetails?.division_id : selectedDivision,
         user?.id // Passing employee ID
       ),
     enabled:
       !!token &&
       !!user?.id &&
       (user?.isEmployee
         ? !!(orderIdParam ? salesOrderDetails?.company_id : selectedCompany)
         : true),
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

  // Fetch billing address when selectedContact changes or when orderIdParam is present
  const {
    data: billingAddressData,
    error: billingAddressError,
    isLoading: billingAddressLoading,
  } = useQuery({
    queryKey: [
      "contactBillingAddress",
      orderIdParam
        ? salesOrderDetails?.contact_id
        : user?.isEmployee
        ? selectedContact?.id
        : user?.id,
      orderIdParam
        ? salesOrderDetails?.contact_type
        : user?.isEmployee
        ? selectedContact?.type
        : user?.type,
      token,
    ],
    queryFn: () =>
      leadService.getContactBillingAddressForBot(
        token,
        orderIdParam
          ? salesOrderDetails.contact_id
          : user?.isEmployee
          ? selectedContact.id
          : user.id,
        orderIdParam
          ? salesOrderDetails.contact_type
          : user?.isEmployee
          ? selectedContact.type
          : user.type
      ),
    enabled:
      !!token &&
      (orderIdParam
        ? !!salesOrderDetails?.contact_id && !!salesOrderDetails?.contact_type
        : user?.isEmployee
        ? !!selectedContact?.id && !!selectedContact?.type
        : !!user?.id && !!user?.type),
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: "always",
  });

  // Fetch won leads when a contact is selected
  const {
    data: wonLeadResponse,
    error: wonLeadError,
    isLoading: wonLeadLoading,
  } = useQuery({
    queryKey: ["wonLeads", selectedContact?.id, token],
    queryFn: () =>
      OrderService.getWonLeadWithoutSO({
        token,
        object_id: selectedContact?.id,
        object_type: selectedContact?.type,
      }),
    enabled: !!token && !!selectedContact?.id,
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

  // Handle billing address response
  useEffect(() => {
    if (billingAddressData) {
      const responseData = Array.isArray(billingAddressData)
        ? billingAddressData[0]
        : billingAddressData;
      if (
        responseData?.STATUS === "SUCCESS" &&
        Array.isArray(responseData?.DATA)
      ) {
        setContactBillingAddresses(responseData.DATA);
      } else {
        toast.error(responseData?.MSG || "Failed to fetch billing addresses");
        setContactBillingAddresses([]);
      }
    }
  }, [billingAddressData]);

  // Handle won lead API response
  useEffect(() => {
    if (wonLeadResponse) {
      const responseData = Array.isArray(wonLeadResponse)
        ? wonLeadResponse[0]
        : wonLeadResponse;
      if (responseData?.STATUS == "SUCCESS") {
        if (Array.isArray(responseData?.DATA) && responseData.DATA.length > 0) {
          setWonLeadData(responseData.DATA);
          // setShowClickHere(true);
          // Set showClickHere based on orderIdParam
          setShowClickHere(!orderIdParam);
        } else {
          // toast.error(responseData?.MSG || "No data available in successful response");
          setShowClickHere(false);
          setWonLeadData([]);
        }
      } else {
        // toast.error(responseData?.MSG || "Failed to fetch won leads");
        // console.error(responseData?.MSG || "Failed to fetch won leads")
        setShowClickHere(false);
        setWonLeadData([]);
      }
    }
  }, [wonLeadResponse]);

  useEffect(() => {
    if (user?.isEmployee && !selectedContact) {
      setDeliveryType("pickup");
      setBillToAddress(null);
      setShipToAddress(null);
      setIsSameAddress(null);
      setContactBillingAddresses([]);
    }
  }, [selectedContact]);

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

  // add contact mutation
  const addContactMutation = useMutation({
    mutationFn: async ({ data, selectedcompany }) => {
      const contactData = {
        country: data.country,
        state: data.state,
        contact_title: data.title,
        name: data.name,
        company_name: selectedcompany ? selectedcompany.title : "", // Explicit fallback to ""
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

  const handleAddContact = (data, selectedcompany) => {
    addContactMutation.mutate({ data, selectedcompany });
  };

  // add address mutation
  const addAddressMutation = useMutation({
    mutationFn: async (values) => {
      const addressData = {
        contact_id: user?.isEmployee ? selectedContact?.id : user?.id,
        contact_type: user?.isEmployee ? selectedContact?.type : user?.type,
        nickname: values.nickname,
        address1: values.address1,
        address2: values.address2,
        area: values.area,
        city: values.city,
        selcountry: values.selcountry,
        selstate: values.selstate,
        zipcode: values.zipcode,
        // routes: values.routes,
      };

      const response = await OrderService.saveContactAddress(addressData);
      return response;
    },
    onSuccess: async (response) => {
      const responseData = Array.isArray(response) ? response[0] : response;
      if (responseData?.STATUS == "SUCCESS") {
        setIsAddressModalOpen(false);
        toast.success("Address added successfully!", {
          duration: 2000,
        });
        setBillToAddress(null);
        setShipToAddress(null);
        setIsSameAddress(null);

        // const newAddressId = responseData?.DATA?.address_id; // Adjust based on actual response
        // if (newAddressId) {
        //   setBillToAddress(newAddressId);
        //   if (isSameAddress) {
        //     setShipToAddress(newAddressId);
        //   }
        // }

        // Refetch billing address query
        await queryClient.refetchQueries({
          queryKey: [
            "contactBillingAddress",
            user?.isEmployee ? selectedContact?.id : user?.id,
            user?.isEmployee ? selectedContact?.type : user?.type,
            token,
          ],
        });
      } else {
        throw new Error(responseData?.MSG || "Failed to add address");
      }
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.MSG ||
        error.message ||
        "Failed to add address. Please try again.";
      toast.error(errorMessage);
    },
  });

  const handleAddAddress = (values) => {
    addAddressMutation.mutate(values);
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
    resetForm();
  }, []);

  const resetForm = () => {
    setDeliveryOption("");
    setRemarks("");
    setSelectedWonLead(null);
    setWonLeadData([]);
    setShowClickHere(false);
    setFormValues(() => {
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
        pricelist_data: {},
        Attribute_data: {},
        attribute: {}, // Added attribute
        scheduleDate: format(new Date(), "yyyy-MM-dd"),
        discount: "",
        discount_amount: "",
        mrp_price: "",
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
  };

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-[#4a5a6b] flex items-center gap-2">
        <Columns2 />
        Create New {ordersLabel}
      </h1>

      <Card>
        <CardContent className="pt-6">
          <form className="">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
              <>
                <CompanySelector
                  options={companies}
                  value={selectedCompany}
                  onValueChange={setSelectedCompany}
                  orderIdParam={orderIdParam}
                  salesOrderDetails={salesOrderDetails}
                />
                <BranchSelector
                  orderIdParam={orderIdParam}
                  salesOrderDetails={salesOrderDetails}
                />
                <DivisionSelector
                  options={divisions}
                  value={selectedDivision}
                  onValueChange={setSelectedDivision}
                  orderIdParam={orderIdParam}
                  salesOrderDetails={salesOrderDetails}
                />
              </>
            </div>

            <div className="mt-11 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {user?.isEmployee && (
                <div className="lg:col-span-1">
                  <div className="space-y-2">
                    <h3 className="block text-base font-medium text-[#4a5a6b]">
                      Select {contactLabel}{" "}
                      <span className="text-red-500">*</span>
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="relative flex-1">
                          <ContactSearch
                            contacts={contactList}
                            onSelect={contactSelect}
                            productSearch={false}
                            selectedItem={selectedContact}
                          />
                        </div>
                        {showAddButton && !contactIdParam && !orderIdParam && (
                          <>
                            <Button
                              className="h-9 px-4 ml-0 rounded-l-none bg-[#287f71] hover:bg-[#20665a] text-white"
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
                      {showClickHere && (
                        <div className="text-center">
                          <a
                            className="text-[#287f71] hover:text-[#20665a] hover:underline text-sm cursor-pointer font-bold"
                            onClick={() => setIsWonLeadModalOpen(true)}
                          >
                            Click here to show won lead
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div
                className={user?.isEmployee ? "lg:col-span-1" : "lg:col-span-2"}
              >
                <PaymentTermsSelector
                  options={paymentOptions}
                  selectedTerm={selectedTerm}
                  customDays={customDays}
                  onChange={handlePaymentTermsChange}
                  selectedContact={selectedContact}
                  orderIdParam={orderIdParam}
                  salesOrderDetails={salesOrderDetails}
                />
              </div>
            </div>

            <div className="mt-11 space-y-2">
              <h3 className="block text-base font-medium text-[#4a5a6b]">
                Select Products
              </h3>
              <ProductSelectionTable
                formValues={formValues}
                setFormValues={setFormValues}
                productList={productList}
                selectedtypeOption={selectedtypeOption}
                selectedCompany={selectedCompany}
                selectedContact={selectedContact}
                orderIdParam={orderIdParam}
                salesOrderDetails={salesOrderDetails}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="lg:col-span-1">
                <DeliveryOptions
                  companyInfo={companyInfo}
                  deliveryOptions={deliveryOptions}
                  deliveryType={deliveryType}
                  setDeliveryType={setDeliveryType}
                  billToAddress={billToAddress}
                  setBillToAddress={setBillToAddress}
                  shipToAddress={shipToAddress}
                  setShipToAddress={setShipToAddress}
                  isSameAddress={isSameAddress}
                  setIsSameAddress={setIsSameAddress}
                  selectedContact={selectedContact}
                  orderIdParam={orderIdParam}
                  salesOrderDetails={salesOrderDetails}
                />
                {deliveryType == "delivery" && (
                  <div className="mt-4">
                    <Button
                      className="h-9 px-4 bg-[#287f71] hover:bg-[#20665a] text-white"
                      type="button"
                      onClick={() => setIsAddressModalOpen(true)}
                    >
                      Add Address
                    </Button>
                    <Modal
                      open={isAddressModalOpen}
                      onOpenChange={setIsAddressModalOpen}
                      title="Add New Address"
                    >
                      <AddressForm
                        onAddAddressSubmit={handleAddAddress}
                        onCancel={() => setIsAddressModalOpen(false)}
                        addressType={addressType}
                        isSubmitting={addAddressMutation.isPending}
                      />
                    </Modal>
                  </div>
                )}
              </div>
            </div>
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
          <RemarksField
            value={remarks}
            onChange={setRemarks}
            orderIdParam={orderIdParam}
            salesOrderDetails={salesOrderDetails}
          />
        </CardContent>
      </Card>

      {/* <Button
        type="button"
        className="bg-[#287f71] hover:bg-[#20665a] text-white text-sm sm:text-base px-4 py-2"
        // disabled={
        //   user?.isEmployee
        //     ? enabledOtpPortal == 0
        //       ? saveOrderMutation.isPending
        //       : generateOtpMutation.isPending
        //     : saveOrderMutation.isPending
        // }
        disabled={
          orderIdParam
            ? saveEditOrderMutation.isPending
            : user?.isEmployee
            ? enabledOtpPortal == 0
              ? orderIdParam
                ? saveEditOrderMutation.isPending
                : saveOrderMutation.isPending
              : generateOtpMutation.isPending
            : saveOrderMutation.isPending
        }
        onClick={handleCreateOrder}
      >
        Create {ordersLabel}
      </Button> */}
      <Button
        type="button"
        className="bg-[#287f71] hover:bg-[#20665a] text-white text-sm sm:text-base px-4 py-2"
        disabled={
          orderIdParam
            ? user?.isEmployee && enabledOtpPortal == 0
              ? saveOrderMutation.isPending
              : generateOtpMutation.isPending
            : user?.isEmployee
            ? enabledOtpPortal == 0
              ? saveOrderMutation.isPending
              : generateOtpMutation.isPending
            : saveOrderMutation.isPending
        }
        onClick={handleCreateOrder}
      >
        Create {ordersLabel}
      </Button>

      {/* wonleaddialog  */}
      <WonLeadDialog
        open={isWonLeadModalOpen}
        onOpenChange={setIsWonLeadModalOpen}
        wonLeadData={wonLeadData}
        selectedWonLead={selectedWonLead}
        setSelectedWonLead={setSelectedWonLead}
      />

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
    </div>
  );
};

export default CreateOrderPage;
