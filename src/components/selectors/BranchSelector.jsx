import React from "react";
import { useLoginStore } from "@/stores/auth.store";
import useBasicSettingsStore from "@/stores/basicSettings.store";

const BranchSelector = ({ orderIdParam, salesOrderDetails }) => {
  const { mainbranchname } = useBasicSettingsStore();
  const { user, appConfig } = useLoginStore();

  // If orderIdParam exists, display salesOrderDetails.branch_name
  if (orderIdParam && salesOrderDetails?.branch_name) {
    return (
      <div className="space-y-2">
        <label className="block text-base font-medium text-[#4a5a6b]">
          Branch
        </label>
        <div className="w-full border border-input bg-background px-3 py-2 rounded-md text-sm">
          {salesOrderDetails.branch_name || "N/A"}
        </div>
      </div>
    );
  }

  // Default behavior for new orders
  const displayBranchName = user?.isEmployee
    ? appConfig?.branch_name || "N/A"
    : mainbranchname || "N/A";

  return (
    <div className="space-y-2">
      <label className="block text-base font-medium text-[#4a5a6b]">
        Branch
      </label>
      <div className="w-full border border-input bg-background px-3 py-2 rounded-md text-sm">
        {displayBranchName}
      </div>
    </div>
  );
};

export default BranchSelector;
