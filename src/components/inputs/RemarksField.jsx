"use client";

import { Textarea } from "@/components/ui/textarea";

const RemarksField = ({
  placeholder = "",
  value,
  onChange,
  orderIdParam,
  salesOrderDetails,
}) => {
  const isEditMode = !!orderIdParam;

  return (
    <Textarea
      placeholder={placeholder}
      value={isEditMode ? salesOrderDetails?.remarks : value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={isEditMode}
      className={`border-gray-300 rounded-md focus:outline-none focus:ring-0 focus:border-gray-400 focus:shadow-md  ${
        isEditMode ? "bg-background" : "bg-white"
      }`}
    />
  );
};

export default RemarksField;
