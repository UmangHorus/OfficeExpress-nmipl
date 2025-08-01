// useLocationPermission.js
import { requestLocationPermission } from "@/utils/location";
import { useCallback } from "react";

const useLocationPermission = () => {
  const checkAndRequestLocation = useCallback(async (context = "operation") => {
    try {
      const permission = await requestLocationPermission();
      if (permission !== "granted") {
        throw new Error(
          `Location access is required for ${context}. Please enable location permissions in your browser settings.`
        );
      }
      return true;
    } catch (error) {
      throw error;
    }
  }, []);

  return checkAndRequestLocation;
};

export default useLocationPermission;
