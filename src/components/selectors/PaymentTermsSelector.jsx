"use client";

import { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const PaymentTermsSelector = ({
  options,
  selectedTerm,
  customDays,
  onChange,
  selectedContact,
  orderIdParam,
  salesOrderDetails,
}) => {
  // Auto-fill customDays with creditlimit_days when selectedTerm changes to "F"
  useEffect(() => {
    if (selectedTerm == "F" && selectedContact?.creditlimit_days != null) {
      // Only update if customDays hasn't been manually changed by the user
      // or if customDays is empty/unchanged
      if (!customDays || customDays == "") {
        onChange({
          term: selectedTerm,
          days: selectedContact.creditlimit_days.toString(),
        });
      }
    }
  }, [selectedTerm, selectedContact, customDays, onChange]);

  const handleTermChange = (value) => {
    // If switching away from "F", reset customDays to empty string
    const newDays = value == "F" ? customDays : "";
    onChange({ term: value, days: newDays });
  };

  const handleDaysChange = (e) => {
    onChange({ term: selectedTerm, days: e.target.value });
  };

  // Determine the selected term and days based on orderIdParam
  const displayTerm = orderIdParam
    ? salesOrderDetails?.payments_terms || selectedTerm
    : selectedTerm;
  // Ensure displayDays is a string or empty string to avoid null
  const displayDays =
    orderIdParam && salesOrderDetails?.payments_terms == "F"
      ? salesOrderDetails?.credit_days?.toString() || ""
      : customDays || "";

  // Find the label for the selected term
  const selectedOption = options.find((option) => option.value == displayTerm);
  const displayLabel = selectedOption ? selectedOption.label : "Select...";

  return (
    <div className="space-y-2">
      <h3 className="block text-base font-medium text-[#4a5a6b]">
        Payment Terms
      </h3>

      <div className="flex">
        <div
          className={`relative ${displayTerm == "F" ? "w-[80%]" : "w-full"}  ${
            !!orderIdParam ? "bg-gray-100" : "bg-white"
          }`}
        >
          <Select
            value={displayTerm}
            onValueChange={handleTermChange}
            disabled={!!orderIdParam}
          >
            <SelectTrigger
              className={`${displayTerm == "F" ? "rounded-r-none " : ""}`}
            >
              <SelectValue placeholder={displayLabel} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {displayTerm == "F" && (
          <div className="w-[20%]">
            <Input
              type="text"
              value={displayDays}
              onChange={handleDaysChange}
              placeholder="Days"
              className={`rounded-l-none border-l-0 pl-3 border-[#ced4da] focus:border-[#ced4da] focus:ring-0 ${
                !!orderIdParam ? "bg-gray-100" : "bg-white"
              }`}
              disabled={!!orderIdParam}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentTermsSelector;