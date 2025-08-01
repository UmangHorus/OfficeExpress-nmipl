"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useLoginStore } from "@/stores/auth.store";

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
  // Determine default tab based on salesOrderDetails?.delivery_type
  const defaultTab = orderIdParam
    ? salesOrderDetails?.delivery_type == 1
      ? "pickup"
      : salesOrderDetails?.delivery_type == 2
      ? "delivery"
      : ""
    : "";

  // Handle tab change
  const handleTabChange = (value) => {
    if (orderIdParam) return; // Prevent tab change if orderIdParam is present
    if (value == "delivery" && user?.isEmployee && !selectedContact?.id) {
      toast.error("Please select a contact to proceed");
      return;
    }
    setDeliveryType(value);
  };

  const handleBillToChange = (addressId) => {
    if (orderIdParam) return; // Prevent changes if orderIdParam is present
    if (shipToAddress == addressId) {
      setShipToAddress(null);
    }
    setBillToAddress(addressId);
    if (isSameAddress) {
      setIsSameAddress(null);
    }
  };

  const handleShipToChange = (addressId) => {
    if (orderIdParam) return; // Prevent changes if orderIdParam is present
    if (billToAddress == addressId) {
      setBillToAddress(null);
    }
    setShipToAddress(addressId);
    if (isSameAddress) {
      setIsSameAddress(null);
    }
  };

  const handleSameAddressChange = (addressId, checked) => {
    if (orderIdParam) return; // Prevent changes if orderIdParam is present
    if (checked) {
      setBillToAddress(null);
      setShipToAddress(null);
      setIsSameAddress(addressId);
    } else {
      setIsSameAddress(null);
      if (billToAddress == addressId && shipToAddress == addressId) {
        setShipToAddress(null);
      }
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="block text-base font-medium text-[#4a5a6b]">
        Where do you want the delivery?
      </h3>

      <Tabs
        value={defaultTab || deliveryType}
        onValueChange={handleTabChange}
        className="w-full"
        disabled={!!orderIdParam}
      >
        <TabsList className="grid w-full grid-cols-2 h-auto lead-tabs">
          <TabsTrigger
            value="pickup"
            className="data-[state=active]:bg-[#287f71] data-[state=active]:text-white hover:text-[#20665a] transition-colors py-2"
            disabled={!!orderIdParam}
          >
            Pickup From Store
          </TabsTrigger>
          <TabsTrigger
            value="delivery"
            className="data-[state=active]:bg-[#287f71] data-[state=active]:text-white hover:text-[#20665a] transition-colors py-2"
            disabled={!!orderIdParam}
          >
            To Be Delivered
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pickup">
          <RadioGroup
            value={pickupOptions.length > 0 && pickupOptions[0].id}
            disabled={!!orderIdParam}
          >
            {pickupOptions.length > 0 &&
              pickupOptions.map((option) => (
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
            // Determine if checkbox and radio buttons should be pre-selected
            const isCheckboxChecked =
              orderIdParam &&
              salesOrderDetails?.shipping_address_id ==
                salesOrderDetails?.billing_address_id &&
              salesOrderDetails?.billing_address_id == option.id;

            const isBillToChecked =
              orderIdParam &&
              salesOrderDetails?.billing_address_id == option.id &&
              salesOrderDetails?.shipping_address_id !=
                salesOrderDetails?.billing_address_id;

            const isShipToChecked =
              orderIdParam &&
              salesOrderDetails?.shipping_address_id == option.id &&
              salesOrderDetails?.shipping_address_id !=
                salesOrderDetails?.billing_address_id;

            return (
              <Card
                key={option.id}
                className="p-4 mt-2 border border-gray-300 rounded-lg"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Checkbox
                    id={`same-address-${option.id}`}
                    checked={isSameAddress == option.id || isCheckboxChecked}
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
                      checked={billToAddress == option.id || isBillToChecked}
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
                      checked={shipToAddress == option.id || isShipToChecked}
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
