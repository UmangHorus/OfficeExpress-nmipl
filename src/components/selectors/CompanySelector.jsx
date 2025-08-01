import React from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import useBasicSettingsStore from "@/stores/basicSettings.store";
import { useLoginStore } from "@/stores/auth.store";

const CompanySelector = ({
  options,
  value,
  onValueChange,
  orderIdParam,
  salesOrderDetails,
}) => {
  const { maincompanyname } = useBasicSettingsStore();
  const { user } = useLoginStore();

  // If orderIdParam exists, display salesOrderDetails.company_name
  if (orderIdParam && salesOrderDetails?.company_name) {
    return (
      <div className="space-y-2">
        <label className="block text-base font-medium text-[#4a5a6b]">
          Company
        </label>
        <div className="w-full border border-input bg-background px-3 py-2 rounded-md text-sm">
          {salesOrderDetails.company_name || "N/A"}
        </div>
      </div>
    );
  }

  // Default behavior for new orders
  if (!user?.isEmployee) {
    return (
      <div className="space-y-2">
        <label className="block text-base font-medium text-[#4a5a6b]">
          Company
        </label>
        <div className="w-full border border-input bg-background px-3 py-2 rounded-md text-sm">
          {maincompanyname || "N/A"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-base font-medium text-[#4a5a6b]">
        Select Company
      </label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          {options.map((company) => (
            <SelectItem key={company.company_id} value={company.company_id}>
              {company.company_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CompanySelector;
