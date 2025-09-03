// src/lib/punchService.js
import api from "@/lib/api/axios";
import {
  getCurrentLocation,
  requestLocationPermission,
} from "@/utils/location";
import { useLoginStore } from "@/stores/auth.store";

const AUTHORIZE_KEY = process.env.NEXT_PUBLIC_API_AUTH_KEY || "";

const getLocationPayload = async (actionType) => {
  try {
    const permission = await requestLocationPermission();
    if (permission !== "granted") {
      throw new Error("LOCATION_PERMISSION_REQUIRED");
    }

    const location = await getCurrentLocation();

    return {
      ...(location?.gmapLink && {
        [`${actionType}_gmapurl`]: location.gmapLink,
      }),
      ...(location?.address && {
        [`${actionType}_gmapAddress`]: location.address,
      }),
    };
  } catch (error) {
    console.error("Location error:", error);
    throw error;
  }
};

export const punchService = {
  getLoginHours: async (payload) => {
    const response = await api.post(
      "/expo_access_api/login_hours/",
      {
        AUTHORIZEKEY: AUTHORIZE_KEY,
        ...payload,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  },

  updateLoginLogoutTime: async (payload) => {
    const response = await api.post(
      "/expo_access_api/Updatelogin_logoutTime/",
      {
        AUTHORIZEKEY: AUTHORIZE_KEY,
        ...payload,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  },

  getBreakOutIDByAttrID: async (att_id) => {
    const payload = {
      AUTHORIZEKEY: AUTHORIZE_KEY,
      att_id,
    };

    const response = await api.post(
      "/expo_access_api/getBreakOutIDByAttrID/",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  },

  employeePunchIn: async ({ employee_id, datetime }) => {
    try {
      const locationPayload = await getLocationPayload("punch_in");
      const payload = {
        AUTHORIZEKEY: AUTHORIZE_KEY,
        employee_id,
        datetime,
        ...locationPayload,
      };

      const response = await api.post(
        "/expo_access_api/employee_punch_in_api/",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      if (error.message === "LOCATION_PERMISSION_REQUIRED") {
        throw new Error(
          "Location access is required for punching in. Please enable location permissions."
        );
      }
      throw error;
    }
  },

  employeePunchOut: async ({ employee_id, datetime, id }) => {
    try {
      const locationPayload = await getLocationPayload("punch_out");
      const payload = {
        AUTHORIZEKEY: AUTHORIZE_KEY,
        employee_id,
        datetime,
        id,
        ...locationPayload,
      };

      const response = await api.post(
        "/expo_access_api/employee_punch_out_api/",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      if (error.message === "LOCATION_PERMISSION_REQUIRED") {
        throw new Error(
          "Location access is required for punching out. Please enable location permissions."
        );
      }
      throw error;
    }
  },

  employeeBreakInOut: async ({ id, att_id, break_type, datetime }) => {
    const payload = {
      AUTHORIZEKEY: AUTHORIZE_KEY,
      ...(id && { id }), // Include id only if provided (for break-out)
      att_id,
      break_type,
      datetime,
    };

    const response = await api.post(
      "/expo_access_api/employee_break_in_out_api/",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  },
};
