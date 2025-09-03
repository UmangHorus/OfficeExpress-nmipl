// File: AddMeasurementPage.jsx
"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Ruler } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useLoginStore } from "@/stores/auth.store";
import { leadService } from "@/lib/leadService";
import MeasurementProductSelectionTable from "./MeasurementProductSelectionTable";

const AddMeasurementPage = () => {
  const { user = {}, token } = useLoginStore();
  const searchParams = useSearchParams();
  const contactId = searchParams.get("contact_id");
  const contactType = searchParams.get("contact_type");
  const evId = searchParams.get("ev_id");

  // State management
  const [formValues, setFormValues] = useState([
    {
      unique_id: Date.now(),
      productid: "",
      productname: "",
      productcode: "",
      product_image: "",
      Attribute_data: {},
    },
  ]);
  const [productList, setProductList] = useState([]);

  // Fetch product data
  const {
    data: productData,
    error: productError,
    isLoading: productLoading,
  } = useQuery({
    queryKey: ["productList", token, user?.id],
    queryFn: () => leadService.getProductBasedOnCompany(token, user?.id),
    enabled: !!token && !!user?.id,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Handle product data updates
  useEffect(() => {
    if (productData) {
      const responseData = Array.isArray(productData)
        ? productData[0]
        : productData;
      if (
        responseData?.STATUS === "SUCCESS" &&
        Array.isArray(responseData?.DATA?.products)
      ) {
        setProductList(responseData.DATA.products);
      } else {
        toast.error(responseData?.MSG || "Invalid product response data");
        setProductList([]);
      }
    }
    if (productError) {
      console.error("Error fetching products:", productError.message);
      toast.error("Error fetching products: " + productError.message);
    }
  }, [productData, productError]);

  // Handle form submission
//   const handleAddMeasurement = async () => {
//     try {
//       if (!token || !user?.id || !contactId || !contactType) {
//         throw new Error("Missing required parameters");
//       }
//       if (!formValues.some((item) => item.productid)) {
//         throw new Error("Please select at least one product");
//       }

//       const measurementData = {
//         contact_id: contactId,
//         contact_type: contactType,
//         ev_id: evId || "",
//         user_id: user.id,
//         products: formValues.map((item) => ({
//           product_id: item.productid,
//           product_name: item.productname,
//           product_code: item.productcode,
//           attributes: item.Attribute_data,
//         })),
//       };

//       // Placeholder API call (replace with actual API endpoint)
//       const response = await leadService.saveMeasurement(measurementData, token); // Adjust to actual service method
//       const responseData = Array.isArray(response) ? response[0] : response;

//       if (responseData?.STATUS === "SUCCESS") {
//         toast.success("Measurement added successfully!", {
//           duration: 2000,
//         });
//         setFormValues([
//           {
//             unique_id: Date.now(),
//             productid: "",
//             productname: "",
//             productcode: "",
//             product_image: "",
//             Attribute_data: {},
//           },
//         ]);
//       } else {
//         throw new Error(responseData?.MSG || "Failed to add measurement");
//       }
//     } catch (error) {
//       console.error("Error adding measurement:", error.message);
//       toast.error(error.message || "Failed to add measurement");
//     }
//   };

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-[#4a5a6b] flex items-center gap-2">
        <Ruler />
        Add Measurement
      </h1>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h3 className="block text-base font-medium text-[#4a5a6b]">
              Select Products
            </h3>
            <MeasurementProductSelectionTable
              formValues={formValues}
              setFormValues={setFormValues}
              productList={productList}
            />
          </div>
        </CardContent>
      </Card>

      <Button
        type="button"
        className="bg-[#287f71] hover:bg-[#20665a] text-white text-sm sm:text-base px-4 py-2"
        // onClick={handleAddMeasurement}
        disabled={productLoading || !formValues.some((item) => item.productid)}
      >
        Add Measurement
      </Button>
    </div>
  );
};

export default AddMeasurementPage;