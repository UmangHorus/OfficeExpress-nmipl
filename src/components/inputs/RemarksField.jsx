"use client";

import { Textarea } from "@/components/ui/textarea";

const RemarksField = ({
  placeholder = "",
  value = "", // Provide default empty string if value is undefined/null
  onChange,
  orderIdParam,
  salesOrderDetails,
}) => {
  const isEditMode = !!orderIdParam;

  // Determine the value to display
  const displayValue = isEditMode 
    ? salesOrderDetails?.remarks || "" 
    : value || "";

  return (
    <Textarea
      placeholder={placeholder}
      value={displayValue} // Always provide a string (empty if undefined/null)
      onChange={(e) => onChange?.(e.target.value)}
      disabled={isEditMode}
      className={`border-gray-300 rounded-md focus:outline-none focus:ring-0 focus:border-gray-400 focus:shadow-md ${
        isEditMode ? "bg-background" : "bg-white"
      }`}
    />
  );
};

export default RemarksField;