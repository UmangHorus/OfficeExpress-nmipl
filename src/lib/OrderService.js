import { format } from "date-fns";
import api from "./api/axios";
import {
  getCurrentLocation,
  requestLocationPermission,
} from "@/utils/location";

const AUTHORIZE_KEY = process.env.NEXT_PUBLIC_API_AUTH_KEY || "";

const getLocationPayload = async () => {
  try {
    // First check if we have permission
    const permission = await requestLocationPermission();
    if (permission !== "granted") {
      throw new Error("LOCATION_PERMISSION_REQUIRED");
    }

    // Then get the location
    const location = await getCurrentLocation();
    return {
      gmapurl: location?.gmapLink || null,
      gmapAddress: location?.address || null,
      error: null,
    };
  } catch (error) {
    console.error("Location error:", error);
    return {
      gmapurl: null,
      gmapAddress: null,
      error: error.message.includes("LOCATION_PERMISSION_REQUIRED")
        ? "Location access is required. Please enable location permissions."
        : "Could not determine your location. Please ensure location services are enabled.",
    };
  }
};

const OrderService = {
  getCompanyBranchDivisionData: async (token, employeeId) => {
    const formData = new FormData();
    formData.append("AUTHORIZEKEY", AUTHORIZE_KEY);
    formData.append("PHPTOKEN", token);
    formData.append("employee_id", employeeId);

    const response = await api.post(
      "/expo_access_api/getEmpCompanyAndBranch/",
      formData
    );
    return response.data;
  },

  // Updated to use JSON instead of FormData
  getContactRawcontactAutoComplete: async (token, companyId) => {
    const payload = {
      AUTHORIZEKEY: AUTHORIZE_KEY,
      PHPTOKEN: token,
      distributed_in_company: companyId,
    };

    const response = await api.post(
      "/expo_access_api/getContactRawcontactAutoComplete/",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  },

  getAddressTypes: async (token) => {
    const formData = new FormData();
    formData.append("AUTHORIZEKEY", AUTHORIZE_KEY);
    formData.append("PHPTOKEN", token);

    const response = await api.post(
      "/expo_access_api/getAddressTypes/",
      formData
    );
    return response.data;
  },

  saveAddressTypes: async ({ token, created_by, name }) => {
    const formData = new FormData();
    formData.append("AUTHORIZEKEY", AUTHORIZE_KEY);
    formData.append("PHPTOKEN", token);
    formData.append("created_by", created_by);
    formData.append("name", name);

    const response = await api.post(
      "/expo_access_api/saveAddressTypes/",
      formData
    );
    return response.data;
  },

  saveContactAddress: async (addressData) => {
    const payload = {
      AUTHORIZEKEY: AUTHORIZE_KEY,
      contact_id: addressData.contact_id,
      contact_type: addressData.contact_type,
      address_type: addressData.nickname,
      address1: addressData.address1,
      address2: addressData.address2 || "",
      area: addressData.area,
      city: addressData.city,
      selcountry: addressData.selcountry,
      selstate: addressData.selstate,
      zipcode: addressData.zipcode,
      billing_flg: "Y",
      routes: addressData.routes,
    };

    const response = await api.post(
      "/expo_access_api/saveContactAddress/",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  },

  getLeadPastOrders: async (token, id, type) => {
    const payload = {
      AUTHORIZEKEY: AUTHORIZE_KEY,
      contact_id: id,
      contact_type: type,
      type: 21,
    };

    const response = await api.post(
      "/expo_access_api/getLeadPastOrders/",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          // Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  checkSalesorder: async (salesorderId) => {
    const payload = {
      AUTHORIZEKEY: AUTHORIZE_KEY,
      salesorder_id: salesorderId,
    };

    const response = await api.post(
      "/expo_access_api/salesorderdetail/",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  },

  getWonLeadWithoutSO: async ({ token, object_id, object_type }) => {
    const formData = new FormData();
    formData.append("AUTHORIZEKEY", AUTHORIZE_KEY);
    formData.append("PHPTOKEN", token);
    formData.append("object_id", object_id);
    formData.append("object_type", object_type);

    const response = await api.post(
      "/expo_access_api/getWonLeadWithoutSO/",
      formData
    );
    return response.data;
  },

  insertSOData: async (orderData) => {
    // console.log(orderData, "OrderData");
    const formData = new FormData();
    formData.append("AUTHORIZEKEY", AUTHORIZE_KEY);

    try {
      // Get current location with proper error handling
      const locationPayload = await getLocationPayload();

      // If we got an error from location, but have fallback location in orderData
      if (locationPayload.error && orderData.location) {
        if (orderData.location.gmapLink) {
          formData.append("gmapurl", orderData.location.gmapLink);
        }
        if (orderData.location.address) {
          formData.append("gmapAddress", orderData.location.address);
        }
      }
      // If we got location data successfully
      else if (!locationPayload.error) {
        if (locationPayload.gmapurl) {
          formData.append("gmapurl", locationPayload.gmapurl);
        }
        if (locationPayload.gmapAddress) {
          formData.append("gmapAddress", locationPayload.gmapAddress);
        }
      }
      // If no location at all, the API will handle missing location fields

      // Conditional fields with specified key-value logic
      formData.append(
        "contact_id",
        orderData.user?.isEmployee
          ? orderData.selectedContact?.id
          : orderData.user?.id
      );
      formData.append(
        "object_type",
        orderData.user?.isEmployee
          ? orderData.selectedContact?.type
          : orderData.user?.type
      );
      if (orderData.user?.isEmployee) {
        formData.append("created_assigned_by", orderData.user?.id);
      }

      // Handle company_id
      const companyToSend = orderData.user?.isEmployee
        ? orderData.selectedCompany
        : orderData.maincompany_id;
      if (companyToSend) {
        formData.append("company_id", companyToSend);
      }

      // Handle branch_id
      const branchToSend = orderData.user?.isEmployee
        ? orderData.selectedBranch
        : orderData.mainbranch_id;
      if (branchToSend) {
        formData.append("branch_id", branchToSend);
      }

      // Static and optional fields
      formData.append("create_from", "OE");
      formData.append("division_id", orderData.selectedDivision);

      // if (orderData.location?.address) {
      //   formData.append("gmapAddress", orderData.location.address);
      // }
      // if (orderData.location?.gmapLink) {
      //   formData.append("gmapurl", orderData.location.gmapLink);
      // }

      // Handle patient_name based on user?.isEmployee
      const patientName = orderData.user?.isEmployee
        ? orderData.selectedContact?.title
        : orderData.user?.name;
      if (patientName) {
        formData.append("patient_name", patientName);
      }

      if (orderData?.deliveryType) {
        // Check if deliveryType exists in orderData
        formData.append(
          "delivery_type",
          orderData?.deliveryType == "pickup" ? "1" : "2" // Ternary operator
        );
      }

      if (orderData?.deliveryType == "delivery") {
        // For delivery type
        if (orderData.isSameAddress) {
          // If checkbox is selected (same address), use billToAddress for both
          formData.append("billing_address_id", orderData.isSameAddress);
          formData.append("shipping_address_id", orderData.isSameAddress);
        } else if (orderData.billToAddress && orderData.shipToAddress) {
          // If individual addresses are provided and not blank
          formData.append("billing_address_id", orderData.billToAddress);
          formData.append("shipping_address_id", orderData.shipToAddress);
        }
      } else if (orderData?.deliveryType === "pickup") {
        // For pickup type (if you need different handling)
        // Add your pickup logic here if needed
      }

      if (orderData?.selectedTerm) {
        formData.append("payments_terms", orderData?.selectedTerm);
      }

      if (orderData?.selectedTerm == "F") {
        formData.append("credit_days", orderData?.customDays);
      }

      if (orderData.user?.isEmployee) {
        formData.append("created_by", orderData.user?.id);
      }

      if (orderData?.remarks) {
        formData.append("remarks", orderData?.remarks);
      }

      if (orderData?.selectedWonLead?.lead_id) {
        formData.append("reference_id", orderData?.selectedWonLead?.lead_id);
        formData.append("reference_type", "7");
      }

      // Before sending to API:
      if (orderData.formValues && orderData.formValues.length > 0) {
        const formattedProducts = orderData.formValues.map((product) => {
          // Parse the existing date (yyyy-MM-dd) and reformat to dd-MM-yyyy
          const formattedDate = format(
            new Date(product.scheduleDate),
            "dd-MM-yyyy"
          );

          // Create a new product object without Attribute_data
          const { Attribute_data, ...productWithoutAttributes } = product;

          return {
            ...productWithoutAttributes,
            scheduleDate: formattedDate,
          };
        });

        formData.append("products", JSON.stringify(formattedProducts));
      }

      const response = await api.post(
        "/expo_access_api/insertSOData/",
        formData
      );
      return response.data;
    } catch (error) {
      // Handle location-specific errors
      if (error.message.includes("LOCATION_PERMISSION_REQUIRED")) {
        throw new Error(
          "Location access is required for editing orders. Please enable location permissions."
        );
      }
      throw error;
    }
  },

  // edit so Data function
  editSOData: async (orderData) => {
    const formData = new FormData();
    formData.append("AUTHORIZEKEY", AUTHORIZE_KEY);
    formData.append("salesorder_id", orderData.salesOrderDetails?.Orderid); // Using Orderid from salesOrderDetails

    try {
      // Get current location with proper error handling
      const locationPayload = await getLocationPayload();

      // If we got an error from location, but have fallback location in orderData
      if (locationPayload.error && orderData.location) {
        if (orderData.location.gmapLink) {
          formData.append("gmapurl", orderData.location.gmapLink);
        }
        if (orderData.location.address) {
          formData.append("gmapAddress", orderData.location.address);
        }
      }
      // If we got location data successfully
      else if (!locationPayload.error) {
        if (locationPayload.gmapurl) {
          formData.append("gmapurl", locationPayload.gmapurl);
        }
        if (locationPayload.gmapAddress) {
          formData.append("gmapAddress", locationPayload.gmapAddress);
        }
      }
      // If no location at all, the API will handle missing location fields

      // Contact information (using same field names as insertSOData)
      formData.append("contact_id", orderData.salesOrderDetails?.contact_id);
      formData.append(
        "object_type",
        orderData.salesOrderDetails?.contact_type.toString()
      );

      if (orderData.user?.isEmployee) {
        formData.append("created_assigned_by", orderData.user?.id);
      }

      // Company and branch information
      formData.append("company_id", orderData.salesOrderDetails?.company_id);
      formData.append("branch_id", orderData.salesOrderDetails?.branch_id);

      // Static fields
      formData.append("create_from", "OE");
      formData.append("division_id", orderData.salesOrderDetails?.division_id);

      // if (orderData.location?.address) {
      //   formData.append("gmapAddress", orderData.location.address);
      // }
      // if (orderData.location?.gmapLink) {
      //   formData.append("gmapurl", orderData.location.gmapLink);
      // }

      // Patient name
      if (orderData.salesOrderDetails?.patient_name) {
        formData.append(
          "patient_name",
          orderData.salesOrderDetails.patient_name
        );
      }

      // Delivery information
      formData.append(
        "delivery_type",
        orderData.salesOrderDetails?.delivery_type
      );

      if (orderData.salesOrderDetails?.delivery_type == "2") {
        // For delivery type
        // If checkbox is selected (same address), use billToAddress for both
        formData.append(
          "billing_address_id",
          orderData.salesOrderDetails.billing_address_id
        );
        formData.append(
          "shipping_address_id",
          orderData.salesOrderDetails.shipping_address_id
        );
      } else if (orderData.salesOrderDetails?.delivery_type == "1") {
        // For pickup type (if you need different handling)
        // Add your pickup logic here if needed
      }

      // Payment terms
      if (orderData.salesOrderDetails?.payments_terms) {
        formData.append(
          "payments_terms",
          orderData.salesOrderDetails.payments_terms
        );
      }

      if (orderData.salesOrderDetails?.payments_terms == "F") {
        formData.append("credit_days", orderData.salesOrderDetails.credit_days);
      }

      if (orderData.user?.isEmployee) {
        formData.append("created_by", orderData.user?.id);
      }

      // Remarks
      if (orderData.salesOrderDetails?.remarks) {
        formData.append("remarks", orderData.salesOrderDetails.remarks);
      }

      // Handle products from formValues
      if (orderData.formValues && orderData.formValues.length > 0) {
        const formattedProducts = orderData.formValues.map((product) => {
          // Parse the existing date (assumed to be dd-MM-yyyy from ProductSelectionTable.jsx) and reformat to dd-MM-yyyy
          const formattedDate = format(
            new Date(product.scheduleDate),
            "dd-MM-yyyy"
          );

          // Create a new product object without Attribute_data
          const { Attribute_data, ...productWithoutAttributes } = product;

          return {
            ...productWithoutAttributes,
            scheduleDate: formattedDate,
          };
        });
        formData.append("products", JSON.stringify(formattedProducts));
      }

      const response = await api.post(
        "/expo_access_api/insertSOData/",
        formData
      );
      return response.data;
    } catch (error) {
      // Handle location-specific errors
      if (error.message.includes("LOCATION_PERMISSION_REQUIRED")) {
        throw new Error(
          "Location access is required for editing orders. Please enable location permissions."
        );
      }
      throw error;
    }
  },
};

export default OrderService;
