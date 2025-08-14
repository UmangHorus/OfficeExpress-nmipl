"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format, parse } from "date-fns";

const ProdAttrDialog = ({
  open,
  setOpen,
  product,
  index,
  formValues,
  setFormValues,
}) => {
  const [attributes, setAttributes] = useState([]);
  const [localAttrValues, setLocalAttrValues] = useState({});

 useEffect(() => {
    if (product?.Attribute_data) {
      const attrArray = Object.values(product?.Attribute_data ?? {}).map(
        (attr) => ({
          ...attr,
          Masters: Array.isArray(attr?.Masters)
            ? attr?.Masters
            : Object.values(attr?.Masters ?? {}).filter(
                (master) => master?.N && master?.ID
              ),
        })
      );
      setAttributes(attrArray);

      // Initialize local attribute values from formValues or from Attribute_data defaults
      const productAttrKey = `${product?.productid}_${index}`;
      const existingAttrs =
        formValues?.[index]?.attribute?.[productAttrKey] ?? {};

      // Create default values if none exist
      const defaultAttrs = {};
      attrArray.forEach((attr) => {
        if (existingAttrs[attr?.ID] == undefined) {
          if (
            (attr?.Type == "3" || attr?.Type == "2") &&
            attr?.Masters?.length > 0
          ) {
            // For select type attributes with Masters
            if (attr?.ValueID) {
              const matchedMaster = attr?.Masters?.find(
                (master) => master?.N == attr?.ValueID
              );
              if (matchedMaster) {
                defaultAttrs[attr?.ID] = matchedMaster?.ID;
              }
            }
          } else if (attr?.ValueID) {
            // For other types, use ValueID if available
            let value = attr?.ValueID;
            if (attr?.Type == "6") {
              // Strip time component from date if present (e.g., "19/03/2025 02:20" -> "19/03/2025")
              value = value?.split(" ")[0] ?? "";
            }
            defaultAttrs[attr?.ID] = value;
          }
        }
      });

      setLocalAttrValues({
        ...defaultAttrs,
        ...existingAttrs,
      });
    } else {
      setAttributes([]);
      setLocalAttrValues({});
    }
  }, [open, product, index, formValues]);

  const handleInputChange = (attrId, value) => {
    setLocalAttrValues((prev) => ({
      ...prev,
      [attrId]: value,
    }));
  };

  const handleSave = () => {
    const productAttrKey = `${product?.productid}_${index}`;
    const newFormValues = [...(formValues ?? [])];
    newFormValues[index] = {
      ...newFormValues?.[index],
      attribute: {
        ...newFormValues?.[index]?.attribute,
        [productAttrKey]: localAttrValues,
      },
    };
    setFormValues(newFormValues);
    toast.success("Product attributes saved successfully", {
      duration: 2000,
    });
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const renderAttributeInput = (attr, rowIndex) => {
    switch (String(attr?.Type)) {
      case "1":
        return (
          <Input
            type="text"
            className="w-full text-sm input-focus-style"
            value={localAttrValues?.[attr?.ID] ?? ""}
            onChange={(e) => handleInputChange(attr?.ID, e.target.value)}
          />
        );
      case "2":
      case "3":
        return (
          <Select
            value={localAttrValues?.[attr?.ID] ?? ""}
            onValueChange={(value) =>
              handleInputChange(attr?.ID, value == "select" ? "" : value)
            }
          >
            <SelectTrigger className="w-full text-sm input-focus-style">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="select">Select</SelectItem>
              {(attr?.Masters ?? []).map((option) => (
                <SelectItem key={option?.ID} value={option?.ID}>
                  {option?.N ?? "Unknown"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "4":
        return (
          <Input
            type="text"
            className="w-full text-sm input-focus-style"
            value={localAttrValues?.[attr?.ID] ?? ""}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, "");
              handleInputChange(attr?.ID, value);
            }}
          />
        );
      case "5":
        return (
          <Input
            type="text"
            className="w-full text-sm input-focus-style"
            value={localAttrValues?.[attr?.ID] ?? ""}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9.]/g, "");
              handleInputChange(attr?.ID, value);
            }}
          />
        );
      case "6":
        return (
          <Input
            type="date"
            className="w-full text-sm input-focus-style"
            value={
              localAttrValues?.[attr?.ID]
                ? format(
                    parse(
                      localAttrValues?.[attr?.ID]?.split(" ")[0] ?? "",
                      "dd/MM/yyyy",
                      new Date()
                    ),
                    "yyyy-MM-dd"
                  )
                : ""
            }
            onChange={(e) => {
              const formattedDate = e.target.value
                ? format(
                    parse(e.target.value, "yyyy-MM-dd", new Date()),
                    "dd/MM/yyyy"
                  )
                : "";
              handleInputChange(attr?.ID, formattedDate);
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[90vw] max-w-[425px] md:w-full md:max-w-[600px] lg:max-w-[800px] max-h-[90vh] overflow-y-auto bg-white p-4 sm:p-6 rounded-lg">
        <DialogHeader>
          <DialogTitle>Product Attributes</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col">
          <h4 className="text-base font-medium text-gray-700 mb-4">
            Product: {product?.productname ?? "N/A"} (
            {product?.productcode ?? ""})
          </h4>
          {attributes?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {attributes?.map((attr) => (
                <div key={attr?.ID}>
                  <label className="text-sm font-semibold text-gray-800 mb-2 block">
                    {attr?.Name ?? "Unknown"}
                  </label>
                  {renderAttributeInput(attr, index)}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center">
              No attribute data available
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={handleCancel} className="text-sm">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[#287f71] hover:bg-[#20665a] text-white text-sm"
            disabled={attributes?.length == 0}
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProdAttrDialog;
