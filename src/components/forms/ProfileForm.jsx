"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useLoginStore } from "@/stores/auth.store";
import useBasicSettingsStore from "@/stores/basicSettings.store";
import { leadService } from "@/lib/leadService";
import MapWithAutocomplete from "@/components/maps/MapWithAutocomplete";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createContactFormSchema } from "@/validation/contact-form.schema";
import { useSharedDataStore } from "@/stores/sharedData.store";

const ProfileForm = ({ onClose }) => {
  const queryClient = useQueryClient();
  const {
    user: authUser,
    token,
    navConfig,
    appConfig,
    location,
  } = useLoginStore();
  const { countries, titles } = useBasicSettingsStore();
  const { setContactProfileName } = useSharedDataStore();
  const [stateList, setStateList] = useState([]);

  const form = useForm({
    resolver: zodResolver(createContactFormSchema(appConfig)),
    defaultValues: {
      title: "2", // Default to "Mr."
      name: "",
      Email: "",
      mobile: "",
      address: "",
      area: "",
      pincode: "",
      city: "",
      country: "India", // Default to India (country_name)
      state: "GUJARAT", // State name (e.g., "GUJARAT")
      contact_id: "",
      contact_type: "",
      contact_category: "",
      add_type: "",
      add_id: "",
      add_nickname: null,
      billing_flg: "",
      branch_id: "",
      branch_name: "",
      address_2: null,
    },
    mode: "onChange",
  });

  // Register non-displayed fields to ensure they are tracked in the form state
  useEffect(() => {
    form.register("contact_id");
    form.register("contact_type");
    form.register("contact_category");
    form.register("add_type");
    form.register("add_id");
    form.register("add_nickname");
    form.register("billing_flg");
    form.register("branch_id");
    form.register("branch_name");
    form.register("address_2");
  }, [form]);

  // Fetch states
  const {
    data: stateData,
    isLoading: stateLoading,
    error: stateError,
  } = useQuery({
    queryKey: ["stateList", form.watch("country")],
    queryFn: () => leadService.getStateList(form.watch("country")),
    enabled: !!form.watch("country"),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (stateData) {
      form.setValue("state", "", { shouldValidate: true });
      setStateList([]);
      const responseData = Array.isArray(stateData) ? stateData[0] : stateData;
      if (
        responseData?.STATUS == "SUCCESS" &&
        Array.isArray(responseData?.DATA?.state)
      ) {
        const states = responseData.DATA.state.map((item) => item.State);
        setStateList(states);
        if (form.watch("country") == "India") {
          const gujarat = states.find((state) => state.state_name == "GUJARAT");
          if (gujarat) {
            form.setValue("state", gujarat.state_name, {
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

  // Fetch contact details
  const { data: contactData, isLoading: contactLoading } = useQuery({
    queryKey: ["contactDetails", authUser?.id, authUser?.type, token],
    queryFn: () =>
      leadService.getRawContactDetails(authUser?.id, authUser?.type),
    enabled:
      !authUser?.isEmployee && !!authUser?.id && !!authUser?.type && !!token,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (contactData) {
      const responseData = Array.isArray(contactData)
        ? contactData[0]
        : contactData;
      if (responseData?.STATUS === "SUCCESS" && responseData?.DATA) {
        const data = responseData.DATA;
        form.reset({
          title: data.contact_title || "2",
          name: data.name || "",
          Email: data.email_address || "",
          mobile: data.mobile_no || "",
          address: data.address_1 || "",
          area: data.area || "",
          pincode: data.zipcode || "",
          city: data.city_name || "",
          country: data.country || "India",
          state: data.state || "",
          contact_id: data.contact_id?.toString() || "",
          contact_type: data.contact_type?.toString() || "",
          contact_category: data.contact_category || "",
          add_type: data.add_type || "",
          add_id: data.address_id?.toString() || "",
          add_nickname: data.nickname || null,
          billing_flg: data.billing_flg || "",
          branch_id: data.branch_id?.toString() || "",
          branch_name: data.branch_name || "",
          address_2: data.address_2 || null,
        });
        setContactProfileName(data.name);
        // Debug: Log form state after reset
      } else {
        toast.error(responseData?.MSG || "No contact details found");
      }
    }
  }, [contactData, form]);

  // Update profile mutation
  const updateContactMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        country_name: data.country,
        state_name: data.state,
        contacts: JSON.stringify({
          contact_id: data.contact_id || authUser.id?.toString() || "",
          contact_type: data.contact_type || authUser.type?.toString() || "",
          contact_category: data.contact_category || "",
          add_type: data.add_type || "",
          add_id: data.add_id || "",
          add_nickname: data.add_nickname || null,
          billing_flg: data.billing_flg || "",
          branch_id: data.branch_id || "",
          branch_name: data.branch_name || "",
          country: data.country,
          state: data.state,
          contact_name: data.name,
          contact_email: data.Email,
          mobileno: data.mobile,
          address_line1: data.address,
          address_line2: data.address_2 || null,
          city: data.city,
          zipcode: data.pincode,
          area: data.area,
        }),
      };
      const response = await leadService.updateLeadContactData(payload);
      return response;
    },
    onSuccess: (response) => {
      const responseData = Array.isArray(response) ? response[0] : response;
      if (responseData?.STATUS === "SUCCESS") {
        queryClient.refetchQueries({
          queryKey: ["contactDetails", authUser?.id, authUser?.type, token],
          exact: true,
        });
        toast.success("Profile updated successfully!",{
            duration: 2000,
          });
        onClose();
      } else {
        throw new Error(responseData?.MSG || "Failed to update profile");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update profile");
    },
  });

  const handleFormSubmit = () => {
    const data = form.getValues(); // Get all form values, including non-displayed fields
    updateContactMutation.mutate(data);
  };

  const handleMobileInput = async (event) => {
    // No-op since mobile is disabled
  };

  const handlePincodeInput = async (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    form.setValue("pincode", value, { shouldValidate: true });
    await form.trigger("pincode");
  };

  const handleNameInput = async (e) => {
    const value = e.target.value.replace(/[^A-Za-z\s]/g, "");
    form.setValue("name", value, { shouldValidate: true });
    await form.trigger("name");
  };

  const handleAddressChange = (addressData) => {
    form.setValue("address", addressData.address || "", {
      shouldValidate: true,
    });
    form.setValue("area", addressData.area || "", { shouldValidate: true });
    form.setValue("city", addressData.city || "", { shouldValidate: true });
    form.setValue("state", addressData.state || "", { shouldValidate: true });
    form.setValue("country", addressData.country || "India", {
      shouldValidate: true,
    });
    form.setValue("pincode", addressData.pincode || "", {
      shouldValidate: true,
    });
    Promise.all([
      form.trigger("address"),
      form.trigger("area"),
      form.trigger("city"),
      form.trigger("state"),
      form.trigger("country"),
      form.trigger("pincode"),
    ]);
  };

  return (
    <DialogContent className="w-[90vw] max-w-[425px] md:w-full md:max-w-[600px] lg:max-w-[800px] max-h-[90vh] overflow-y-auto bg-white p-4 sm:p-6 rounded-lg">
      <DialogHeader>
        <DialogTitle>My Profile</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="grid gap-3 sm:gap-4 md:gap-6"
        >
          {contactLoading && (
            <p className="text-gray-500">Loading profile...</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            <FormItem>
              <div className="grid grid-cols-1 gap-2">
                <Label className="text-sm md:text-base">
                  Name <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-start space-x-2">
                  {/* <div>
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <SelectTrigger className="w-[80px] input-focus-style">
                                <SelectValue placeholder="Title" />
                              </SelectTrigger>
                              <SelectContent>
                                {titles.map((title) => (
                                  <SelectItem key={title.ID} value={title.ID}>
                                    {title.Name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage className="text-xs h-2 text-red-500 mt-1" />
                        </>
                      )}
                    />
                  </div> */}
                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <>
                          <FormControl>
                            <Input
                              id="name"
                              className="w-full input-focus-style"
                              placeholder="Contact Name"
                              {...field}
                              onChange={(e) => {
                                handleNameInput(e);
                                field.onChange(e);
                              }}
                              value={field.value}
                            />
                          </FormControl>
                          <FormMessage className="text-xs h-2 text-red-500 mt-1" />
                        </>
                      )}
                    />
                  </div>
                </div>
              </div>
            </FormItem>
            <FormItem>
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="Email" className="text-sm md:text-base">
                  Email{" "}
                  {appConfig?.contact_required_email == "Y" && (
                    <span className="text-red-500">*</span>
                  )}
                </Label>
                <FormField
                  control={form.control}
                  name="Email"
                  render={({ field }) => (
                    <>
                      <FormControl>
                        <Input
                          id="Email"
                          type="email"
                          className="w-full input-focus-style"
                          placeholder="john@example.com"
                          {...field}
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage className="text-xs h-2 text-red-500 mt-1" />
                    </>
                  )}
                />
              </div>
            </FormItem>
          </div>
          <FormItem>
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="mobile" className="text-sm md:text-base">
                Mobile{" "}
                {/* {appConfig?.contact_required_mobile_no == "Y" && (
                  <span className="text-red-500">*</span>
                )} */}
                <span className="text-red-500">*</span>
              </Label>
              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <>
                    <FormControl>
                      <Input
                        id="mobile"
                        className="w-full input-focus-style"
                        placeholder="1234567890"
                        {...field}
                        disabled
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage className="text-xs h-2 text-red-500 mt-1" />
                  </>
                )}
              />
            </div>
          </FormItem>
          <div>
            <MapWithAutocomplete
              setValue={form.setValue}
              onAddressChange={handleAddressChange}
            />
          </div>
          <FormItem>
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="address" className="text-sm md:text-base">
                Address{" "}
                {appConfig?.required_add1 == "Y" && (
                  <span className="text-red-500">*</span>
                )}
              </Label>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <>
                    <FormControl>
                      <Textarea
                        id="address"
                        className="w-full input-focus-style"
                        placeholder="123, MG Road, Bangalore, Karnataka, 560001"
                        {...field}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage className="text-xs h-2 text-red-500 mt-1" />
                  </>
                )}
              />
            </div>
          </FormItem>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            <FormItem>
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="area" className="text-sm md:text-base">
                  Area{" "}
                  {appConfig?.contact_required_area == "Y" && (
                    <span className="text-red-500">*</span>
                  )}
                </Label>
                <FormField
                  control={form.control}
                  name="area"
                  render={({ field }) => (
                    <>
                      <FormControl>
                        <Input
                          id="area"
                          className="w-full input-focus-style"
                          placeholder="Koramangala, Andheri East, etc."
                          {...field}
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage className="text-xs h-2 text-red-500 mt-1" />
                    </>
                  )}
                />
              </div>
            </FormItem>
            <FormItem>
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="pincode" className="text-sm md:text-base">
                  Pincode{" "}
                  {appConfig?.required_pincode == "Y" && (
                    <span className="text-red-500">*</span>
                  )}
                </Label>
                <FormField
                  control={form.control}
                  name="pincode"
                  render={({ field }) => (
                    <>
                      <FormControl>
                        <Input
                          id="pincode"
                          className="w-full input-focus-style"
                          placeholder="560001"
                          {...field}
                          onChange={handlePincodeInput}
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage className="text-xs h-2 text-red-500 mt-1" />
                    </>
                  )}
                />
              </div>
            </FormItem>
            <FormItem>
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="city" className="text-sm md:text-base">
                  City{" "}
                  {appConfig?.contact_required_city == "Y" && (
                    <span className="text-red-500">*</span>
                  )}
                </Label>
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <>
                      <FormControl>
                        <Input
                          id="city"
                          className="w-full input-focus-style"
                          placeholder="Mumbai, Delhi, Bangalore"
                          {...field}
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage className="text-xs h-2 text-red-500 mt-1" />
                    </>
                  )}
                />
              </div>
            </FormItem>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            <FormItem>
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="country" className="text-sm md:text-base">
                  Country <span className="text-red-500">*</span>
                </Label>
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={countries.length <= 1}
                        >
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
                      <FormMessage className="text-xs h-2 text-red-500 mt-1" />
                    </>
                  )}
                />
              </div>
            </FormItem>
            <FormItem>
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="state" className="text-sm md:text-base">
                  State <span className="text-red-500">*</span>
                </Label>
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <>
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
                      <FormMessage className="text-xs h-2 text-red-500 mt-1" />
                    </>
                  )}
                />
              </div>
            </FormItem>
          </div>
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateContactMutation.isPending || contactLoading}
              className="bg-[#287f71] hover:bg-[#20665a] text-white text-sm sm:text-base"
            >
              {updateContactMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
};

export default ProfileForm;
