"use client";

import { useEffect, useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Calculator,
  Calendar,
  CreditCard,
  Plus,
  Settings,
  Smile,
  Trash2,
  User,
  X,
} from "lucide-react";
import FileUploadCard from "../inputs/FileUploadCard";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
// import { productsdummy } from "./dummy";
import { useMemo } from "react";
import { ProductSearch } from "../inputs/search";

const EditableProductTable = ({ products, setProducts }) => {
  const handleInputChange = (id, field, value) => {
    // For qty, ensure the value is a number or empty string
    if (field == "qty") {
      // Allow empty string or valid number (including decimals)
      if (value == "" || (!isNaN(value) && value.trim() != "")) {
        setProducts(
          products.map((product) =>
            product.id == id ? { ...product, [field]: value } : product
          )
        );
      }
    } else {
      // Handle other fields (name, unit) as before
      setProducts(
        products.map((product) =>
          product.id == id ? { ...product, [field]: value } : product
        )
      );
    }
  };
  const addRow = () => {
    const newId = products.length ? products[products.length - 1].id + 1 : 1;
    setProducts([...products, { id: newId, name: "", qty: "", unit: "" }]);
  };

  const deleteRow = (id) => {
    if (products.length == 1) {
      // If only one row, clear its fields instead of deleting
      setProducts(
        products.map((product) =>
          product.id == id
            ? { ...product, name: "", qty: "", unit: "" }
            : product
        )
      );
    } else {
      // Otherwise, remove the row
      setProducts(products.filter((product) => product.id != id));
    }
  };
  const handleProductSelect = (product) => {};

  return (
    <div className="w-full">
      {/* Desktop View (hidden on mobile) */}
      <div className="hidden md:block overflow-x-auto">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow className="bg-[#4a5a6b] hover:bg-[#4a5a6b] text-white">
              <TableHead className="text-white text-sm sm:text-base px-2 sm:px-4 py-2 bg-[#4a5a6b] text-center">
                Actions
              </TableHead>
              <TableHead className="text-white text-sm sm:text-base px-2 sm:px-4 py-2 bg-[#4a5a6b] text-center">
                Product Name
              </TableHead>
              <TableHead className="text-white text-sm sm:text-base px-2 sm:px-4 py-2 bg-[#4a5a6b] text-center">
                Qty
              </TableHead>
              <TableHead className="text-white text-sm sm:text-base px-2 sm:px-4 py-2 bg-[#4a5a6b] text-center">
                Unit
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="px-2 sm:px-4 py-2 text-center">
                  <Trash2
                    className="h-8 w-8 sm:h-9 sm:w-9 p-2 text-red-600 hover:bg-red-100 rounded-full cursor-pointer inline-block"
                    onClick={() => deleteRow(product.id)}
                  />
                </TableCell>
                <TableCell className="px-2 sm:px-4 py-2">
                  <Input
                    value={product.name}
                    onChange={(e) =>
                      handleInputChange(product.id, "name", e.target.value)
                    }
                    placeholder="Enter product name"
                    className="input-focus-style"
                  />
                </TableCell>
                <TableCell className="px-2 sm:px-4 py-2">
                  <Input
                    value={product.qty}
                    onChange={(e) =>
                      handleInputChange(product.id, "qty", e.target.value)
                    }
                    placeholder="Enter quantity"
                    className="input-focus-style"
                  />
                </TableCell>
                <TableCell className="px-2 sm:px-4 py-2">
                  <Input
                    value={product.unit}
                    onChange={(e) =>
                      handleInputChange(product.id, "unit", e.target.value)
                    }
                    placeholder="Enter unit"
                    className="input-focus-style"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View (hidden on desktop) */}
      <div className="md:hidden space-y-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="border rounded-lg p-4 bg-white shadow-sm"
          >
            <div className="grid grid-cols-1 gap-4 mb-3">
              <div className="flex items-end justify-end">
                <Trash2
                  className="p-2 text-red-600 hover:bg-red-100 rounded-full cursor-pointer"
                  onClick={() => deleteRow(product.id)}
                  size={36}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Product Name
                </label>
                <Input
                  value={product.name}
                  onChange={(e) =>
                    handleInputChange(product.id, "name", e.target.value)
                  }
                  placeholder="Enter product name"
                  className="input-focus-style mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Qty</label>
                <Input
                  value={product.qty}
                  onChange={(e) =>
                    handleInputChange(product.id, "qty", e.target.value)
                  }
                  placeholder="Enter quantity"
                  className="input-focus-style mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Unit
                </label>
                <Input
                  value={product.unit}
                  onChange={(e) =>
                    handleInputChange(product.id, "unit", e.target.value)
                  }
                  placeholder="Enter unit"
                  className="input-focus-style mt-1"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-end mt-2 px-2 sm:px-4 py-4">
        <Button
          type="button"
          onClick={addRow}
          className="bg-[#287f71] hover:bg-[#20665a] text-white text-sm sm:text-base px-4 py-2"
        >
          <Plus className="h-4 w-4" /> Add Row
        </Button>
      </div>
    </div>
  );
};

export default EditableProductTable;
