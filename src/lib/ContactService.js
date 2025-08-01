import api from "@/lib/api/axios";
import {
  getCurrentLocation,
  requestLocationPermission,
} from "@/utils/location";
import { format } from "date-fns";

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

export const ContactService = {
  // Fetch contact list with addresses
  getContactList: async (token, userType, userId) => {
    const formData = new FormData();
    formData.append("object_type", userType || "EMPLOYEE");
    formData.append("object_id", userId || "");
    formData.append("PHPTOKEN", token || "");
    formData.append("AUTHORIZEKEY", AUTHORIZE_KEY || "");

    const response = await api.post(
      "/expo_access_api/getContactRawcontactWithAddressList/",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  // Fetch subordinates for a contact
  getSubordinates: async (token, contactId, contactType) => {
    try {
      const formData = new FormData();
      formData.append("contact_id", contactId || "");
      formData.append("contact_type", contactType || "");
      formData.append("PHPTOKEN", token || "");
      formData.append("AUTHORIZEKEY", AUTHORIZE_KEY || "");

      const response = await api.post(
        "/expo_access_api/getSubordinateContactRawcontact/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        "Error in getSubordinates:",
        error.message,
        error.response?.data
      );
      throw error; // Propagate error to useQuery
    }
  },

  // Fetch lead followup settings
  getLeadFollowupSettings: async (token) => {
    try {
      const formData = new FormData();
      formData.append("PHPTOKEN", token || "");
      formData.append("AUTHORIZEKEY", AUTHORIZE_KEY || "");

      const response = await api.post(
        "/expo_access_api/getmyLeadFollowupSettings/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        "Error in getLeadFollowupSettings:",
        error.message,
        error.response?.data
      );
      throw error; // Propagate error to useQuery
    }
  },

  // Fetch contact and raw contact follow-up data
  getContactRawcontactFollowUP: async (token, formData) => {
    formData.append("AUTHORIZEKEY", AUTHORIZE_KEY || "");

    const response = await api.post(
      "/expo_access_api/getContactRawcontactFollowUP/",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  // download attachment in contact followup
  downloadInteractionsFile: async (token, formData) => {
    formData.append("AUTHORIZEKEY", AUTHORIZE_KEY || "");
    formData.append("PHPTOKEN", token || "");
    const response = await api.post(
      "/expo_access_api/downloadInteractionsFile/",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  // Record Visit In/Out
  employeeVisitorInOut: async (
    token,
    visitorType,
    employeeId,
    referenceId,
    referenceType,
    evId = null
  ) => {
    const formData = new FormData();
    formData.append("visitor_type", visitorType);
    formData.append("employee_id", employeeId);
    formData.append("reference_id", referenceId);
    formData.append("reference_type", referenceType);
    formData.append("PHPTOKEN", token || "");
    formData.append("AUTHORIZEKEY", AUTHORIZE_KEY || "");
    if (evId) {
      formData.append("ev_id", evId);
    }

    const response = await api.post(
      "/expo_access_api/employeeVisitorInOut/",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  // New method for fetching route list
  getRouteList: async (token, id) => {
    const payload = {
      AUTHORIZEKEY: AUTHORIZE_KEY,
      PHPTOKEN: token,
      employee_id: id,
    };

    const response = await api.post("/expo_access_api/route_list/", payload, {
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  // Save contact follow-up
  saveContactRawcontactFollowUP: async (
    token,
    contactId,
    contactType,
    createdBy,
    outcomeId,
    followupType,
    comments,
    subordinateId,
    subordinateName,
    followupDate,
    nextActionDate,
    file,
    location
  ) => {
    const formData = new FormData();
    formData.append("AUTHORIZEKEY", AUTHORIZE_KEY || "");
    formData.append("PHPTOKEN", token || "");

    try {
      // Get current location with proper error handling
      const locationPayload = await getLocationPayload();

      // If we got an error from location, but have fallback location in orderData
      if (locationPayload.error && location) {
        if (location.gmapLink) {
          formData.append("gmapurl", location.gmapLink);
        }
        if (location.address) {
          formData.append("gmapAddress", location.address);
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

      // formData.append("gmapAddress", location?.address || "");
      // formData.append("gmapurl", location?.gmapLink || "");

      formData.append("contact_id", contactId || "");
      formData.append("contact_type", contactType || "");
      formData.append("created_by", createdBy || "");
      formData.append("outcome_id", outcomeId || "");
      formData.append("followup_type", followupType || "");
      formData.append("comments", comments || "");
      formData.append("subsubordinate_ids", subordinateId || "");
      formData.append("subsubordinate_names", subordinateName || "");

      // Format dates using date-fns
      const formattedFollowupDate = followupDate
        ? format(new Date(followupDate), "dd-MM-yyyy hh:mm a")
        : "";
      formData.append("followup_taken_dt", formattedFollowupDate);

      const formattedNextActionDate = nextActionDate
        ? format(new Date(nextActionDate), "dd-MM-yyyy hh:mm a")
        : "";
      formData.append("nextaction_dt", formattedNextActionDate);

      // Handle file upload
      if (file) {
        formData.append("followUps_file_count", "1");
        formData.append("FollowFile1", file, file.name);
      } else {
        formData.append("followUps_file_count", "0");
      }

      const response = await api.post(
        "/expo_access_api/saveContactRawcontactFollowUP/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
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

  // add subordinate
  addSubordinate: async (
    token,
    parent_contact_id,
    parent_contact_type,
    {
      subordinate_title,
      subordinate_name,
      subordinate_email,
      subordinate_mobile,
    }
  ) => {
    const formData = new FormData();
    formData.append("object_id", parent_contact_id);
    formData.append("object_type", parent_contact_type);
    formData.append(
      "form_data",
      JSON.stringify({
        contact_title: subordinate_title,
        name: subordinate_name,
        email: subordinate_email,
        mobile: subordinate_mobile,
      })
    );
    formData.append("PHPTOKEN", token || "");
    formData.append("AUTHORIZEKEY", AUTHORIZE_KEY || "");

    const response = await api.post(
      "/expo_access_api/saveSubordinate/",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },
};
