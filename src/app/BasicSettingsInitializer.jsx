'use client';

import { useBasicSettings } from "@/hooks/useBasicSettings";

const BasicSettingsInitializer = () => {
  // This component doesn't render anything, it just triggers the data fetch
  useBasicSettings();
  return null;
};

export default BasicSettingsInitializer;