import axios from "axios";

const API_CONFIG = {
  FALLBACK_1: process.env.NEXT_PUBLIC_API_BASE_URL_FALLBACK,
  FALLBACK_2: process.env.NEXT_PUBLIC_API_BASE_URL_FALLBACK_2,
  ADMIN: process.env.NEXT_PUBLIC_ADMIN_API,
};

let dynamicApiUrl = API_CONFIG.FALLBACK_1; // Initialize with fallback

// Only fetch dynamic URL in production
async function fetchConnectionLink() {
  try {
    const response = await axios.get(
      `${API_CONFIG.ADMIN}/expo_access_api/getconnection`,
      {
        params: { domain: window.location.hostname },
        timeout: 5000,
      }
    );
    return response.data?.url || API_CONFIG.FALLBACK_1;
  } catch (error) {
    console.error("Failed to fetch connection URL:", error);
    return API_CONFIG.FALLBACK_1;
  }
}

// Initialize API client (client-side only)
async function initializeApiClient() {
  if (typeof window === "undefined") return API_CONFIG.FALLBACK_1; // SSR safety

  const { hostname } = window.location;
  const isLocalOrDev =
    hostname.includes(".vercel.app") || hostname === "localhost";

  if (isLocalOrDev || !API_CONFIG.ADMIN) {
    return API_CONFIG.FALLBACK_1; // Skip dynamic fetch in local/dev
  }

  return await fetchConnectionLink();
}

const api = axios.create({
  baseURL: dynamicApiUrl, // Use initialized URL
  timeout: 15000,
});

// Client-side initialization
if (typeof window !== "undefined") {
  initializeApiClient().then((url) => {
    dynamicApiUrl = url;
    api.defaults.baseURL = url;
    // console.log("API initialized with URL:", url);
    console.log("API base URL set to:", url);
    console.log("API window.location.hostname", window.location.hostname);
  });
}

api.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"]; // Fix for FormData
    }
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

export default api;
