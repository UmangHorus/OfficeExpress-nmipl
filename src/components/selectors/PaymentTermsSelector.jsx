"use client";
import { useEffect, useState } from "react";
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
  const [hasManuallyChanged, setHasManuallyChanged] = useState(false);

  // Reset manual change flag when selectedContact changes
  useEffect(() => {
    setHasManuallyChanged(false);
  }, [selectedContact]);

  // Auto-fill customDays with creditlimit_days when selectedTerm changes to "F"
 useEffect(() => {
  if (selectedTerm == "F") {
    if (selectedContact?.creditlimit_days != null && !hasManuallyChanged) {
      // Auto-fill with contact's credit days
      onChange({
        term: selectedTerm,
        days: selectedContact.creditlimit_days.toString(),
      });
    } else if (!selectedContact?.creditlimit_days && !hasManuallyChanged) {
      // Clear days if contact has no creditlimit_days
      onChange({
        term: selectedTerm,
        days: "",
      });
    }
  }
}, [selectedTerm, selectedContact, onChange, hasManuallyChanged]);

  const handleTermChange = (value) => {
    setHasManuallyChanged(false); // Reset when changing term
    const newDays = value == "F" ? customDays : "";
    onChange({ term: value, days: newDays });
  };

  const handleDaysChange = (e) => {
    if (!hasManuallyChanged) setHasManuallyChanged(true);
    const value = e.target.value === "" ? "" : e.target.value.replace(/\D/g, "");
    onChange({ term: selectedTerm, days: value });
  };

  // Determine the selected term and days based on orderIdParam
  const displayTerm = orderIdParam
    ? salesOrderDetails?.payments_terms || selectedTerm
    : selectedTerm || "F";

  const displayDays =
    orderIdParam && salesOrderDetails?.payments_terms == "F"
      ? salesOrderDetails?.credit_days?.toString() || ""
      : customDays || "";

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
              inputMode="numeric"
              pattern="[0-9]*"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentTermsSelector;