"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Plus } from "lucide-react";
import MapWithAutocomplete from "@/components/maps/MapWithAutocomplete";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { leadService } from "@/lib/leadService";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createAddressFormSchema } from "@/validation/address-form.schema";
import { useLoginStore } from "@/stores/auth.store";
import useBasicSettingsStore from "@/stores/basicSettings.store";
import { useSharedDataStore } from "@/stores/sharedData.store";
import OrderService from "@/lib/OrderService";
import { MultiSelect } from "@/components/shared/MultiSelect";

export const AddressForm = ({
  onAddAddressSubmit,
  onCancel,
  addressType,
  isSubmitting,
}) => {
  const { token, appConfig, user } = useLoginStore();
  const { countries, setLoading, setError } = useBasicSettingsStore();
  const { routeList } = useSharedDataStore();
  const [stateList, setStateList] = useState([]);
  const [addressTypeList, setAddressTypeList] = useState([]);
  const [newAddressType, setNewAddressType] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedAddressType, setSelectedAddressType] = useState(null);
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(createAddressFormSchema(appConfig)),
    defaultValues: {
      nickname: "",
      address1: "",
      area: "",
      city: "",
      zipcode: "",
      selcountry: "India",
      selstate: "GUJARAT",
      // routes: [],
    },
    mode: "onChange",
  });

  const { formState } = form;

  // Fetch address types
  const {
    data: addressTypeData,
    error: addressTypeError,
    isLoading: addressTypeLoading,
  } = useQuery({
    queryKey: ["addressTypeList", token],
    queryFn: () => OrderService.getAddressTypes(token),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  const {
    data: stateData,
    error: stateError,
    isLoading: stateLoading,
  } = useQuery({
    queryKey: ["stateList", form.watch("selcountry")],
    queryFn: () => leadService.getStateList(form.watch("selcountry")),
    enabled: !!form.watch("selcountry"),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  // Mutation for saving new address type
  const saveAddressTypeMutation = useMutation({
    mutationFn: (addressTypeName) =>
      OrderService.saveAddressTypes({
        token,
        created_by: user?.id,
        name: addressTypeName,
      }),
    onSuccess: async (data) => {
      const responseData = Array.isArray(data) ? data[0] : data;
      if (responseData?.STATUS === "SUCCESS" && responseData?.DATA1) {
        toast.success(responseData.MSG || "Address type added successfully",{
            duration: 2000,
          });
        setIsSheetOpen(false);
        setNewAddressType("");
        // Store the new address type to set after refetch
        setSelectedAddressType(responseData.DATA1);
        // Refetch address types
        await queryClient.refetchQueries({
          queryKey: ["addressTypeList", token],
        });
      } else {
        throw new Error(responseData?.MSG || "Failed to add address type");
      }
    },
    onError: (error) => {
      console.error("Save address type error:", error);
      toast.error(error.message || "Failed to add address type");
    },
  });

  // Handle address type data updates and set form value
  useEffect(() => {
    if (addressTypeData) {
      const responseData = Array.isArray(addressTypeData)
        ? addressTypeData[0]
        : addressTypeData;
      if (
        responseData?.STATUS === "SUCCESS" &&
        Array.isArray(responseData?.DATA)
      ) {
        setAddressTypeList(responseData.DATA);
        // Set the new address type if it exists in the updated list
        if (
          selectedAddressType &&
          responseData.DATA.some((type) => type.name === selectedAddressType)
        ) {
          form.setValue("nickname", selectedAddressType, {
            shouldValidate: true,
          });
          setSelectedAddressType(null); // Clear after setting
        }
      } else {
        toast.error(responseData?.MSG || "Invalid address type response data");
        setAddressTypeList([]);
      }
    }
  }, [addressTypeData, form, selectedAddressType]);

  useEffect(() => {
    if (stateData) {
      setStateList([]);
      const responseData = Array.isArray(stateData) ? stateData[0] : stateData;
      if (
        responseData?.STATUS === "SUCCESS" &&
        Array.isArray(responseData?.DATA?.state)
      ) {
        const states = responseData.DATA.state.map((item) => item.State);
        setStateList(states);
        if (form.watch("selcountry") === "India") {
          const gujarat = states.find(
            (state) => state.state_name === "GUJARAT"
          );
          if (gujarat) {
            form.setValue("selstate", gujarat.state_name, {
              shouldValidate: true,
            });
          } else {
            toast.error("GUJARAT not found in state list");
          }
        }
      } else {
        toast.error(responseData?.MSG || "Invalid state response data");
        setStateList([]);
      }
    }
  }, [stateData, form]);

  const handleAddressFormSubmit = (values) => {
    onAddAddressSubmit(values);
  };

  const handleZipcodeInput = async (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    form.setValue("zipcode", value, { shouldValidate: true });
    await form.trigger("zipcode");
  };

  const handleTextInput = (e, fieldName) => {
    const value = e.target.value.replace(/[^A-Za-z\s]/g, "");
    form.setValue(fieldName, value, { shouldValidate: true });
    form.trigger(fieldName);
  };

  const handleAddressChange = (addressData) => {
    form.setValue("address1", addressData.address || "", {
      shouldValidate: true,
    });
    form.setValue("area", addressData.area || "", { shouldValidate: true });
    form.setValue("city", addressData.city || "", { shouldValidate: true });
    form.setValue("selstate", addressData.state || "", {
      shouldValidate: true,
    });
    form.setValue("selcountry", addressData.country || "", {
      shouldValidate: true,
    });
    form.setValue("zipcode", addressData.pincode || "", {
      shouldValidate: true,
    });

    Promise.all([
      form.trigger("address1"),
      form.trigger("area"),
      form.trigger("city"),
      form.trigger("selstate"),
      form.trigger("selcountry"),
      form.trigger("zipcode"),
    ]);
  };

  const handleAddAddressType = () => {
    if (newAddressType.trim()) {
      saveAddressTypeMutation.mutate(newAddressType);
    } else {
      toast.error("Please enter a valid address type name");
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleAddressFormSubmit)}
        className="grid gap-3 sm:gap-4 md:gap-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
          <FormField
            control={form.control}
            name="nickname"
            render={({ field }) => (
              <FormItem>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="nickname" className="text-sm md:text-base">
                      Address Type <span className="text-red-500">*</span>
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      {addressType === "Y" ? (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="w-full input-focus-style">
                            <SelectValue placeholder="Select Address Type" />
                          </SelectTrigger>
                          <SelectContent>
                            {addressTypeList.map((type, index) => (
                              <SelectItem
                                key={`address_type_${index}`}
                                value={type.name}
                              >
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id="nickname"
                          className="w-full input-focus-style"
                          placeholder="Enter address type"
                          {...field}
                        />
                      )}
                    </FormControl>
                    {addressType === "Y" && (
                      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                        <SheetTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </SheetTrigger>
                        <SheetContent className="bg-[#fff]">
                          <SheetHeader>
                            <SheetTitle>Add New Address Type</SheetTitle>
                          </SheetHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="newAddressType">
                                Address Type Name
                              </Label>
                              <Input
                                id="newAddressType"
                                value={newAddressType}
                                onChange={(e) =>
                                  setNewAddressType(e.target.value)
                                }
                                placeholder="Enter new address type"
                                className="input-focus-style"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setIsSheetOpen(false);
                                  setNewAddressType("");
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                onClick={handleAddAddressType}
                                disabled={
                                  saveAddressTypeMutation.isLoading ||
                                  !newAddressType.trim()
                                }
                                className="bg-[#287f71] hover:bg-[#20665a] text-white"
                              >
                                {saveAddressTypeMutation.isLoading
                                  ? "Adding..."
                                  : "Add Type"}
                              </Button>
                            </div>
                          </div>
                        </SheetContent>
                      </Sheet>
                    )}
                  </div>
                </div>
                <FormMessage className="text-xs h-2 text-red-500 mt-1" />
              </FormItem>
            )}
          />
        </div>

        <div className="">
          <MapWithAutocomplete
            setValue={form.setValue}
            onAddressChange={handleAddressChange}
          />
        </div>

        <FormField
          control={form.control}
          name="address1"
          render={({ field }) => (
            <FormItem>
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="address1" className="text-sm md:text-base">
                  Address{" "}
                  {appConfig?.required_add1 === "Y" && (
                    <span className="text-red-500">*</span>
                  )}
                </Label>
                <FormControl>
                  <Textarea
                    id="address1"
                    className="w-full input-focus-style"
                    placeholder="123, MG Road"
                    {...field}
                    rows={2}
                  />
                </FormControl>
              </div>
              <FormMessage className="text-xs h-2 text-red-500 mt-1" />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
          <FormField
            control={form.control}
            name="area"
            render={({ field }) => (
              <FormItem>
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="area" className="text-sm md:text-base">
                    Area{" "}
                    {appConfig?.contact_required_area === "Y" && (
                      <span className="text-red-500">*</span>
                    )}
                  </Label>
                  <FormControl>
                    <Input
                      id="area"
                      className="w-full input-focus-style"
                      placeholder="Koramangala"
                      {...field}
                      onChange={(e) => handleTextInput(e, "area")}
                      value={field.value}
                    />
                  </FormControl>
                </div>
                <FormMessage className="text-xs h-2 text-red-500 mt-1" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="zipcode"
            render={({ field }) => (
              <FormItem>
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="zipcode" className="text-sm md:text-base">
                    Pincode{" "}
                    {appConfig?.required_pincode === "Y" && (
                      <span className="text-red-500">*</span>
                    )}
                  </Label>
                  <FormControl>
                    <Input
                      id="zipcode"
                      className="w-full input-focus-style"
                      placeholder="560001"
                      {...field}
                      onChange={handleZipcodeInput}
                      value={field.value}
                      inputMode="numeric"
                    />
                  </FormControl>
                </div>
                <FormMessage className="text-xs h-2 text-red-500 mt-1" />
              </FormItem>
            )}
          />
        </div>

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="city" className="text-sm md:text-base">
                    City{" "}
                    {appConfig?.contact_required_city === "Y" && (
                      <span className="text-red-500">*</span>
                    )}
                  </Label>
                  <FormControl>
                    <Input
                      id="city"
                      className="w-full input-focus-style"
                      placeholder="Bangalore"
                      {...field}
                      onChange={(e) => handleTextInput(e, "city")}
                      value={field.value}
                    />
                  </FormControl>
                </div>
                <FormMessage className="text-xs h-2 text-red-500 mt-1" />
              </FormItem>
            )}
          />


        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
          <FormField
            control={form.control}
            name="selcountry"
            render={({ field }) => (
              <FormItem>
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="selcountry" className="text-sm md:text-base">
                    Country <span className="text-red-500">*</span>
                  </Label>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full input-focus-style">
                        <SelectValue placeholder="Select a Country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem
                            key={country.Country.country_code}
                            value={country.Country.country_name}
                          >
                            {country.Country.country_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </div>
                <FormMessage className="text-xs h-2 text-red-500 mt-1" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="selstate"
            render={({ field }) => (
              <FormItem>
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="selstate" className="text-sm md:text-base">
                    State <span className="text-red-500">*</span>
                  </Label>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={stateLoading || !stateList.length}
                    >
                      <SelectTrigger className="w-full input-focus-style">
                        <SelectValue
                          placeholder={
                            stateLoading
                              ? "Loading states..."
                              : "Select a State"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {stateList.map((state) => (
                          <SelectItem
                            key={state.state_code}
                            value={state.state_name}
                          >
                            {state.state_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </div>
                <FormMessage className="text-xs h-2 text-red-500 mt-1" />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-[#287f71] hover:bg-[#20665a] text-white text-sm sm:text-base"
            disabled={isSubmitting || formState.isSubmitting}
          >
            {isSubmitting ? "Adding..." : "Add Address"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
