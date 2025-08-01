"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { useController } from "react-hook-form";

export const MultiSelect = ({
  // Form props (optional)
  control,
  name,
  // State props (optional)
  selected: propSelected = [],
  onSelectedChange,
  // Common props
  label,
  required = false,
  options = [],
  // Dynamic key props
  valueKey = "value",
  labelKey = "label",
  descriptionKey = "description",
}) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [internalSelected, setInternalSelected] = useState(propSelected);
  const popoverRef = useRef(null);

  // Determine if we're using form control
  const isControlled = !!control && !!name;
  const { field } = isControlled
    ? useController({
        control,
        name,
        defaultValue: [], // Ensure default empty array
      })
    : { field: null };
  const selected = isControlled ? field?.value || [] : internalSelected;

  // Get option value safely
  const getOptionValue = (option) => option[valueKey];
  const getOptionLabel = (option) => option[labelKey];
  const getOptionDescription = (option) =>
    descriptionKey ? option[descriptionKey] : null;

  // Sync internal state with prop changes
  useEffect(() => {
    if (!isControlled) {
      setInternalSelected(propSelected);
    }
  }, [propSelected, isControlled]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelectionChange = (newSelected) => {
    if (isControlled && field) {
      field.onChange(newSelected);
    } else {
      setInternalSelected(newSelected);
    }
    if (onSelectedChange) {
      onSelectedChange(newSelected);
    }
  };

  const handleUnselect = (value) => {
    const newSelected = selected.filter((item) => item !== value);
    handleSelectionChange(newSelected);
  };

  const handleSelect = (value) => {
    const newSelected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];
    handleSelectionChange(newSelected);
  };

  const handleSelectAll = () => {
    if (selected.length === options.length) {
      handleSelectionChange([]);
    } else {
      handleSelectionChange(options.map(getOptionValue));
    }
  };

  const filteredOptions = options.filter((option) =>
    getOptionLabel(option).toLowerCase().includes(inputValue.toLowerCase())
  );

  const renderDropdown = () => (
    <div className="relative w-full" ref={popoverRef}>
      <div
        className={`flex items-center justify-between w-full px-4 py-2 text-sm border rounded-md hover:bg-accent hover:text-accent-foreground input-focus-style cursor-pointer ${
          required && selected.length === 0 ? "border-red-500" : ""
        }`}
        onClick={() => setOpen(!open)}
      >
        <div className="flex flex-wrap gap-1">
          {selected.length === 0 ? (
            <span>Select {label.toLowerCase()}...</span>
          ) : (
            <>
              {selected.slice(0, 2).map((value) => {
                const option = options.find(
                  (opt) => getOptionValue(opt) === value
                );
                return (
                  <span
                    key={value}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-[#287f71] hover:bg-[#20665a] text-white mr-1 mb-1"
                  >
                    {option ? getOptionLabel(option) : value}
                    <span
                      className="ml-1 rounded-full outline-none focus:outline-none cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnselect(value);
                      }}
                    >
                      <X className="h-3 w-3 text-white" />
                    </span>
                  </span>
                );
              })}
              {selected.length > 2 && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-[#287f71] hover:bg-[#20665a] text-white mr-1 mb-1">
                  +{selected.length - 2} more
                </span>
              )}
            </>
          )}
        </div>
        <ChevronsUpDown className="h-4 w-4 opacity-50" />
      </div>

      {open && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
          <div className="p-2 border-b">
            <input
              type="text"
              placeholder={`Search ${label.toLowerCase()}...`}
              className="w-full px-3 py-2 text-sm border rounded-md  input-focus-style  focus:ring-1 focus:ring-black"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              autoFocus
            />
          </div>

          <div className="max-h-60 overflow-y-auto">
            <div className="p-1">
              <div
                className="flex items-center px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-gray-100"
                onClick={handleSelectAll}
              >
                <div
                  className={`flex items-center justify-center w-4 h-4 mr-2 border rounded-sm ${
                    selected.length === options.length
                      ? "bg-[#287f71] hover:bg-[#20665a] text-white"
                      : "border-gray-300"
                  }`}
                >
                  {selected.length === options.length && (
                    <Check className="w-3 h-3" />
                  )}
                </div>
                (Select All)
              </div>

              {filteredOptions.length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-gray-500">
                  No options found.
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const value = getOptionValue(option);
                  const label = getOptionLabel(option);
                  const description = getOptionDescription(option);

                  return (
                    <div
                      key={value}
                      className="flex items-center px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSelect(value)}
                    >
                      <div
                        className={`flex items-center justify-center w-4 h-4 mr-2 border rounded-sm ${
                          selected.includes(value)
                            ? "bg-[#287f71] hover:bg-[#20665a] text-white"
                            : "border-gray-300"
                        }`}
                      >
                        {selected.includes(value) && (
                          <Check className="w-3 h-3" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{label}</div>
                        {description && (
                          <div className="text-xs text-gray-500">
                            {description}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex justify-between p-2 border-t">
            <div
              className={`px-3 py-1 text-sm rounded ${
                selected.length === 0
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100 cursor-pointer"
              }`}
              onClick={() => selected.length > 0 && handleSelectionChange([])}
            >
              Clear
            </div>
            <div className="flex gap-2">
              <div
                className="px-3 py-1 text-sm text-gray-700 rounded hover:bg-gray-100 cursor-pointer"
                onClick={() => setOpen(false)}
              >
                Close
              </div>
              <div
                className="px-3 py-1 text-sm text-white bg-[#287f71] hover:bg-[#20665a] rounded-sm cursor-pointer"
                onClick={() => setOpen(false)}
              >
                Submit
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isControlled) {
    return (
      <FormField
        control={control}
        name={name}
        render={({ fieldState }) => (
          <FormItem>
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor={name} className="text-sm md:text-base">
                {label}
                {required && <span className="text-red-500"> *</span>}
              </Label>
              <FormControl>{renderDropdown()}</FormControl>
              {required && <FormMessage className="text-xs h-2" />}
            </div>
          </FormItem>
        )}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2">
      <Label className="text-sm md:text-base">
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      {renderDropdown()}
    </div>
  );
};
