"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { User, FileText, File, MessageSquare } from "lucide-react";
import OrderService from "@/lib/OrderService";
import { useLoginStore } from "@/stores/auth.store";

const OrderDetailsDialog = ({ salesorderId, open, onOpenChange }) => {
  const { navConfig } = useLoginStore();
  const baseurl = process.env.NEXT_PUBLIC_API_BASE_URL_FALLBACK;
  const ordersLabel = navConfig?.labels?.orders || "Sales Order";

  // Fetch sales order details
  const {
    data: orderData,
    error: orderError,
    isLoading: orderLoading,
  } = useQuery({
    queryKey: ["salesOrderDetails", salesorderId],
    queryFn: () => OrderService.checkSalesorder(salesorderId),
    enabled: open && !!salesorderId,
    refetchOnMount: "always",
    staleTime: 0,
    cacheTime: 0,
  });

  const [salesOrderDetails, setSalesOrderDetails] = useState(null);
  const [salesOrderDivisionConfig, setSalesOrderDivisionConfig] = useState("");

  // Handle sales order data
  useEffect(() => {
    if (orderData && orderData[0]?.STATUS == "SUCCESS") {
      setSalesOrderDetails(orderData[0].DATA.salesorderdetail.Salesorder);
      setSalesOrderDivisionConfig(orderData[0].DATA.config_division);
    } else if (orderData && orderData[0]?.STATUS == "ERROR") {
      toast.error(orderData[0]?.MSG || "Failed to fetch order details");
      onOpenChange(false);
    }
    if (orderError) {
      toast.error("An error occurred while fetching order details");
      onOpenChange(false);
    }
  }, [orderData, orderError, onOpenChange]);

  const calculateSalesOrderDiscountAmount = (item) => {
    let baseAmount = 0;
    if (item?.conversion_flg != "") {
      if (item.unit_con_mode == "1" && item.conversion_flg == "1") {
        baseAmount = parseFloat(item.productqty || "0") * parseFloat(item.rate || "0");
      } else if (item.unit_con_mode == "1" && item.conversion_flg == "2") {
        baseAmount =
          (parseFloat(item.SecQtyTotal || "0") * parseFloat(item.rate || "0")) /
          parseFloat(item.secondary_base_qty || "1");
      } else if (item.unit_con_mode == "3" && item.conversion_flg == "2") {
        baseAmount =
          parseFloat(item.SecQtyTotal || "0") * parseFloat(item.sec_unit_rate || "0");
      } else {
        baseAmount = parseFloat(item.productqty || "0") * parseFloat(item.rate || "0");
      }
    } else {
      baseAmount = parseFloat(item.productqty || "0") * parseFloat(item.rate || "0");
    }
    return baseAmount * (parseFloat(item.total_discount || "0") / 100);
  };

  const products = salesOrderDetails?.Products || [];
  const saleProductCharges = salesOrderDetails?.sale_product_charge || [];

  const totalSalesorderProductQty = Array.isArray(products)
    ? products.reduce((sum, item) => sum + parseFloat(item.productqty || "0"), 0)
    : 0;

  const subtotal = Array.isArray(products)
    ? products.reduce((sum, item) => sum + parseFloat(item.totalrate || "0"), 0)
    : 0;

  const totalDiscount = Array.isArray(products)
    ? products.reduce((sum, item) => sum + calculateSalesOrderDiscountAmount(item), 0)
    : 0;

  const totalCharges = Array.isArray(saleProductCharges)
    ? saleProductCharges.reduce(
        (sum, charge) => sum + parseFloat(charge.so_chrg_tax_amount || "0"),
        0
      )
    : 0;

  const netAmount = (subtotal - totalDiscount).toFixed(2);
  const grossTotal = (parseFloat(netAmount) + totalCharges).toFixed(2);

  const getPaymentTermsMessage = (value) => {
    switch (value) {
      case "A":
        return "100% Advance";
      case "F":
        return "Full(Credit days)";
      case "P":
        return "Part / Advance";
      case "E":
        return "EMI";
      default:
        return "";
    }
  };

  if (orderLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[90vw] max-w-[425px] md:w-full md:max-w-[600px] lg:max-w-[1000px] max-h-[90vh] overflow-y-auto bg-white p-4 sm:p-6 rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-2xl font-bold text-center">
              Loading {ordersLabel} Details
            </DialogTitle>
          </DialogHeader>
          <p className="text-center">Loading...</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-[425px] md:w-full md:max-w-[600px] lg:max-w-[1000px] max-h-[90vh] overflow-y-auto bg-white p-4 sm:p-6 rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-2xl font-bold text-center">
            {ordersLabel} Details
          </DialogTitle>
          <DialogClose className="absolute right-4 top-4" />
        </DialogHeader>
        <div className="space-y-4 sm:space-y-6 details-page">
          {/* Customer and Order Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Details */}
            <div className="bg-[#4CAF93] bg-opacity-20 p-3 sm:p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <User className="h-5 w-5 sm:h-6 sm:w-6 text-[#287F71] mr-2" />
                <h3 className="text-base sm:text-lg font-semibold">Customer Details</h3>
              </div>
              <div className="space-y-2 text-sm sm:text-base">
                <div className="flex flex-col sm:flex-row">
                  <p className="w-full sm:w-1/3 font-medium text-[#287F71]">Contact:</p>
                  <p className="w-full sm:w-2/3 break-words overflow-hidden max-w-full">
                    {salesOrderDetails?.ContactName || "-"}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row">
                  <p className="w-full sm:w-1/3 font-medium text-[#287F71]">Mobile:</p>
                  <p className="w-full sm:w-2/3 break-words overflow-hidden max-w-full">
                    {salesOrderDetails?.Contactmobile_no || "-"}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row">
                  <p className="w-full sm:w-1/3 font-medium text-[#287F71]">Email:</p>
                  <p className="w-full sm:w-2/3 break-words overflow-hidden max-w-full">
                    {salesOrderDetails?.email || "-"}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row">
                  <p className="w-full sm:w-1/3 font-medium text-[#287F71]">Customer Name:</p>
                  <p className="w-full sm:w-2/3 break-words overflow-hidden max-w-full">
                    {salesOrderDetails?.patient_name || "-"}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row">
                  <p className="w-full sm:w-1/3 font-medium text-[#287F71]">Billing Address:</p>
                  <p className="w-full sm:w-2/3 break-words overflow-hidden max-w-full">
                    {salesOrderDetails?.billing_address || "-"}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row">
                  <p className="w-full sm:w-1/3 font-medium text-[#287F71]">Shipping Address:</p>
                  <p className="w-full sm:w-2/3 break-words overflow-hidden max-w-full">
                    {salesOrderDetails?.shipping_address || "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="bg-[#4CAF93] bg-opacity-20 p-3 sm:p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-[#287F71] mr-2" />
                <h3 className="text-base sm:text-lg font-semibold">{ordersLabel} Details</h3>
              </div>
              <div className="space-y-2 text-sm sm:text-base">
                <div className="flex flex-col sm:flex-row">
                  <p className="w-full sm:w-1/3 font-medium text-[#287F71]">{ordersLabel} No:</p>
                  <p className="w-full sm:w-2/3 break-words overflow-hidden max-w-full">
                    {salesOrderDetails?.fullsalesorderno || "-"}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row">
                  <p className="w-full sm:w-1/3 font-medium text-[#287F71]">{ordersLabel} Date & Time:</p>
                  <p className="w-full sm:w-2/3 break-words overflow-hidden max-w-full">
                    {salesOrderDetails?.Date || "-"}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row">
                  <p className="w-full sm:w-1/3 font-medium text-[#287F71]">{ordersLabel} Status:</p>
                  <p className="w-full sm:w-2/3 break-words overflow-hidden max-w-full">
                    {salesOrderDetails?.OrderStatuslabel || "-"}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row">
                  <p className="w-full sm:w-1/3 font-medium text-[#287F71]">Branch:</p>
                  <p className="w-full sm:w-2/3 break-words overflow-hidden max-w-full">
                    {salesOrderDetails?.branch_name || "-"}
                  </p>
                </div>
                {salesOrderDivisionConfig > 0 && (
                  <div className="flex flex-col sm:flex-row">
                    <p className="w-full sm:w-1/3 font-medium text-[#287F71]">Division:</p>
                    <p className="w-full sm:w-2/3 break-words overflow-hidden max-w-full">
                      {salesOrderDetails?.division_name || "-"}
                    </p>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row">
                  <p className="w-full sm:w-1/3 font-medium text-[#287F71]">Delivery Mode:</p>
                  <p className="w-full sm:w-2/3 break-words overflow-hidden max-w-full">
                    {salesOrderDetails?.delivery_mode || "-"}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row">
                  <p className="w-full sm:w-1/3 font-medium text-[#287F71]">Dispatch Status:</p>
                  <p className="w-full sm:w-2/3 break-words overflow-hidden max-w-full">
                    {salesOrderDetails?.dispatch_status || "-"}
                  </p>
                </div>
                {salesOrderDetails?.credit_days && (
                  <div className="flex flex-col sm:flex-row">
                    <p className="w-full sm:w-1/3 font-medium text-[#287F71]">Credit Days:</p>
                    <p className="w-full sm:w-2/3 break-words overflow-hidden max-w-full">
                      {salesOrderDetails?.credit_days || "0"}
                    </p>
                  </div>
                )}
                {salesOrderDetails?.payments_terms && (
                  <div className="flex flex-col sm:flex-row">
                    <p className="w-full sm:w-1/3 font-medium text-[#287F71]">Payment Terms:</p>
                    <p className="w-full sm:w-2/3 break-words overflow-hidden max-w-full">
                      {getPaymentTermsMessage(salesOrderDetails.payments_terms) || "-"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Process Flow */}
          <div className="flex justify-between items-center mt-4 mx-0 sm:mx-16">
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg p-2 ${
                  Number(salesOrderDetails?.OrderStatus) == 1
                    ? "bg-yellow-100 border-b-4 border-blue-500"
                    : Number(salesOrderDetails?.OrderStatus) < 1
                    ? "border-gray-300"
                    : "bg-blue-100"
                }`}
              >
                <img
                  src={`${baseurl}/public/images/orderbot/order_received.png`}
                  alt="Order Received"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div
              className={`flex-1 h-1 sm:mx-2 ${
                Number(salesOrderDetails?.OrderStatus) <= 1
                  ? "border-dashed border-gray-300"
                  : "bg-blue-200"
              }`}
            ></div>
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg p-2 ${
                  Number(salesOrderDetails?.OrderStatus) == 2
                    ? "bg-yellow-100 border-b-4 border-blue-500"
                    : Number(salesOrderDetails?.OrderStatus) < 2
                    ? "border-gray-300"
                    : "bg-blue-100"
                }`}
              >
                <img
                  src={`${baseurl}/public/images/orderbot/order_accepted.png`}
                  alt="Order Accepted"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div
              className={`flex-1 h-1 sm:mx-2 ${
                Number(salesOrderDetails?.OrderStatus) <= 2
                  ? "border-dashed border-gray-300"
                  : "bg-blue-200"
              }`}
            ></div>
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg p-2 ${
                  Number(salesOrderDetails?.OrderStatus) == 3
                    ? "bg-yellow-100 border-b-4 border-blue-500"
                    : Number(salesOrderDetails?.OrderStatus) < 3
                    ? "border-gray-300"
                    : "bg-blue-100"
                }`}
              >
                <img
                  src={`${baseurl}/public/images/orderbot/order_assigned.png`}
                  alt="Order Assigned"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div
              className={`flex-1 h-1 sm:mx-2 ${
                Number(salesOrderDetails?.OrderStatus) <= 3
                  ? "border-dashed border-gray-300"
                  : "bg-blue-200"
              }`}
            ></div>
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg p-2 ${
                  Number(salesOrderDetails?.OrderStatus) == 4
                    ? "bg-yellow-100 border-b-4 border-blue-500"
                    : Number(salesOrderDetails?.OrderStatus) < 4
                    ? "border-gray-300"
                    : "bg-blue-100"
                }`}
              >
                <img
                  src={`${baseurl}/public/images/orderbot/order_out_for_delivery.png`}
                  alt="Order Shipping"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div
              className={`flex-1 h-1 sm:mx-2 ${
                Number(salesOrderDetails?.OrderStatus) <= 4
                  ? "border-dashed border-gray-300"
                  : "bg-blue-200"
                }`}
            ></div>
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg p-2 ${
                  Number(salesOrderDetails?.OrderStatus) == 5
                    ? "bg-yellow-100 border-b-4 border-blue-500"
                    : Number(salesOrderDetails?.OrderStatus) < 5
                    ? "border-gray-300"
                    : "bg-blue-100"
                }`}
              >
                <img
                  src={`${baseurl}/public/images/orderbot/order_delivered.png`}
                  alt="Order Delivered"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between text-xs sm:text-sm text-center">
            <p className="w-1/5">
              {salesOrderDetails?.OrderStatus == "1"
                ? salesOrderDetails?.OrderStatuslabel
                : "Order Received"}
            </p>
            <p className="w-1/5">
              {salesOrderDetails?.OrderStatus == "2"
                ? salesOrderDetails?.OrderStatuslabel
                : "Order Accepted"}
            </p>
            <p className="w-1/5">
              {salesOrderDetails?.OrderStatus == "3"
                ? salesOrderDetails?.OrderStatuslabel
                : "Order Assigned"}
            </p>
            <p className="w-1/5">
              {salesOrderDetails?.OrderStatus == "4"
                ? salesOrderDetails?.OrderStatuslabel
                : "Order Shipping"}
            </p>
            <p className="w-1/5">
              {salesOrderDetails?.OrderStatus == "5"
                ? salesOrderDetails?.OrderStatuslabel
                : "Order Delivered"}
            </p>
          </div>

          {/* Billing Information */}
          <div className="bg-[#287F71] text-white p-4 rounded-lg flex flex-col justify-around gap-4 sm:flex-row sm:gap-8">
            {salesOrderDetails?.grand_total && (
              <div className="text-center">
                <p className="text-xs sm:text-sm font-semibold">BILLING AMOUNT</p>
                <p className="text-sm sm:text-base font-bold">₹ {salesOrderDetails?.grand_total}</p>
              </div>
            )}
            {salesOrderDetails?.payment_status && (
              <div className="text-center">
                <p className="text-xs sm:text-sm font-semibold">PAYMENT STATUS</p>
                <p className="text-sm sm:text-base font-bold">{salesOrderDetails?.payment_status}</p>
              </div>
            )}
            {salesOrderDetails?.delivery_status && (
              <div className="text-center">
                <p className="text-xs sm:text-sm font-semibold">DELIVERY STATUS</p>
                <p className="text-sm sm:text-base font-bold">{salesOrderDetails?.delivery_status}</p>
              </div>
            )}
          </div>

          {/* Product Details */}
          {products.length > 0 && (
            <div>
              <div className="flex items-center justify-center mb-3 sm:mb-4">
                <File className="h-5 w-5 sm:h-6 sm:w-6 text-[#287F71] mr-2" />
                <h3 className="text-base sm:text-lg font-semibold">Product Details</h3>
              </div>
              <div className="overflow-x-auto">
                <Table className="min-w-[300px] sm:min-w-[600px]">
                  <TableHeader>
                    <TableRow className="bg-[#4a5a6b] hover:bg-[#4a5a6b] text-white">
                      <TableHead className="text-white text-xs sm:text-sm px-2 sm:px-4 py-2 text-center">
                        Image
                      </TableHead>
                      <TableHead className="text-white text-xs sm:text-sm px-2 sm:px-4 py-2 text-center">
                        Product Name
                      </TableHead>
                      <TableHead className="text-white text-xs sm:text-sm px-2 sm:px-4 py-2 text-center">
                        {products.some((product) => product?.conversion_flg != "")
                          ? "Primary Qty"
                          : "Qty"}
                      </TableHead>
                      {products.some((product) => product?.conversion_flg != "") && (
                        <>
                          <TableHead className="text-white text-xs sm:text-sm px-2 sm:px-4 py-2 text-center">
                            Conversion Factor
                          </TableHead>
                          <TableHead className="text-white text-xs sm:text-sm px-2 sm:px-4 py-2 text-center">
                            Total Secondary Qty
                          </TableHead>
                        </>
                      )}
                      <TableHead className="text-white text-xs sm:text-sm px-2 sm:px-4 py-2 text-center">
                        Rate
                      </TableHead>
                      <TableHead className="text-white text-xs sm:text-sm px-2 sm:px-4 py-2 text-center">
                        Disc (%)
                      </TableHead>
                      <TableHead className="text-white text-xs sm:text-sm px-2 sm:px-4 py-2 text-center">
                        Disc
                      </TableHead>
                      <TableHead className="text-white text-xs sm:text-sm px-2 sm:px-4 py-2 text-center">
                        Amount
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((element, index) => {
                      const discountAmount = calculateSalesOrderDiscountAmount(element);
                      return (
                        <TableRow key={index} className="border-b">
                          <TableCell className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-center">
                            <img
                              src={`${baseurl}/viewimage/getproduct/${element.product_image}/normal`}
                              alt="Product Image"
                              width={40}
                              height={40}
                              className="border-2 border-gray-400 shadow-md mx-auto"
                            />
                          </TableCell>
                          <TableCell className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-center">
                            {element?.productname || "-"} ({element?.productcode || "-"})
                          </TableCell>
                          <TableCell className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-center">
                            {element?.productqty || "-"}
                            {element?.conversion_flg == "" && element?.unit
                              ? ` (${element.unit})`
                              : ""}
                            {element?.conversion_flg != "" && element?.primary_unit_name
                              ? ` (${element.primary_unit_name})`
                              : ""}
                          </TableCell>
                          {element?.conversion_flg != "" && (
                            <>
                              <TableCell className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-center">
                                {element?.secondary_base_qty || "-"}
                              </TableCell>
                              <TableCell className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-center">
                                {element?.SecQtyTotal || "-"}
                                {element?.secondary_unit_name ? ` (${element.secondary_unit_name})` : ""}
                              </TableCell>
                            </>
                          )}
                          <TableCell className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-center">
                            {element?.conversion_flg != "" &&
                            element.unit_con_mode == "3" &&
                            element.conversion_flg == "2"
                              ? element?.sec_unit_rate || "-"
                              : element?.rate || "-"}
                          </TableCell>
                          <TableCell className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-center">
                            {element?.total_discount || "0"}
                          </TableCell>
                          <TableCell className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-center">
                            {discountAmount.toFixed(2)}
                          </TableCell>
                          <TableCell className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-center">
                            {parseFloat(element?.totalrate || "0").toFixed(2)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="border-t font-bold">
                      <TableCell
                        colSpan={products.some((product) => product?.conversion_flg) ? 8 : 6}
                        className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-right"
                      >
                        Subtotal
                      </TableCell>
                      <TableCell className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-right">
                        {subtotal.toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-t font-bold">
                      <TableCell
                        colSpan={products.some((product) => product?.conversion_flg) ? 8 : 6}
                        className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-right"
                      >
                        Discount Total
                      </TableCell>
                      <TableCell className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-right">
                        {totalDiscount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                    {saleProductCharges.map((charge, index) => (
                      <TableRow key={`charge-${index}`} className="border-t font-bold">
                        <TableCell
                          colSpan={products.some((product) => product?.conversion_flg) ? 8 : 6}
                          className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-right"
                        >
                          {charge.so_chrg_tax_name}
                        </TableCell>
                        <TableCell className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-right">
                          {parseFloat(charge.so_chrg_tax_amount || "0").toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t font-bold">
                      <TableCell
                        colSpan={products.some((product) => product?.conversion_flg) ? 8 : 6}
                        className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-right"
                      >
                        Gross Total
                      </TableCell>
                      <TableCell className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-right">
                        {grossTotal}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Remarks */}
          {salesOrderDetails?.remarks && (
            <div>
              <div className="flex items-center mb-2">
                <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-[#287F71] mr-2" />
                <h3 className="text-base sm:text-lg font-semibold">Remarks</h3>
              </div>
              <div className="bg-gray-100 p-3 sm:p-4 rounded-lg">
                <p className="text-sm sm:text-base">{salesOrderDetails?.remarks}</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsDialog;