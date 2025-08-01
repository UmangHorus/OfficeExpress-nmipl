// src/utils/location.js
export const getLocationInfo = async (latitude, longitude) => {
  const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!GOOGLE_API_KEY) {
    throw new Error("Google Maps API key is missing");
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      return {
        address: data.results[0].formatted_address,
        latitude,
        longitude,
      };
    }
    throw new Error(data.error_message || "No address found for location");
  } catch (error) {
    console.error("Geocoding failed:", error);
    throw error;
  }
};

export const getCurrentLocation = async () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000, // 10 second timeout
      maximumAge: 0, // Always get fresh location
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const gmapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

        try {
          const locationInfo = await getLocationInfo(latitude, longitude);
          resolve({
            ...locationInfo,
            accuracy,
            gmapLink,
          });
        } catch (error) {
          // If address lookup fails, still return coordinates
          resolve({
            latitude,
            longitude,
            accuracy,
            gmapLink,
            address: null,
            error: error.message,
          });
        }
      },
      (error) => {
        const errorMessages = {
          1: "Permission denied",
          2: "Position unavailable",
          3: "Request timed out",
        };
        reject(new Error( "Location error"));
      },
      options
    );
  });
};

export const checkLocationPermission = async () => {
  if (!navigator.geolocation) return "denied";

  if (navigator.permissions?.query) {
    try {
      const status = await navigator.permissions.query({ name: "geolocation" });
      return status.state;
    } catch {
      return "prompt";
    }
  }

  return "prompt";
};

export const requestLocationPermission = async () => {
  try {
    await getCurrentLocation({ timeout: 5000 });
    return "granted";
  } catch (error) {
    return error.message === "Permission denied" ? "denied" : "prompt";
  }
};

export const isLocationEnabled = async () => {
  try {
    const permission = await checkLocationPermission();
    return permission === "granted" || permission === "prompt";
  } catch (error) {
    console.error("Error checking location status:", error);
    return false;
  }
};
