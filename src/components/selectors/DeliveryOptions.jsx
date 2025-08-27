"use client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useLoginStore } from "@/stores/auth.store";
import { useEffect, useRef } from "react";

const DeliveryOptions = ({
  companyInfo,
  deliveryOptions = [],
  deliveryType,
  setDeliveryType,
  billToAddress,
  setBillToAddress,
  shipToAddress,
  setShipToAddress,
  isSameAddress,
  setIsSameAddress,
  selectedContact,
  orderIdParam,
  salesOrderDetails,
}) => {
  const { user } = useLoginStore();

  // Transform companyInfo into pickupOptions format
  const pickupOptions = companyInfo
    ? [
        {
          id: companyInfo.company_id || "1",
          name: companyInfo.company_name || "",
          address: [
            companyInfo.address_1,
            companyInfo.address_2,
            companyInfo.area,
            companyInfo.city_name,
            companyInfo.state,
            companyInfo.country,
          ]
            .filter(Boolean)
            .join(", "),
        },
      ]
    : [];

  // Determine default tab based on salesOrderDetails?.delivery_type
  const defaultTab = orderIdParam
    ? salesOrderDetails?.delivery_type == 1
      ? "pickup"
      : salesOrderDetails?.delivery_type == 2
      ? "delivery"
      : ""
    : deliveryType || "delivery"; // Fallback to 'delivery' if no defaultTab or deliveryType

  // Use a ref to track if the initial check has been done
  const hasInitialized = useRef(false);

  // Auto-select the checkbox when there's exactly one delivery option, only on mount and when selectedContact is available
  useEffect(() => {
    if (
      !orderIdParam &&
      deliveryOptions.length == 1 &&
      isSameAddress == null &&
      !hasInitialized.current &&
      selectedContact?.id
    ) {
      setIsSameAddress(deliveryOptions[0].id);
      hasInitialized.current = true; // Mark as initialized
    }
  }, [deliveryOptions, orderIdParam, setIsSameAddress, selectedContact?.id]);

  // Reset hasInitialized when selectedContact becomes null
  useEffect(() => {
    if (!selectedContact?.id) {
      hasInitialized.current = false; // Allow reinitialization when selectedContact is null
    }
  }, [selectedContact?.id]);

  // Handle tab change
  const handleTabChange = (value) => {
    if (orderIdParam) return;
    if (value == "delivery" && user?.isEmployee && !selectedContact?.id) {
      toast.error("Please select a contact to proceed");
      return;
    }
    setDeliveryType(value);
    // Reset addresses when switching tabs
    setIsSameAddress(null);
    setBillToAddress(null);
    setShipToAddress(null);
  };

  const handleBillToChange = (addressId) => {
    if (orderIdParam) return;
    setBillToAddress(addressId);
    setIsSameAddress(null); // Uncheck "same address" checkbox
    if (shipToAddress == addressId) {
      setShipToAddress(null); // Prevent same address for both billTo and shipTo
    }
  };

  const handleShipToChange = (addressId) => {
    if (orderIdParam) return;
    setShipToAddress(addressId);
    setIsSameAddress(null); // Uncheck "same address" checkbox
    if (billToAddress == addressId) {
      setBillToAddress(null); // Prevent same address for both billTo and shipTo
    }
  };

  const handleSameAddressChange = (addressId, checked) => {
    if (orderIdParam) return;
    if (checked) {
      setIsSameAddress(addressId);
      setBillToAddress(null);
      setShipToAddress(null);
    } else {
      setIsSameAddress(null);
      // Optionally, you can set default billTo/shipTo here if needed
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="block text-base font-medium text-[#4a5a6b]">
        Where do you want the delivery?
      </h3>

      <Tabs
        value={defaultTab}
        onValueChange={handleTabChange}
        className="w-full"
        disabled={!!orderIdParam}
      >
        <TabsList className="grid w-full grid-cols-2 h-auto lead-tabs">
          <TabsTrigger
            value="delivery"
            className="data-[state=active]:bg-[#287f71] data-[state=active]:text-white hover:text-[#20665a] transition-colors py-2"
            disabled={!!orderIdParam}
          >
            To Be Delivered
          </TabsTrigger>
          <TabsTrigger
            value="pickup"
            className="data-[state=active]:bg-[#287f71] data-[state=active]:text-white hover:text-[#20665a] transition-colors py-2"
            disabled={!!orderIdParam}
          >
            Pickup From Store
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pickup">
          <RadioGroup
            value={pickupOptions.length > 0 ? pickupOptions[0].id : ""}
            disabled={!!orderIdParam}
          >
            {pickupOptions.map((option) => (
              <Card key={option.id} className="p-4 mt-2">
                <div className="flex items-baseline space-x-2">
                  <RadioGroupItem
                    value={option.id}
                    id={option.id}
                    className="text-white data-[state=checked]:border-[#287f71] [&[data-state=checked]>span>svg]:fill-[#287f71]"
                    disabled={!!orderIdParam}
                  />
                  <Label htmlFor={option.id} className="cursor-pointer">
                    <h4 className="font-medium text-lg text-[#287f71]">
                      {option.name}
                    </h4>
                    <div className="text-sm text-gray-600">
                      {option.address}
                    </div>
                  </Label>
                </div>
              </Card>
            ))}
          </RadioGroup>
        </TabsContent>

        <TabsContent value="delivery">
          {deliveryOptions.map((option) => {
            // For existing orders (orderIdParam present)
            const isCheckboxCheckedOrder =
              orderIdParam &&
              salesOrderDetails?.shipping_address_id ==
                salesOrderDetails?.billing_address_id &&
              salesOrderDetails?.billing_address_id == option.id;

            const isBillToCheckedOrder =
              orderIdParam &&
              salesOrderDetails?.billing_address_id == option.id &&
              salesOrderDetails?.shipping_address_id !=
                salesOrderDetails?.billing_address_id;

            const isShipToCheckedOrder =
              orderIdParam &&
              salesOrderDetails?.shipping_address_id == option.id &&
              salesOrderDetails?.shipping_address_id !=
                salesOrderDetails?.billing_address_id;

            // For new orders
            const isCheckboxCheckedNew = isSameAddress == option.id;
            const isBillToCheckedNew =
              billToAddress == option.id && !isSameAddress;
            const isShipToCheckedNew =
              shipToAddress == option.id && !isSameAddress;

            // Combined values
            const isCheckboxChecked =
              isCheckboxCheckedOrder || isCheckboxCheckedNew;
            const isBillToChecked = isBillToCheckedOrder || isBillToCheckedNew;
            const isShipToChecked = isShipToCheckedOrder || isShipToCheckedNew;

            return (
              <Card
                key={option.id}
                className="p-4 mt-2 border border-gray-300 rounded-lg"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Checkbox
                    id={`same-address-${option.id}`}
                    checked={isCheckboxChecked}
                    onCheckedChange={(checked) =>
                      handleSameAddressChange(option.id, checked)
                    }
                    className="text-white data-[state=checked]:border-[#287f71] data-[state=checked]:bg-[#287f71]"
                    disabled={!!orderIdParam}
                  />
                  <Label
                    htmlFor={`same-address-${option.id}`}
                    className="text-sm text-gray-600"
                  >
                    Please select this if both addresses are same.
                  </Label>
                </div>

                <RadioGroup className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={option.id}
                      id={`bill-to-${option.id}`}
                      checked={isBillToChecked}
                      onClick={() => handleBillToChange(option.id)}
                      className="text-white data-[state=checked]:border-[#287f71] [&[data-state=checked]>span>svg]:fill-[#287f71]"
                      disabled={!!orderIdParam}
                    />
                    <Label
                      htmlFor={`bill-to-${option.id}`}
                      className="text-sm text-gray-600 cursor-pointer"
                    >
                      Bill to Address
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={option.id}
                      id={`ship-to-${option.id}`}
                      checked={isShipToChecked}
                      onClick={() => handleShipToChange(option.id)}
                      className="text-white data-[state=checked]:border-[#287f71] [&[data-state=checked]>span>svg]:fill-[#287f71]"
                      disabled={!!orderIdParam}
                    />
                    <Label
                      htmlFor={`ship-to-${option.id}`}
                      className="text-sm text-gray-600 cursor-pointer"
                    >
                      Ship to Address
                    </Label>
                  </div>
                </RadioGroup>
                <div className="mt-2 text-sm text-gray-600">
                  {option.address}
                </div>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeliveryOptions;
