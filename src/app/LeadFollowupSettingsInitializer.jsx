'use client';

import { useLeadFollowupSettings } from "@/hooks/useLeadFollowupSettings";

const LeadFollowupSettingsInitializer = () => {
  useLeadFollowupSettings();
  return null;
};

export default LeadFollowupSettingsInitializer;