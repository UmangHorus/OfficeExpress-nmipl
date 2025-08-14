"use client";

import React, { useEffect, useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, List, Plus, Tag, Trash2 } from "lucide-react";
import { ProductSearch } from "@/components/inputs/search";
import { toast } from "sonner";
import { leadService } from "@/lib/leadService";
import { useLoginStore } from "@/stores/auth.store";
import { useSharedDataStore } from "@/stores/sharedData.store";
import { format, parse } from "date-fns";
import { StockDialog } from "../shared/StockDialog";
import useBasicSettingsStore from "@/stores/basicSettings.store";
import useDateFormatter from "@/hooks/useDateFormatter";
import ProdAttrDialog from "../shared/ProdAttrDialog";
import { PriceListDialog } from "../shared/PriceListDialog";

const ProductSelectionTable = ({
  formValues,
  setFormValues,
  productList,
  selectedtypeOption,
  selectedCompany,
  selectedContact,
  orderIdParam,
  salesOrderDetails,
}) => {
  const baseurl = process.env.NEXT_PUBLIC_API_BASE_URL_FALLBACK;
  const { companyDetails } = useSharedDataStore();
  const { user = {}, appConfig = {}, token } = useLoginStore();
  const { maincompany_id, mainbranch_id } = useBasicSettingsStore();
  const { formatDateForInput } = useDateFormatter();

  const secUnitConfig = companyDetails?.sec_unit_config || "0";
  const enablepacking = companyDetails?.enable_packing;
  const enablestock = companyDetails?.enable_stock;
  const unitMaster = companyDetails?.unit_master;
  const productLabel = companyDetails?.product_label;

  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [isAttrModalOpen, setIsAttrModalOpen] = useState(false);
  const [isPriceListModalOpen, setIsPriceListModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Function to generate a unique ID
  const generateUniqueId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  const handleShowStock = (product) => {
    setSelectedProduct(product);
    setIsStockDialogOpen(true);
  };

  const handleShowAttributes = (product) => {
    setSelectedProduct(product);
    setIsAttrModalOpen(true);
  };

  const handleShowPriceList = (product) => {
    setSelectedProduct(product);
    setIsPriceListModalOpen(true);
  };

  const handlePriceListSave = (priceList) => {
    const updatedFormValues = formValues.map((item) => {
      if (item.unique_id == selectedProduct.unique_id) {
        return {
          ...item,
          rate: priceList?.priceINR || item.rate,
        };
      }
      return item;
    });
    setFormValues(updatedFormValues);
    toast.success(`${priceList?.name || "Price list"} applied`, {
      duration: 2000,
    });
  };

  const getInitialFormValues = (
    selectedtypeOption,
    secUnitConfig,
    product = null
  ) => {
    let discount = product?.total_discount || "";
    let discount_amount = "";
    if (product?.total_discount && parseFloat(product.total_discount) > 0) {
      let baseAmount = 0;
      if (product?.conversion_flg != "") {
        if (product.unit_con_mode == "1" && product.conversion_flg == "1") {
          baseAmount =
            parseFloat(product.productqty || "0") *
            parseFloat(product.rate || "0");
        } else if (
          product.unit_con_mode == "1" &&
          product.conversion_flg == "2"
        ) {
          baseAmount =
            (parseFloat(product.SecQtyTotal || "0") *
              parseFloat(product.rate || "0")) /
            parseFloat(product.secondary_base_qty || "1");
        } else if (
          product.unit_con_mode == "3" &&
          product.conversion_flg == "2"
        ) {
          baseAmount =
            parseFloat(product.SecQtyTotal || "0") *
            parseFloat(product.sec_unit_rate || "0");
        } else {
          baseAmount =
            parseFloat(product.productqty || "0") *
            parseFloat(product.rate || "0");
        }
      } else {
        baseAmount =
          parseFloat(product.productqty || "0") *
          parseFloat(product.rate || "0");
      }
      discount_amount = (
        baseAmount *
        (parseFloat(product.total_discount || "0") / 100)
      ).toFixed(2);
    }

    const baseFormValues = {
      unique_id: product?.unique_id || generateUniqueId(), // Ensure unique_id is always set
      productid: product?.productid || "",
      productname: product?.productname || "",
      sop_id: product?.sop_id || "",
      stock: product?.current_stock || "",
      rate: product?.rate || "",
      mrp_price: product?.mrp_price || "",
      product_image: product?.product_image || "",
      secondary_base_qty: product?.secondary_base_qty || "0",
      productcode: product?.productcode || "",
      SecQtyReverseCalculate: product?.SecQtyReverseCalculate || "0",
      stock_data: product?.stock_data || [],
      pricelist_data: product?.pricelist_data || {},
      Attribute_data: product?.Attribute_data || {},
      attribute: {},
      proddivision: product?.proddivision || "",
      unit_con_mode: product?.unit_con_mode || null,
      sec_unit_rate: product?.sec_unit_rate || "0",
      discount: discount,
      discount_amount: discount_amount,
      totalrate: product?.totalrate
        ? (
            parseFloat(product.totalrate) - parseFloat(discount_amount)
          ).toString()
        : "0.00",
      scheduleDate: product?.scheduleDate
        ? formatDateForInput(product.scheduleDate)
        : format(new Date(), "yyyy-MM-dd"),
      ...(selectedtypeOption == "lead-option" ||
      (selectedtypeOption == "salesorder-option" && secUnitConfig == "0")
        ? {
            unit: product?.unit || "",
            sec_unit: product?.sec_unit || "",
            unitvalue: product?.unitvalue || "0",
            productqty: product?.productqty || "",
          }
        : {}),
      ...(selectedtypeOption == "salesorder-option" && secUnitConfig == "1"
        ? {
            primary_unit_id: product?.primary_unit_id || "",
            secondary_unit_id: product?.secondary_unit_id || "",
            conversion_flg: product?.conversion_flg || "1",
            SecQtyTotal: product?.SecQtyTotal || "",
            productqty: product?.productqty || "",
          }
        : {}),
    };

    return product
      ? baseFormValues
      : [{ ...baseFormValues, unique_id: generateUniqueId() }];
  };

  useEffect(() => {
    if (orderIdParam && salesOrderDetails?.Products?.length > 0) {
      const initialFormValues = salesOrderDetails.Products.map(
        (product, idx) => {
          let base = getInitialFormValues(selectedtypeOption, secUnitConfig, {
            ...product,
            unique_id: product.unique_id || generateUniqueId(),
          });

          // Compute initialAttributes using Attribute_data and prefer values from Attribute_data_1 if available
          const productAttrKey = `${product.productid}_${idx}`;
          const initialAttributes = {};

          if (product.Attribute_data) {
            Object.entries(product.Attribute_data).forEach(
              ([attrId, attrData]) => {
                let valueID = attrData.ValueID;

                // Find matching entry in Attribute_data_1 by id
                const attr1 = product.Attribute_data_1?.find(
                  (a) => a.id == attrId || a.id == attrId.toString()
                );

                // Use value from Attribute_data_1 if available and valid
                if (
                  attr1 &&
                  typeof attr1.value === "string" &&
                  attr1.value.trim() !== "" &&
                  attr1.value !== "undefined" &&
                  attr1.value !== null
                ) {
                  valueID = attr1.value;
                }

                if (
                  (attrData.Type == "3" || attrData.Type == "2") &&
                  attrData.Masters
                ) {
                  // For select type attributes with Masters
                  const masters = Array.isArray(attrData.Masters)
                    ? attrData.Masters
                    : Object.values(attrData.Masters);

                  if (valueID) {
                    // Find matching master by N (name)
                    const matchedMaster = masters.find(
                      (master) => master.N == valueID
                    );

                    if (matchedMaster) {
                      initialAttributes[attrId] = matchedMaster.ID;
                    }
                  }
                } else if (valueID) {
                  // For other types, use valueID if available
                  let value = valueID;
                  if (attrData.Type == "6") {
                    // Strip time component from date if present (e.g., "19/03/2025 02:20" -> "19/03/2025")
                    value = value?.split(" ")[0] ?? "";
                  }
                  initialAttributes[attrId] = value;
                }
              }
            );
          }

          base.attribute = { [productAttrKey]: initialAttributes };
          return base;
        }
      );
      setFormValues(initialFormValues);
    } else if (!formValues.length) {
      setFormValues(getInitialFormValues(selectedtypeOption, secUnitConfig));
    }
  }, [
    orderIdParam,
    salesOrderDetails,
    selectedtypeOption,
    secUnitConfig,
    setFormValues,
  ]);

  useEffect(() => {
    if (user?.isEmployee && !selectedContact) {
      const hasProducts = formValues.some((item) => item.productid);
      if (hasProducts) {
        setFormValues(getInitialFormValues(selectedtypeOption, secUnitConfig));
        toast.error("Please select a contact to add products");
      }
    }
  }, [
    selectedContact,
    user?.isEmployee,
    selectedtypeOption,
    secUnitConfig,
    setFormValues,
  ]);

  const resetProductFields = (index) => {
    let newFormValues = [...formValues];
    newFormValues[index] = {
      ...newFormValues[index],
      unique_id: newFormValues[index].unique_id || generateUniqueId(), // Preserve or set unique_id
      productid: "",
      productname: "",
      stock: "",
      rate: "",
      mrp_price: "",
      product_image: "",
      secondary_base_qty: "0",
      productcode: "",
      SecQtyReverseCalculate: "0",
      stock_data: [],
      pricelist_data: {},
      Attribute_data: {},
      attribute: {},
      proddivision: "",
      unit_con_mode: null,
      sec_unit_rate: "0",
      discount: "",
      discount_amount: "",
      totalrate: "0.00",
      ...(selectedtypeOption == "lead-option" ||
      (selectedtypeOption == "salesorder-option" && secUnitConfig == "0")
        ? {
            unit: "",
            sec_unit: "",
            unitvalue: "0",
            productqty: "",
          }
        : {}),
      ...(selectedtypeOption == "salesorder-option" && secUnitConfig == "1"
        ? {
            primary_unit_id: "",
            secondary_unit_id: "",
            conversion_flg: "1",
            SecQtyTotal: "",
            productqty: "",
          }
        : {}),
    };
    return newFormValues;
  };

  const getProductUnit = async (product, index) => {
    try {
      if (!token || !product?.product_id) {
        throw new Error("Invalid parameters: Missing required fields");
      }

      const contactId = user?.isEmployee ? selectedContact?.id : user?.id;
      const contactType = user?.isEmployee ? selectedContact?.type : user?.type;
      const companyId = user?.isEmployee ? selectedCompany : maincompany_id;
      const branchId = user?.isEmployee ? appConfig?.branch_id : mainbranch_id;

      if (!contactId || !contactType || !companyId || !branchId) {
        throw new Error("Missing required parameters for API call");
      }

      const response = await leadService.getProductUnit(
        token,
        product?.product_id,
        contactId,
        contactType,
        companyId,
        branchId
      );
      const data = Array.isArray(response) ? response[0] : response;
      const productData = data?.DATA;

      if (data?.STATUS == "SUCCESS") {
        let newFormValues = [...formValues];
        newFormValues[index]["unique_id"] =
          newFormValues[index].unique_id || generateUniqueId();
        newFormValues[index]["productid"] = product?.product_id ?? "";
        newFormValues[index]["productname"] = product?.name ?? "";
        newFormValues[index]["stock"] = productData?.current_stock ?? "";
        newFormValues[index]["rate"] = productData?.productrate ?? "";
        newFormValues[index]["mrp_price"] = productData?.mrp_price ?? "";
        newFormValues[index]["product_image"] =
          productData?.product_image ?? "";
        newFormValues[index]["secondary_base_qty"] =
          productData?.prod_conversion ?? "0";
        newFormValues[index]["productcode"] = productData?.productcode ?? "";
        newFormValues[index]["SecQtyReverseCalculate"] =
          productData?.SecQtyReverseCalculate ?? "0";
        newFormValues[index]["stock_data"] = Array.isArray(
          productData?.stock_data
        )
          ? productData?.stock_data
          : [];
        newFormValues[index]["pricelist_data"] =
          productData?.pricelist_data || {};
        newFormValues[index]["Attribute_data"] =
          productData?.Attribute_data || {};
        newFormValues[index]["attribute"] = {};

        // Initialize attribute values
        if (productData?.Attribute_data) {
          const productAttrKey = `${product?.product_id}_${index}`;
          const initialAttributes = {};

          Object.entries(productData.Attribute_data).forEach(
            ([attrId, attrData]) => {
              if (
                (attrData.Type == "3" || attrData.Type == "2") &&
                attrData.Masters
              ) {
                // For select type attributes with Masters
                const masters = Array.isArray(attrData.Masters)
                  ? attrData.Masters
                  : Object.values(attrData.Masters);

                if (attrData.ValueID) {
                  // Find matching master by N (name)
                  const matchedMaster = masters.find(
                    (master) => master.N == attrData.ValueID
                  );

                  if (matchedMaster) {
                    initialAttributes[attrId] = matchedMaster.ID;
                  }
                }
              } else if (attrData.ValueID) {
                // For other types, use ValueID if available
                let value = attrData.ValueID;
                if (attrData.Type == "6") {
                  // Strip time component from date if present (e.g., "19/03/2025 02:20" -> "19/03/2025")
                  value = value?.split(" ")[0] ?? "";
                }
                initialAttributes[attrId] = value;
              }
            }
          );

          newFormValues[index]["attribute"] = {
            [productAttrKey]: initialAttributes,
          };
        }

        newFormValues[index]["proddivision"] = productData?.proddivision ?? "";
        newFormValues[index]["unit_con_mode"] =
          productData?.unit_con_mode ?? null;
        newFormValues[index]["sec_unit_rate"] =
          productData?.sec_unit_rate ?? "0";

        const contactDefaultDiscount = parseFloat(
          productData?.contact_default_discount
        );
        if (!isNaN(contactDefaultDiscount)) {
          newFormValues[index]["discount"] = contactDefaultDiscount.toString();
        } else {
          newFormValues[index]["discount"] = "";
        }

        if (
          selectedtypeOption == "lead-option" ||
          (selectedtypeOption == "salesorder-option" && secUnitConfig == "0")
        ) {
          newFormValues[index]["unit"] = productData?.unit_name ?? "";
          newFormValues[index]["sec_unit"] = productData?.second_unit ?? "";
        }

        if (selectedtypeOption == "salesorder-option" && secUnitConfig == "1") {
          newFormValues[index]["primary_unit_id"] =
            productData?.primary_unit_id ?? "";
          newFormValues[index]["secondary_unit_id"] =
            productData?.secondary_unit_id ?? "";
        }

        setFormValues(newFormValues);
      } else {
        const newFormValues = resetProductFields(index);
        setFormValues(newFormValues);
        toast.error(data?.MSG || "Failed to fetch product details");
      }
    } catch (error) {
      console.error("Error fetching product unit:", error);
      const newFormValues = resetProductFields(index);
      setFormValues(newFormValues);
      toast.error("Error fetching product details");
    }
  };

  const productSelect = (product, index) => {
    if (!product?.product_id) return;
    getProductUnit(product, index);
  };

  const handleChange = (index, e) => {
    const { name, value } = e.target;

    const regex = /^(\d*\.?\d*)?$/;
    if (
      [
        "productqty",
        "SecQtyTotal",
        "rate",
        "discount",
        "discount_amount",
        "secondary_base_qty",
        "sec_unit_rate",
      ].includes(name) &&
      value !== "" &&
      !regex.test(value)
    ) {
      return;
    }

    if (name === "scheduleDate") {
      try {
        if (value) {
          const parsedDate = parse(value, "yyyy-MM-dd", new Date());
          setFormValues((prev) => {
            const newFormValues = [...prev];
            newFormValues[index] = {
              ...newFormValues[index],
              [name]: format(parsedDate, "yyyy-MM-dd"),
            };
            return newFormValues;
          });
        } else {
          setFormValues((prev) => {
            const newFormValues = [...prev];
            newFormValues[index] = {
              ...newFormValues[index],
              [name]: "",
            };
            return newFormValues;
          });
        }
      } catch (error) {
        console.error("Invalid date format", error);
      }
      return;
    }

    let newFormValues = [...formValues];
    newFormValues[index][name] = value;

    let primaryQty = parseFloat(newFormValues[index]["productqty"]) || 0;
    let rate = parseFloat(newFormValues[index]["rate"]) || 0;
    let secUnitRate = parseFloat(newFormValues[index]["sec_unit_rate"]) || 0;
    let discount =
      newFormValues[index]["discount"] === ""
        ? ""
        : parseFloat(newFormValues[index]["discount"]) || 0;
    let discountAmount =
      newFormValues[index]["discount_amount"] === ""
        ? ""
        : parseFloat(newFormValues[index]["discount_amount"]) || 0;
    let subtotal = primaryQty * rate;

    if (
      selectedtypeOption == "lead-option" ||
      (selectedtypeOption == "salesorder-option" && secUnitConfig == "0")
    ) {
      if (
        name === "unitvalue" ||
        name === "productqty" ||
        name === "rate" ||
        name === "discount" ||
        name === "discount_amount"
      ) {
        if (newFormValues[index]["unitvalue"] == "0") {
          if (name === "productqty" || name === "rate") {
            if (discount !== "" && discount > 0) {
              discountAmount = ((subtotal * discount) / 100).toFixed(2);
              newFormValues[index]["discount_amount"] = discountAmount;
            } else if (discountAmount !== "" && discountAmount > 0) {
              discount =
                subtotal > 0
                  ? ((discountAmount / subtotal) * 100).toFixed(2)
                  : "";
              newFormValues[index]["discount"] = discount;
            }
          }
          if (name === "discount") {
            if (value === "") {
              newFormValues[index]["discount_amount"] = "";
            } else if (discount > 0) {
              discountAmount = ((subtotal * discount) / 100).toFixed(2);
              newFormValues[index]["discount_amount"] = discountAmount;
            }
          } else if (name === "discount_amount") {
            if (value === "") {
              newFormValues[index]["discount"] = "";
            } else if (discountAmount > 0) {
              discount =
                subtotal > 0
                  ? ((discountAmount / subtotal) * 100).toFixed(2)
                  : "";
              newFormValues[index]["discount"] = discount;
            }
          }
          newFormValues[index]["totalrate"] = (
            subtotal -
            (parseFloat(newFormValues[index]["discount_amount"]) || 0)
          ).toFixed(2);
        } else {
          const convFact =
            parseFloat(newFormValues[index]["secondary_base_qty"]) || 0;
          let newvalue =
            convFact > 0 && primaryQty > 0 ? primaryQty / convFact : 0;
          let adjustedSubtotal = newvalue * rate;

          if (
            name === "productqty" ||
            name === "rate" ||
            name === "unitvalue"
          ) {
            if (discount !== "" && discount > 0) {
              discountAmount = ((adjustedSubtotal * discount) / 100).toFixed(2);
              newFormValues[index]["discount_amount"] = discountAmount;
            } else if (discountAmount !== "" && discountAmount > 0) {
              discount =
                adjustedSubtotal > 0
                  ? ((discountAmount / adjustedSubtotal) * 100).toFixed(2)
                  : "";
              newFormValues[index]["discount"] = discount;
            }
          }
          if (name === "discount") {
            if (value === "") {
              newFormValues[index]["discount_amount"] = "";
            } else if (discount > 0) {
              discountAmount = ((adjustedSubtotal * discount) / 100).toFixed(2);
              newFormValues[index]["discount_amount"] = discountAmount;
            }
          } else if (name === "discount_amount") {
            if (value === "") {
              newFormValues[index]["discount"] = "";
            } else if (discountAmount > 0) {
              discount =
                adjustedSubtotal > 0
                  ? ((discountAmount / adjustedSubtotal) * 100).toFixed(2)
                  : "";
              newFormValues[index]["discount"] = discount;
            }
          }
          newFormValues[index]["totalrate"] = (
            adjustedSubtotal -
            (parseFloat(newFormValues[index]["discount_amount"]) || 0)
          ).toFixed(2);
        }
      }
    } else if (
      selectedtypeOption == "salesorder-option" &&
      secUnitConfig == "1"
    ) {
      const convFact =
        parseFloat(newFormValues[index]["secondary_base_qty"]) || 0;
      const conversionFlg = newFormValues[index]["conversion_flg"];
      const unitConMode = newFormValues[index]["unit_con_mode"] || "1";
      let secondaryQty = parseFloat(newFormValues[index]["SecQtyTotal"]) || 0;

      if (
        name === "productqty" ||
        name === "secondary_base_qty" ||
        name === "conversion_flg" ||
        name === "SecQtyTotal" ||
        name === "rate" ||
        name === "sec_unit_rate" ||
        name === "discount" ||
        name === "discount_amount"
      ) {
        if (conversionFlg == "1") {
          secondaryQty =
            convFact > 0 && primaryQty > 0
              ? (primaryQty * convFact).toFixed(2)
              : "0";
          newFormValues[index]["SecQtyTotal"] = secondaryQty;
        } else if (conversionFlg == "2") {
          primaryQty =
            convFact > 0 && secondaryQty > 0
              ? (secondaryQty / convFact).toFixed(2)
              : "0";
          newFormValues[index]["productqty"] = primaryQty;
        }

        let calcSubtotal;
        if (unitConMode == "3" && conversionFlg == "2") {
          calcSubtotal = secondaryQty * secUnitRate;
          if (name == "sec_unit_rate" && convFact > 0) {
            newFormValues[index]["rate"] = (secUnitRate * convFact).toFixed(2);
          } else if (name == "rate" && convFact > 0) {
            newFormValues[index]["sec_unit_rate"] = (rate / convFact).toFixed(
              2
            );
          }
        } else {
          if (
            unitConMode == "3" &&
            name == "rate" &&
            conversionFlg == "1" &&
            convFact > 0
          ) {
            newFormValues[index]["sec_unit_rate"] = (rate / convFact).toFixed(
              2
            );
          } else if (
            unitConMode == "3" &&
            name == "sec_unit_rate" &&
            conversionFlg == "1" &&
            convFact > 0
          ) {
            newFormValues[index]["rate"] = (secUnitRate * convFact).toFixed(2);
          }
          calcSubtotal =
            conversionFlg == "2" && unitConMode != "3"
              ? secondaryQty * (rate / convFact)
              : primaryQty * rate;
        }

        if (
          name == "productqty" ||
          name == "SecQtyTotal" ||
          name == "rate" ||
          name == "sec_unit_rate" ||
          name == "conversion_flg" ||
          name == "secondary_base_qty"
        ) {
          if (discount != "" && discount > 0) {
            discountAmount = ((calcSubtotal * discount) / 100).toFixed(2);
            newFormValues[index]["discount_amount"] = discountAmount;
          } else if (discountAmount != "" && discountAmount > 0) {
            discount =
              calcSubtotal > 0
                ? ((discountAmount / calcSubtotal) * 100).toFixed(2)
                : "";
            newFormValues[index]["discount"] = discount;
          }
        }
        if (name == "discount") {
          if (value == "") {
            newFormValues[index]["discount_amount"] = "";
            discountAmount = 0;
          } else if (discount > 0) {
            discountAmount = ((calcSubtotal * discount) / 100).toFixed(2);
            newFormValues[index]["discount_amount"] = discountAmount;
          }
        } else if (name == "discount_amount") {
          if (value == "") {
            newFormValues[index]["discount"] = "";
            discount = 0;
          } else if (discountAmount > 0) {
            discount =
              calcSubtotal > 0
                ? ((discountAmount / calcSubtotal) * 100).toFixed(2)
                : "";
            newFormValues[index]["discount"] = discount;
          }
        }
        newFormValues[index]["totalrate"] = (
          calcSubtotal -
          (parseFloat(newFormValues[index]["discount_amount"]) || 0)
        ).toFixed(2);
      }
    }

    if (name === "rate" || name === "productqty" || name === "SecQtyTotal") {
      if (newFormValues[index]["discount"] !== "") {
        const currentDiscount =
          parseFloat(newFormValues[index]["discount"]) || 0;
        const newSubtotal =
          parseFloat(newFormValues[index]["totalrate"]) +
          (parseFloat(newFormValues[index]["discount_amount"]) || 0);
        newFormValues[index]["discount_amount"] = (
          (newSubtotal * currentDiscount) /
          100
        ).toFixed(2);
        newFormValues[index]["totalrate"] = (
          newSubtotal -
          (newSubtotal * currentDiscount) / 100
        ).toFixed(2);
      }
    }

    setFormValues(newFormValues);
  };

  const addFormFields = () => {
    const baseFormValues = {
      unique_id: generateUniqueId(), // Always set unique_id
      productid: "",
      productname: "",
      productqty: "",
      unit: "",
      stock: "",
      rate: "",
      product_image: "",
      secondary_base_qty: "0",
      sec_unit: "",
      productcode: "",
      totalrate: "",
      unitvalue: "0",
      SecQtyReverseCalculate: "0",
      proddivision: "",
      stock_data: [],
      pricelist_data: {},
      Attribute_data: {},
      attribute: {},
      scheduleDate: format(new Date(), "yyyy-MM-dd"),
      discount: "",
      discount_amount: "",
      mrp_price: "",
      unit_con_mode: null,
      sec_unit_rate: "0",
    };

    const enhancedFormValues = {
      ...baseFormValues,
      conversion_flg: "1",
      primary_unit_id: "",
      secondary_unit_id: "",
      SecQtyTotal: "",
    };

    const newFormValues =
      selectedtypeOption == "salesorder-option" && secUnitConfig == "1"
        ? enhancedFormValues
        : baseFormValues;

    setFormValues((prev) => [...prev, newFormValues]);
  };

  const removeFormFields = (index) => {
    if (formValues.length == 1 && !formValues[0].productid) {
      return;
    }

    const newFormValues = [...formValues];
    newFormValues.splice(index, 1);

    const updatedFormValues = newFormValues.map((item, newIndex) => {
      if (item.productid && item.attribute) {
        const oldKey = Object.keys(item.attribute)[0];
        if (oldKey) {
          const [productId, oldIndex] = oldKey.split("_");
          const newKey = `${productId}_${newIndex}`;

          // Create new attribute object with updated key
          const newAttribute = {};
          newAttribute[newKey] = item.attribute[oldKey];

          return {
            ...item,
            attribute: newAttribute,
          };
        }
      }
      return item;
    });

    if (updatedFormValues.length == 0) {
      const baseDefault = {
        unique_id: generateUniqueId(),
        productid: "",
        productname: "",
        productqty: "",
        unit: "",
        stock: "",
        rate: "",
        product_image: "",
        secondary_base_qty: "0",
        sec_unit: "",
        productcode: "",
        totalrate: "",
        unitvalue: "0",
        SecQtyReverseCalculate: "0",
        stock_data: [],
        pricelist_data: {},
        Attribute_data: {},
        attribute: {},
        proddivision: "",
        scheduleDate:
          selectedtypeOption == "salesorder-option"
            ? format(new Date(), "yyyy-MM-dd")
            : undefined,
        discount: "",
        discount_amount: "",
        mrp_price: "",
        unit_con_mode: null,
        sec_unit_rate: "0",
      };

      const enhancedDefault = {
        ...baseDefault,
        conversion_flg: "1",
        primary_unit_id: "",
        secondary_unit_id: "",
        SecQtyTotal: "",
      };

      const defaultForm =
        selectedtypeOption == "salesorder-option" && secUnitConfig == "1"
          ? enhancedDefault
          : baseDefault;

      setFormValues([defaultForm]);
    } else {
      setFormValues(updatedFormValues);
    }
  };

  const handleKeyDown = (e) => {
    if (
      !/^[0-9.]$/.test(e.key) &&
      e.key !== "Backspace" &&
      e.key !== "Delete" &&
      e.key !== "ArrowLeft" &&
      e.key !== "ArrowRight" &&
      e.key !== "Tab"
    ) {
      e.preventDefault();
    }
  };

  return (
    <div className="w-full">
      {/* Desktop View */}
      <div className={`hidden md:block productsearch-table`}>
        <Table className="min-w-[1400px] table-wide z-10">
          <TableHeader>
            <TableRow className="bg-[#4a5a6b] text-white text-center hover:bg-[#4a5a6b]">
              <TableHead className="text-white text-sm sm:text-base px-2 sm:px-4 py-2">
                Action
              </TableHead>
              {companyDetails?.Attribute_Permission && (
                <TableHead className="text-white text-sm sm:text-base px-2 sm:px-4 py-2">
                  Attr
                </TableHead>
              )}
               {/* <TableHead className="text-white text-sm sm:text-base px-2 sm:px-4 py-2">
                Price List
              </TableHead> */}
              <TableHead className="text-white text-sm sm:text-base px-2 sm:px-4 py-2">
                Image
              </TableHead>
              <TableHead className="text-white text-sm sm:text-base px-2 sm:px-4 py-2">
                Product
              </TableHead>
              {selectedtypeOption == "salesorder-option" &&
                secUnitConfig == "1" && (
                  <TableHead className="text-white text-sm sm:text-base px-2 sm:px-4 py-2">
                    Conversion
                  </TableHead>
                )}
              {enablepacking == "Y" && (
                <TableHead className="text-white text-sm sm:text-base px-2 sm:px-4 py-2">
                  Packing
                </TableHead>
              )}
              {(selectedtypeOption == "lead-option" ||
                secUnitConfig == "0") && (
                <>
                  <TableHead className="text-white text-sm sm:text-base px-2 sm:px-4 py-2">
                    Unit
                  </TableHead>
                  <TableHead className="text-white text-sm sm:text-base px-2 sm:px-4 py-2">
                    Qty
                  </TableHead>
                </>
              )}
              {selectedtypeOption == "salesorder-option" &&
                secUnitConfig == "1" && (
                  <>
                    <TableHead className="text-white text-sm sm:text-base px-2 sm:px-4 py-2">
                      Primary Qty
                    </TableHead>
                    <TableHead className="text-white text-sm sm:text-base px-2 sm:px-4 py-2">
                      Primary Unit
                    </TableHead>
                    <TableHead className="text-white text-sm sm:text-base px-2 sm:px-4 py-2">
                      Conv. Factor
                    </TableHead>
                    <TableHead className="text-white text-sm sm:text-base px-2 sm:px-4 py-2">
                      Secondary Qty
                    </TableHead>
                    <TableHead className="text-white text-sm sm:text-base px-2 sm:px-4 py-2">
                      Secondary Unit
                    </TableHead>
                  </>
                )}
              {enablestock == "Y" && (
                <TableHead className="text-white text-sm sm:text-base px-2 sm:px-4 py-2">
                  Stock
                </TableHead>
              )}
              <TableHead className="text-white text-sm sm:text-base px-2 sm:px-4 py-2">
                MRP
              </TableHead>
              <TableHead className="text-white text-sm sm:text-base px-2 sm:px-4 py-2">
                Rate
              </TableHead>
              <TableHead className="text-white text-sm sm:text-base px-2 sm:px-4 py-2">
                Disc (%)
              </TableHead>
              <TableHead className="text-white text-sm sm:text-base px-2 sm:px-4 py-2">
                Disc
              </TableHead>
              <TableHead className="text-white text-sm sm:text-base px-2 sm:px-4 py-2">
                Total
              </TableHead>
              {selectedtypeOption == "salesorder-option" && (
                <TableHead className="text-white text-sm sm:text-base px-2 sm:px-4 py-2">
                  Schedule Date
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {formValues.map((element, index) => (
              <TableRow key={element.unique_id} className="text-center">
                <TableCell className="text-left">
                  <div className="">
                    <Trash2
                      className={`h-8 w-8 sm:h-9 sm:w-9 p-2 rounded-full ${
                        formValues.length === 1 && !element.productid
                          ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                          : "text-red-500 hover:bg-red-100 cursor-pointer"
                      }`}
                      onClick={() => {
                        if (formValues.length > 1 || element.productid) {
                          removeFormFields(index);
                        }
                      }}
                    />
                  </div>
                </TableCell>
                {companyDetails?.Attribute_Permission && (
                  <TableCell className="text-left">
                    <div className="flex justify-center items-center">
                      <Tag
                        className={`${
                          element.productid &&
                          Object.keys(element.Attribute_data || {}).length > 0
                            ? "text-[#26994e] cursor-pointer rotate-90"
                            : "text-gray-400 cursor-not-allowed opacity-50 rotate-90"
                        }`}
                        size={22}
                        onClick={() => {
                          if (
                            element.productid &&
                            Object.keys(element.Attribute_data || {}).length > 0
                          ) {
                            handleShowAttributes(element);
                          }
                        }}
                        disabled={
                          !element.productid ||
                          Object.keys(element.Attribute_data || {}).length === 0
                        }
                      />
                    </div>
                  </TableCell>
                )}
                {/* <TableCell className="text-left">
                  <div className="flex justify-center items-center">
                    <List
                      className={`${
                        element.productid &&
                        element.pricelist_data &&
                        Object.keys(element.pricelist_data || {}).length > 0
                          ? "text-[#26994e] cursor-pointer"
                          : "text-gray-400 cursor-not-allowed opacity-50"
                      }`}
                      size={22}
                      onClick={() => {
                        if (
                          element.productid &&
                          element.pricelist_data &&
                          Object.keys(element.pricelist_data || {}).length > 0
                        ) {
                          handleShowPriceList(element);
                        }
                      }}
                      disabled={
                        !element.productid ||
                        !element.pricelist_data ||
                        Object.keys(element.pricelist_data || {}).length === 0
                      }
                    />
                  </div>
                </TableCell> */}
                <TableCell className="text-left">
                  <img
                    alt="product-image"
                    src={
                      element.product_image
                        ? `${baseurl}/viewimage/getproduct/${element.product_image}/normal`
                        : `${baseurl}/viewimage/getproduct/normal`
                    }
                    className="w-12 h-12"
                  />
                </TableCell>
                <TableCell
                  className={`text-left ${
                    user?.isEmployee && !selectedContact
                      ? "opacity-50 pointer-events-none"
                      : ""
                  }`}
                >
                  {element.productid ? (
                    <div className="w-[250px]">
                      {element.productname || ""} ({element.productcode || ""})
                    </div>
                  ) : (
                    <div className="w-[250px]">
                      <ProductSearch
                        products={productList}
                        onSelect={(product) => productSelect(product, index)}
                      />
                    </div>
                  )}
                </TableCell>
                {selectedtypeOption == "salesorder-option" &&
                  secUnitConfig == "1" && (
                    <TableCell className="text-left">
                      <Select
                        value={element.conversion_flg || "1"}
                        onValueChange={(value) =>
                          handleChange(index, {
                            target: { name: "conversion_flg", value },
                          })
                        }
                        disabled={!element.productid}
                      >
                        <SelectTrigger
                          className={`input-focus-style w-[100px] ${
                            !element.productid ? "bg-gray-300" : "bg-white"
                          }`}
                        >
                          <SelectValue placeholder="Select Conversion" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">
                            {element.primary_unit_id &&
                            unitMaster.find(
                              (unit) => unit.unit_id == element.primary_unit_id
                            ) ? (
                              <>
                                {
                                  unitMaster.find(
                                    (unit) =>
                                      unit.unit_id == element.primary_unit_id
                                  ).unit_name
                                }
                                {unitMaster.find(
                                  (unit) =>
                                    unit.unit_id == element.primary_unit_id
                                ).unit_symbol &&
                                  ` (${
                                    unitMaster.find(
                                      (unit) =>
                                        unit.unit_id == element.primary_unit_id
                                    ).unit_symbol
                                  })`}
                              </>
                            ) : element.unit &&
                              unitMaster.find(
                                (unit) =>
                                  unit.unit_name.toLowerCase() ==
                                  element.unit.toLowerCase()
                              ) ? (
                              <>
                                {
                                  unitMaster.find(
                                    (unit) =>
                                      unit.unit_name.toLowerCase() ==
                                      element.unit.toLowerCase()
                                  ).unit_name
                                }
                                {unitMaster.find(
                                  (unit) =>
                                    unit.unit_name.toLowerCase() ==
                                    element.unit.toLowerCase()
                                ).unit_symbol &&
                                  ` (${
                                    unitMaster.find(
                                      (unit) =>
                                        unit.unit_name.toLowerCase() ==
                                        element.unit.toLowerCase()
                                    ).unit_symbol
                                  })`}
                              </>
                            ) : (
                              ""
                            )}
                          </SelectItem>
                          <SelectItem value="2">
                            {element.secondary_unit_id &&
                            unitMaster.find(
                              (unit) =>
                                unit.unit_id == element.secondary_unit_id
                            ) ? (
                              <>
                                {
                                  unitMaster.find(
                                    (unit) =>
                                      unit.unit_id == element.secondary_unit_id
                                  ).unit_name
                                }
                                {unitMaster.find(
                                  (unit) =>
                                    unit.unit_id == element.secondary_unit_id
                                ).unit_symbol &&
                                  ` (${
                                    unitMaster.find(
                                      (unit) =>
                                        unit.unit_id ==
                                        element.secondary_unit_id
                                    ).unit_symbol
                                  })`}
                              </>
                            ) : element.sec_unit &&
                              unitMaster.find(
                                (unit) =>
                                  unit.unit_name.toLowerCase() ==
                                  element.sec_unit.toLowerCase()
                              ) ? (
                              <>
                                {
                                  unitMaster.find(
                                    (unit) =>
                                      unit.unit_name.toLowerCase() ==
                                      element.sec_unit.toLowerCase()
                                  ).unit_name
                                }
                                {unitMaster.find(
                                  (unit) =>
                                    unit.unit_name.toLowerCase() ==
                                    element.sec_unit.toLowerCase()
                                ).unit_symbol &&
                                  ` (${
                                    unitMaster.find(
                                      (unit) =>
                                        unit.unit_name.toLowerCase() ==
                                        element.sec_unit.toLowerCase()
                                    ).unit_symbol
                                  })`}
                              </>
                            ) : (
                              ""
                            )}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  )}
                {enablepacking == "Y" && (
                  <TableCell className="text-left">
                    <span className="">{element.proddivision || "0"}</span>
                  </TableCell>
                )}
                {(selectedtypeOption == "lead-option" ||
                  secUnitConfig == "0") && (
                  <>
                    <TableCell className="text-left">
                      <Select
                        value={element.unitvalue || "0"}
                        onValueChange={(value) =>
                          handleChange(index, {
                            target: { name: "unitvalue", value },
                          })
                        }
                        disabled={!element.productid}
                      >
                        <SelectTrigger className="input-focus-style w-[100px]">
                          <SelectValue placeholder="Select Unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {element.unit && (
                            <SelectItem value="0">{element.unit}</SelectItem>
                          )}
                          {element.sec_unit && (
                            <SelectItem value="1">
                              {element.sec_unit}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-left">
                      <Input
                        type="text"
                        className="input-focus-style w-[100px]"
                        name="productqty"
                        value={element.productqty || ""}
                        onChange={(e) => handleChange(index, e)}
                        onKeyDown={handleKeyDown}
                        disabled={!element.productid}
                      />
                    </TableCell>
                  </>
                )}
                {selectedtypeOption == "salesorder-option" &&
                  secUnitConfig == "1" && (
                    <>
                      <TableCell className="text-left">
                        <Input
                          type="text"
                          className={`input-focus-style w-[80px] ${
                            !element.productid || element.conversion_flg == "2"
                              ? "bg-gray-300"
                              : "bg-white"
                          }`}
                          name="productqty"
                          value={element.productqty || ""}
                          onChange={(e) => handleChange(index, e)}
                          onKeyDown={handleKeyDown}
                          disabled={
                            !element.productid || element.conversion_flg == "2"
                          }
                        />
                      </TableCell>
                      <TableCell className="text-left">
                        {element.primary_unit_id &&
                        unitMaster.find(
                          (unit) => unit.unit_id == element.primary_unit_id
                        ) ? (
                          <span className="">
                            {(() => {
                              const selectedUnit = unitMaster.find(
                                (unit) =>
                                  unit.unit_id == element.primary_unit_id
                              );
                              return (
                                <>
                                  {selectedUnit.unit_name}
                                  {selectedUnit.unit_symbol &&
                                    ` (${selectedUnit.unit_symbol})`}
                                </>
                              );
                            })()}
                          </span>
                        ) : element.unit &&
                          unitMaster.find(
                            (unit) =>
                              unit.unit_name.toLowerCase() ==
                              element.unit.toLowerCase()
                          ) ? (
                          <span className="">
                            {(() => {
                              const selectedUnit = unitMaster.find(
                                (unit) =>
                                  unit.unit_name.toLowerCase() ==
                                  element.unit.toLowerCase()
                              );
                              return (
                                <>
                                  {selectedUnit.unit_name}
                                  {selectedUnit.unit_symbol &&
                                    ` (${selectedUnit.unit_symbol})`}
                                </>
                              );
                            })()}
                          </span>
                        ) : (
                          <Select
                            value={element.primary_unit_id || ""}
                            onValueChange={(value) =>
                              handleChange(index, {
                                target: { name: "primary_unit_id", value },
                              })
                            }
                            disabled={!element.productid}
                          >
                            <SelectTrigger
                              className={`input-focus-style w-[100px] ${
                                !element.productid ? "bg-gray-300" : "bg-white"
                              }`}
                            >
                              <SelectValue placeholder="Select Primary Unit" />
                            </SelectTrigger>
                            <SelectContent>
                              {unitMaster.map((unit) => (
                                <SelectItem
                                  key={unit.unit_id}
                                  value={unit.unit_id}
                                >
                                  {unit.unit_name}
                                  {unit.unit_symbol && ` (${unit.unit_symbol})`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell className="text-left">
                        <Input
                          type="text"
                          className="input-focus-style w-[80px] bg-gray-300"
                          name="secondary_base_qty"
                          value={element.secondary_base_qty || ""}
                          onChange={(e) => handleChange(index, e)}
                          onKeyDown={handleKeyDown}
                          disabled={true}
                        />
                      </TableCell>
                      <TableCell className="text-left">
                        <Input
                          type="text"
                          className={`input-focus-style w-[100px] ${
                            !element.productid || element.conversion_flg == "1"
                              ? "bg-gray-300"
                              : "bg-white"
                          }`}
                          name="SecQtyTotal"
                          value={element.SecQtyTotal || ""}
                          onChange={(e) => handleChange(index, e)}
                          onKeyDown={handleKeyDown}
                          disabled={
                            !element.productid || element.conversion_flg == "1"
                          }
                        />
                      </TableCell>
                      <TableCell className="text-left">
                        {element.secondary_unit_id &&
                        unitMaster.find(
                          (unit) => unit.unit_id == element.secondary_unit_id
                        ) ? (
                          <span className="">
                            {(() => {
                              const selectedUnit = unitMaster.find(
                                (unit) =>
                                  unit.unit_id == element.secondary_unit_id
                              );
                              return (
                                <>
                                  {selectedUnit.unit_name}
                                  {selectedUnit.unit_symbol &&
                                    ` (${selectedUnit.unit_symbol})`}
                                </>
                              );
                            })()}
                          </span>
                        ) : element.sec_unit &&
                          unitMaster.find(
                            (unit) =>
                              unit.unit_name.toLowerCase() ==
                              element.sec_unit.toLowerCase()
                          ) ? (
                          <span className="">
                            {(() => {
                              const selectedUnit = unitMaster.find(
                                (unit) =>
                                  unit.unit_name.toLowerCase() ==
                                  element.sec_unit.toLowerCase()
                              );
                              return (
                                <>
                                  {selectedUnit.unit_name}
                                  {selectedUnit.unit_symbol &&
                                    ` (${selectedUnit.unit_symbol})`}
                                </>
                              );
                            })()}
                          </span>
                        ) : (
                          <Select
                            value={element.secondary_unit_id || ""}
                            onValueChange={(value) =>
                              handleChange(index, {
                                target: { name: "secondary_unit_id", value },
                              })
                            }
                            disabled={!element.productid}
                          >
                            <SelectTrigger
                              className={`input-focus-style w-[100px] ${
                                !element.productid ? "bg-gray-300" : "bg-white"
                              }`}
                            >
                              <SelectValue placeholder="Select Secondary Unit" />
                            </SelectTrigger>
                            <SelectContent>
                              {unitMaster.map((unit) => (
                                <SelectItem
                                  key={unit.unit_id}
                                  value={unit.unit_id}
                                >
                                  {unit.unit_name}
                                  {unit.unit_symbol && ` (${unit.unit_symbol})`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                    </>
                  )}
                {enablestock == "Y" && (
                  <TableCell className="text-left">
                    <div className="flex justify-center items-center">
                      <Eye
                        className={`text-[#26994e] ${
                          element.productid
                            ? "cursor-pointer"
                            : "cursor-not-allowed opacity-50"
                        }`}
                        size={22}
                        onClick={() =>
                          element.productid && handleShowStock(element)
                        }
                        disabled={!element.productid}
                      />
                    </div>
                  </TableCell>
                )}
                <TableCell className="text-left">
                  <span className="">
                    {!isNaN(parseFloat(element.mrp_price))
                      ? parseFloat(element.mrp_price).toFixed(2)
                      : "0.00"}
                  </span>
                </TableCell>
                <TableCell className="text-left">
                  <Input
                    type="text"
                    className={`input-focus-style w-[100px] ${
                      !element.productid || !user?.isEmployee
                        ? "bg-gray-300"
                        : "bg-white"
                    }`}
                    name={
                      selectedtypeOption == "salesorder-option" &&
                      secUnitConfig == "1" &&
                      element.unit_con_mode == "3" &&
                      element.conversion_flg == "2"
                        ? "sec_unit_rate"
                        : "rate"
                    }
                    value={
                      selectedtypeOption == "salesorder-option" &&
                      secUnitConfig == "1" &&
                      element.unit_con_mode == "3" &&
                      element.conversion_flg == "2"
                        ? element.sec_unit_rate || ""
                        : element.rate || ""
                    }
                    onChange={(e) => handleChange(index, e)}
                    onKeyDown={handleKeyDown}
                    disabled={!element.productid || !user?.isEmployee}
                  />
                </TableCell>
                <TableCell className="text-left">
                  <Input
                    type="text"
                    className={`input-focus-style w-[80px] ${
                      !element.productid || !user?.isEmployee
                        ? "bg-gray-300"
                        : "bg-white"
                    }`}
                    name="discount"
                    value={element.discount || ""}
                    onChange={(e) => handleChange(index, e)}
                    onKeyDown={handleKeyDown}
                    disabled={!element.productid || !user?.isEmployee}
                  />
                </TableCell>
                <TableCell className="text-left">
                  <Input
                    type="text"
                    className={`input-focus-style w-[100px] ${
                      !element.productid || !user?.isEmployee
                        ? "bg-gray-300"
                        : "bg-white"
                    }`}
                    name="discount_amount"
                    value={element.discount_amount || ""}
                    onChange={(e) => handleChange(index, e)}
                    onKeyDown={handleKeyDown}
                    disabled={!element.productid || !user?.isEmployee}
                  />
                </TableCell>
                <TableCell className="text-left">
                  <span className="">
                    {element.totalrate > 0
                      ? parseFloat(element.totalrate).toFixed(2)
                      : "0.00"}
                  </span>
                </TableCell>
                {selectedtypeOption == "salesorder-option" && (
                  <TableCell className="text-left">
                    <Input
                      type="date"
                      name="scheduleDate"
                      value={element.scheduleDate || ""}
                      onChange={(e) => handleChange(index, e)}
                      className="input-focus-style"
                      disabled={selectedtypeOption == "lead-option"}
                    />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-4 mb-4">
        {formValues.map((element, index) => (
          <div
            key={element.unique_id}
            className="border rounded-lg p-4 bg-white shadow-sm"
          >
            <div className="grid grid-cols-1 gap-4 mb-3">
              <div className="flex justify-end">
                <Trash2
                  className={`h-8 w-8 sm:h-9 sm:w-9 p-2 rounded-full ${
                    formValues.length === 1 && !element.productid
                      ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                      : "text-red-500 hover:bg-red-100 cursor-pointer"
                  }`}
                  onClick={() => {
                    if (formValues.length > 1 || element.productid) {
                      removeFormFields(index);
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                {companyDetails?.Attribute_Permission && (
                  <div className="flex items-center">
                    <label className="text-sm font-medium text-gray-500 w-32">
                      Attributes:
                    </label>
                    <div className="flex items-center">
                      <Tag
                        className={`${
                          element.productid &&
                          Object.keys(element.Attribute_data || {}).length > 0
                            ? "text-[#26994e] cursor-pointer rotate-90"
                            : "text-gray-400 cursor-not-allowed opacity-50 rotate-90"
                        }`}
                        size={22}
                        onClick={() => {
                          if (
                            element.productid &&
                            Object.keys(element.Attribute_data || {}).length > 0
                          ) {
                            handleShowAttributes(element);
                          }
                        }}
                        disabled={
                          !element.productid ||
                          Object.keys(element.Attribute_data || {}).length === 0
                        }
                      />
                    </div>
                  </div>
                )}
                {/* <div className="flex items-center">
                  <label className="text-sm font-medium text-gray-500 w-32">
                    Price List:
                  </label>
                  <div className="flex items-center">
                    <List
                      className={`${
                        element.productid &&
                        element.pricelist_data &&
                        Object.keys(element.pricelist_data || {}).length > 0
                          ? "text-[#26994e] cursor-pointer"
                          : "text-gray-400 cursor-not-allowed opacity-50"
                      }`}
                      size={22}
                      onClick={() => {
                        if (
                          element.productid &&
                          element.pricelist_data &&
                          Object.keys(element.pricelist_data || {}).length > 0
                        ) {
                          handleShowPriceList(element);
                        }
                      }}
                      disabled={
                        !element.productid ||
                        !element.pricelist_data ||
                        Object.keys(element.pricelist_data || {}).length === 0
                      }
                    />
                  </div>
                </div> */}
                <div className="flex items-center">
                  <label className="text-sm font-medium text-gray-500 w-32">
                    Image:
                  </label>
                  <img
                    alt="product-image"
                    src={
                      element.product_image
                        ? `${baseurl}/viewimage/getproduct/${element.product_image}/normal`
                        : `${baseurl}/viewimage/getproduct/normal`
                    }
                    className="w-12 h-12"
                  />
                </div>
                {selectedtypeOption == "salesorder-option" &&
                  secUnitConfig == "1" && (
                    <div className="flex items-center">
                      <label className="text-sm font-medium text-gray-500 w-32">
                        Conversion:
                      </label>
                      <Select
                        value={element.conversion_flg || "1"}
                        onValueChange={(value) =>
                          handleChange(index, {
                            target: { name: "conversion_flg", value },
                          })
                        }
                        disabled={!element.productid}
                      >
                        <SelectTrigger
                          className={`input-focus-style w-full max-w-[150px] ${
                            !element.productid ? "bg-gray-300" : "bg-white"
                          }`}
                        >
                          <SelectValue placeholder="Select Conversion" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">
                            {element.primary_unit_id &&
                            unitMaster.find(
                              (unit) => unit.unit_id == element.primary_unit_id
                            ) ? (
                              <>
                                {
                                  unitMaster.find(
                                    (unit) =>
                                      unit.unit_id == element.primary_unit_id
                                  ).unit_name
                                }
                                {unitMaster.find(
                                  (unit) =>
                                    unit.unit_id == element.primary_unit_id
                                ).unit_symbol &&
                                  ` (${
                                    unitMaster.find(
                                      (unit) =>
                                        unit.unit_id == element.primary_unit_id
                                    ).unit_symbol
                                  })`}
                              </>
                            ) : element.unit &&
                              unitMaster.find(
                                (unit) =>
                                  unit.unit_name.toLowerCase() ==
                                  element.unit.toLowerCase()
                              ) ? (
                              <>
                                {
                                  unitMaster.find(
                                    (unit) =>
                                      unit.unit_name.toLowerCase() ==
                                      element.unit.toLowerCase()
                                  ).unit_name
                                }
                                {unitMaster.find(
                                  (unit) =>
                                    unit.unit_name.toLowerCase() ==
                                    element.unit.toLowerCase()
                                ).unit_symbol &&
                                  ` (${
                                    unitMaster.find(
                                      (unit) =>
                                        unit.unit_name.toLowerCase() ==
                                        element.unit.toLowerCase()
                                    ).unit_symbol
                                  })`}
                              </>
                            ) : (
                              ""
                            )}
                          </SelectItem>
                          <SelectItem value="2">
                            {element.secondary_unit_id &&
                            unitMaster.find(
                              (unit) =>
                                unit.unit_id == element.secondary_unit_id
                            ) ? (
                              <>
                                {
                                  unitMaster.find(
                                    (unit) =>
                                      unit.unit_id == element.secondary_unit_id
                                  ).unit_name
                                }
                                {unitMaster.find(
                                  (unit) =>
                                    unit.unit_id == element.secondary_unit_id
                                ).unit_symbol &&
                                  ` (${
                                    unitMaster.find(
                                      (unit) =>
                                        unit.unit_id ==
                                        element.secondary_unit_id
                                    ).unit_symbol
                                  })`}
                              </>
                            ) : element.sec_unit &&
                              unitMaster.find(
                                (unit) =>
                                  unit.unit_name.toLowerCase() ==
                                  element.sec_unit.toLowerCase()
                              ) ? (
                              <>
                                {
                                  unitMaster.find(
                                    (unit) =>
                                      unit.unit_name.toLowerCase() ==
                                      element.sec_unit.toLowerCase()
                                  ).unit_name
                                }
                                {unitMaster.find(
                                  (unit) =>
                                    unit.unit_name.toLowerCase() ==
                                    element.sec_unit.toLowerCase()
                                ).unit_symbol &&
                                  ` (${
                                    unitMaster.find(
                                      (unit) =>
                                        unit.unit_name.toLowerCase() ==
                                        element.sec_unit.toLowerCase()
                                    ).unit_symbol
                                  })`}
                              </>
                            ) : (
                              ""
                            )}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                <div
                  className={`${
                    user?.isEmployee && !selectedContact
                      ? "opacity-50 pointer-events-none"
                      : ""
                  } ${element.productid ? "flex items-center" : ""}`}
                >
                  <label className="text-sm font-medium text-gray-500 w-32">
                    Product:
                  </label>
                  {element.productid ? (
                    <div className="flex items-center">
                      <span className="text-sm flex-1">
                        {element.productname || ""} ({element.productcode || ""}
                        )
                      </span>
                    </div>
                  ) : (
                    <ProductSearch
                      products={productList}
                      onSelect={(product) => productSelect(product, index)}
                      className="mt-1"
                    />
                  )}
                </div>
                {enablepacking == "Y" && (
                  <div className="flex items-center">
                    <label className="text-sm font-medium text-gray-500 w-32">
                      Packing:
                    </label>
                    <span className="text-sm">
                      {element.proddivision || "0"}
                    </span>
                  </div>
                )}
                {(selectedtypeOption == "lead-option" ||
                  secUnitConfig == "0") && (
                  <>
                    <div className="flex items-center">
                      <label className="text-sm font-medium text-gray-500 w-32">
                        Unit:
                      </label>
                      <Select
                        value={element.unitvalue || "0"}
                        onValueChange={(value) =>
                          handleChange(index, {
                            target: { name: "unitvalue", value },
                          })
                        }
                        disabled={!element.productid}
                      >
                        <SelectTrigger className="input-focus-style w-full max-w-[150px]">
                          <SelectValue placeholder="Select Unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {element.unit && (
                            <SelectItem value="0">{element.unit}</SelectItem>
                          )}
                          {element.sec_unit && (
                            <SelectItem value="1">
                              {element.sec_unit}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center">
                      <label className="text-sm font-medium text-gray-500 w-32">
                        Qty:
                      </label>
                      <Input
                        type="text"
                        className="input-focus-style w-full max-w-[150px]"
                        name="productqty"
                        value={element.productqty || ""}
                        onChange={(e) => handleChange(index, e)}
                        onKeyDown={handleKeyDown}
                        disabled={!element.productid}
                      />
                    </div>
                  </>
                )}
                {selectedtypeOption == "salesorder-option" &&
                  secUnitConfig == "1" && (
                    <>
                      <div className="flex items-center">
                        <label className="text-sm font-medium text-gray-500 w-32">
                          Primary Qty:
                        </label>
                        <Input
                          type="text"
                          className={`input-focus-style w-full max-w-[150px] ${
                            !element.productid || element.conversion_flg == "2"
                              ? "bg-gray-300"
                              : "bg-white"
                          }`}
                          name="productqty"
                          value={element.productqty || ""}
                          onChange={(e) => handleChange(index, e)}
                          onKeyDown={handleKeyDown}
                          disabled={
                            !element.productid || element.conversion_flg == "2"
                          }
                        />
                      </div>
                      <div className="flex items-center">
                        <label className="text-sm font-medium text-gray-500 w-32">
                          Primary Unit:
                        </label>
                        {element.primary_unit_id &&
                        unitMaster.find(
                          (unit) => unit.unit_id == element.primary_unit_id
                        ) ? (
                          <span className="text-sm flex-1">
                            {(() => {
                              const selectedUnit = unitMaster.find(
                                (unit) =>
                                  unit.unit_id == element.primary_unit_id
                              );
                              return (
                                <>
                                  {selectedUnit.unit_name}
                                  {selectedUnit.unit_symbol &&
                                    ` (${selectedUnit.unit_symbol})`}
                                </>
                              );
                            })()}
                          </span>
                        ) : element.unit &&
                          unitMaster.find(
                            (unit) =>
                              unit.unit_name.toLowerCase() ==
                              element.unit.toLowerCase()
                          ) ? (
                          <span className="text-sm flex-1">
                            {(() => {
                              const selectedUnit = unitMaster.find(
                                (unit) =>
                                  unit.unit_name.toLowerCase() ==
                                  element.unit.toLowerCase()
                              );
                              return (
                                <>
                                  {selectedUnit.unit_name}
                                  {selectedUnit.unit_symbol &&
                                    ` (${selectedUnit.unit_symbol})`}
                                </>
                              );
                            })()}
                          </span>
                        ) : (
                          <Select
                            value={element.primary_unit_id || ""}
                            onValueChange={(value) =>
                              handleChange(index, {
                                target: { name: "primary_unit_id", value },
                              })
                            }
                            disabled={!element.productid}
                          >
                            <SelectTrigger
                              className={`input-focus-style w-full max-w-[150px] ${
                                !element.productid ? "bg-gray-300" : "bg-white"
                              }`}
                            >
                              <SelectValue placeholder="Select Primary Unit" />
                            </SelectTrigger>
                            <SelectContent>
                              {unitMaster.map((unit) => (
                                <SelectItem
                                  key={unit.unit_id}
                                  value={unit.unit_id}
                                >
                                  {unit.unit_name}
                                  {unit.unit_symbol && ` (${unit.unit_symbol})`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      <div className="flex items-center">
                        <label className="text-sm font-medium text-gray-500 w-32">
                          Conv. Factor:
                        </label>
                        <Input
                          type="text"
                          className="input-focus-style w-full max-w-[150px] bg-gray-300"
                          name="secondary_base_qty"
                          value={element.secondary_base_qty || ""}
                          onChange={(e) => handleChange(index, e)}
                          onKeyDown={handleKeyDown}
                          disabled={true}
                        />
                      </div>
                      <div className="flex items-center">
                        <label className="text-sm font-medium text-gray-500 w-32">
                          Secondary Qty:
                        </label>
                        <Input
                          type="text"
                          className={`input-focus-style w-full max-w-[150px] ${
                            !element.productid || element.conversion_flg == "1"
                              ? "bg-gray-300"
                              : "bg-white"
                          }`}
                          name="SecQtyTotal"
                          value={element.SecQtyTotal || ""}
                          onChange={(e) => handleChange(index, e)}
                          onKeyDown={handleKeyDown}
                          disabled={
                            !element.productid || element.conversion_flg == "1"
                          }
                        />
                      </div>
                      <div className="flex items-center">
                        <label className="text-sm font-medium text-gray-500 w-32">
                          Secondary Unit:
                        </label>
                        {element.secondary_unit_id &&
                        unitMaster.find(
                          (unit) => unit.unit_id == element.secondary_unit_id
                        ) ? (
                          <span className="text-sm flex-1">
                            {(() => {
                              const selectedUnit = unitMaster.find(
                                (unit) =>
                                  unit.unit_id == element.secondary_unit_id
                              );
                              return (
                                <>
                                  {selectedUnit.unit_name}
                                  {selectedUnit.unit_symbol &&
                                    ` (${selectedUnit.unit_symbol})`}
                                </>
                              );
                            })()}
                          </span>
                        ) : element.sec_unit &&
                          unitMaster.find(
                            (unit) =>
                              unit.unit_name.toLowerCase() ==
                              element.sec_unit.toLowerCase()
                          ) ? (
                          <span className="text-sm flex-1">
                            {(() => {
                              const selectedUnit = unitMaster.find(
                                (unit) =>
                                  unit.unit_name.toLowerCase() ==
                                  element.sec_unit.toLowerCase()
                              );
                              return (
                                <>
                                  {selectedUnit.unit_name}
                                  {selectedUnit.unit_symbol &&
                                    ` (${selectedUnit.unit_symbol})`}
                                </>
                              );
                            })()}
                          </span>
                        ) : (
                          <Select
                            value={element.secondary_unit_id || ""}
                            onValueChange={(value) =>
                              handleChange(index, {
                                target: { name: "secondary_unit_id", value },
                              })
                            }
                            disabled={!element.productid}
                          >
                            <SelectTrigger
                              className={`input-focus-style w-full max-w-[150px] ${
                                !element.productid ? "bg-gray-300" : "bg-white"
                              }`}
                            >
                              <SelectValue placeholder="Select Secondary Unit" />
                            </SelectTrigger>
                            <SelectContent>
                              {unitMaster.map((unit) => (
                                <SelectItem
                                  key={unit.unit_id}
                                  value={unit.unit_id}
                                >
                                  {unit.unit_name}
                                  {unit.unit_symbol && ` (${unit.unit_symbol})`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </>
                  )}
                {enablestock == "Y" && (
                  <div className="flex items-center">
                    <label className="text-sm font-medium text-gray-500 w-32">
                      Stock:
                    </label>
                    <div className="flex items-center">
                      <Eye
                        className={`text-[#26994e] ${
                          element.productid
                            ? "cursor-pointer"
                            : "cursor-not-allowed opacity-50"
                        }`}
                        size={22}
                        onClick={() =>
                          element.productid && handleShowStock(element)
                        }
                        disabled={!element.productid}
                      />
                    </div>
                  </div>
                )}
                <div className="flex items-center">
                  <label className="text-sm font-medium text-gray-500 w-32">
                    MRP:
                  </label>
                  <span className="text-sm">
                    {!isNaN(parseFloat(element.mrp_price))
                      ? parseFloat(element.mrp_price).toFixed(2)
                      : "0.00"}
                  </span>
                </div>
                <div className="flex items-center">
                  <label className="text-sm font-medium text-gray-500 w-32">
                    Rate:
                  </label>
                  <Input
                    type="text"
                    className={`input-focus-style w-full max-w-[150px] ${
                      !element.productid || !user?.isEmployee
                        ? "bg-gray-300"
                        : "bg-white"
                    }`}
                    name={
                      selectedtypeOption == "salesorder-option" &&
                      secUnitConfig == "1" &&
                      element.unit_con_mode == "3" &&
                      element.conversion_flg == "2"
                        ? "sec_unit_rate"
                        : "rate"
                    }
                    value={
                      selectedtypeOption == "salesorder-option" &&
                      secUnitConfig == "1" &&
                      element.unit_con_mode == "3" &&
                      element.conversion_flg == "2"
                        ? element.sec_unit_rate || ""
                        : element.rate || ""
                    }
                    onChange={(e) => handleChange(index, e)}
                    onKeyDown={handleKeyDown}
                    disabled={!element.productid || !user?.isEmployee}
                  />
                </div>
                <div className="flex items-center">
                  <label className="text-sm font-medium text-gray-500 w-32">
                    Disc (%):
                  </label>
                  <Input
                    type="text"
                    className={`input-focus-style w-full max-w-[150px] ${
                      !element.productid || !user?.isEmployee
                        ? "bg-gray-300"
                        : "bg-white"
                    }`}
                    name="discount"
                    value={element.discount || ""}
                    onChange={(e) => handleChange(index, e)}
                    onKeyDown={handleKeyDown}
                    disabled={!element.productid || !user?.isEmployee}
                  />
                </div>
                <div className="flex items-center">
                  <label className="text-sm font-medium text-gray-500 w-32">
                    Disc:
                  </label>
                  <Input
                    type="text"
                    className={`input-focus-style w-full max-w-[150px] ${
                      !element.productid || !user?.isEmployee
                        ? "bg-gray-300"
                        : "bg-white"
                    }`}
                    name="discount_amount"
                    value={element.discount_amount || ""}
                    onChange={(e) => handleChange(index, e)}
                    onKeyDown={handleKeyDown}
                    disabled={!element.productid || !user?.isEmployee}
                  />
                </div>
                <div className="flex items-center">
                  <label className="text-sm font-medium text-gray-500 w-32">
                    Total:
                  </label>
                  <span className="text-sm">
                    {element.totalrate > 0
                      ? parseFloat(element.totalrate).toFixed(2)
                      : "0.00"}
                  </span>
                </div>
                {selectedtypeOption == "salesorder-option" && (
                  <div className="flex items-center">
                    <label className="text-sm font-medium text-gray-500 w-32">
                      Schedule Date:
                    </label>
                    <Input
                      type="date"
                      name="scheduleDate"
                      value={element.scheduleDate || ""}
                      onChange={(e) => handleChange(index, e)}
                      className="w-full max-w-[150px] text-xs px-1"
                      disabled={selectedtypeOption == "lead-option"}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div className="flex justify-end">
          <Button
            type="button"
            className="bg-[#287f71] hover:bg-[#20665a] text-white text-sm sm:text-base px-4 py-2"
            onClick={addFormFields}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Row
          </Button>
        </div>
      </div>

      {/* Desktop Add Row Button */}
      <div className="hidden md:block text-end mt-2 px-2 sm:px-4 py-4">
        <Button
          type="button"
          className="bg-[#287f71] hover:bg-[#20665a] text-white text-sm sm:text-base px-4 py-2"
          onClick={addFormFields}
        >
          <Plus className="h-4 w-4 mr-2" /> Add Row
        </Button>
      </div>

      {/* Stock Dialog */}
      <StockDialog
        open={isStockDialogOpen}
        setOpen={setIsStockDialogOpen}
        product={selectedProduct}
      />

      {/* Attributes Modal */}
      <ProdAttrDialog
        key={selectedProduct?.unique_id || "no-product"}
        open={isAttrModalOpen}
        setOpen={setIsAttrModalOpen}
        product={selectedProduct}
        index={formValues.findIndex(
          (item) => item.unique_id == selectedProduct?.unique_id
        )}
        formValues={formValues}
        setFormValues={setFormValues}
      />

      {/* Price List Dialog */}
      <PriceListDialog
        open={isPriceListModalOpen}
        setOpen={setIsPriceListModalOpen}
        product={selectedProduct}
        onSave={handlePriceListSave}
      />
    </div>
  );
};

export default ProductSelectionTable;
