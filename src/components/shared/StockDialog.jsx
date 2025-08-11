"use client";

import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const StockDialog = ({ open, setOpen, product }) => {

  // Function to format numbers based on allow_product_decimals_point
  const formatNumber = (value, decimalPoints) => {
    if (value === null || value === undefined || value === "") return value;
    // If decimalPoints is blank, null, or undefined, return value as-is
    if (!decimalPoints) return value;
    const num = parseFloat(value);
    if (isNaN(num)) return value; // Return original if not a number
    if (Number.isInteger(num)) return num.toString(); // Return integer as-is
    const maxDecimals = parseInt(decimalPoints, 10) || 0;
    const decimalCount = (num.toString().split(".")[1] || "").length;
    if (decimalCount <= maxDecimals) return num.toString(); // Return as-is if within limit
    return num.toFixed(maxDecimals); // Truncate to maxDecimals
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[90vw] max-w-[425px] md:w-full md:max-w-[600px] lg:max-w-[800px] max-h-[90vh] overflow-y-auto bg-white p-4 sm:p-6 rounded-lg">
        <DialogHeader>
          <DialogTitle>Stock Details</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col">
          <h4 className="text-base font-medium text-gray-700 mb-4">
            Product: {product?.productname || "N/A"}
          </h4>
          {product?.stock_data?.length > 0 ? (
            <Table className="">
              <TableHeader>
                <TableRow className="bg-[#4a5a6b] text-white text-center hover:bg-[#4a5a6b]">
                  <TableHead className="text-white text-sm sm:text-base px-2 sm:px-4 py-2">
                    Branch Name
                  </TableHead>
                  <TableHead className="text-white text-sm sm:text-base px-2 sm:px-4 py-2">
                    Current Stock
                  </TableHead>
                  <TableHead className="text-white text-sm sm:text-base px-2 sm:px-4 py-2">
                    Stock on Sales Order
                  </TableHead>
                  <TableHead className="text-white text-sm sm:text-base px-2 sm:px-4 py-2">
                    Remaining
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.stock_data.map((stock, index) => (
                  <TableRow key={index} className="text-center">
                    <TableCell className="text-left">
                      {stock.branch_name}
                    </TableCell>
                    <TableCell className="text-left">
                      {formatNumber(stock.currenct_stock, stock.allow_product_decimals_point)}
                    </TableCell>
                    <TableCell className="text-left">
                      {formatNumber(stock.stockonsalesorder, stock.allow_product_decimals_point)}
                    </TableCell>
                    <TableCell className="text-left">
                      {formatNumber(stock.remaining, stock.allow_product_decimals_point)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-gray-500 text-center">
              No stock data available
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};