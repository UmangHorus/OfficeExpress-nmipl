"use client";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/validation/auth.schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import Image from "next/image";
import { useLoginStore } from "@/stores/auth.store";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api/axios";
import { usePunchStore } from "@/stores/punch.store";
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
import { useQuery } from "@tanstack/react-query";
import { leadService } from "@/lib/leadService";
import useBasicSettingsStore from "@/stores/basicSettings.store";
import { useSharedDataStore } from "@/stores/sharedData.store";
import { createContactFormSchema } from "@/validation/contact-form.schema";
import MapWithAutocomplete from "@/components/maps/MapWithAutocomplete";
import { CompanySearch } from "../inputs/search";

const NewUserRegistrationForm = ({ mobile, onCancel }) => {
  const { token, appConfig, login,otpData } = useLoginStore();
  const { countries, titles, setLoading, setError } = useBasicSettingsStore();
  //   const { companyBranchDivisionData } = useSharedDataStore();
  const [companyList, setCompanyList] = useState([]);
  const [stateList, setStateList] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(true);
  const [pendingContactDetails, setPendingContactDetails] = useState(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(createContactFormSchema(appConfig)),
    defaultValues: {
      title: "2", // Default to "Mr."
      name: "",
      Email: "",
      mobile: mobile || "",
      address: "",
      area: "",
      pincode: "",
      city: "",
      //   industry: companyBranchDivisionData?.industries?.[0]?.industry_id || "",
      country: "India",
      state: "GUJARAT",
    },
    mode: "onChange",
  });

  //   useEffect(() => {
  //     if (companyBranchDivisionData?.industries?.length > 0) {
  //       form.setValue(
  //         "industry",
  //         companyBranchDivisionData.industries[0].industry_id,
  //         {
  //           shouldValidate: true,
  //         }
  //       );
  //     }
  //   }, [companyBranchDivisionData, form]);

  const {
    data: companyData,
    error: companyError,
    isLoading: companyLoading,
  } = useQuery({
    queryKey: ["companyList", token, ""],
    queryFn: () =>
      leadService.getContactRawcontactAutoComplete(token, "", true),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  const {
    data: stateData,
    error: stateError,
    isLoading: stateLoading,
  } = useQuery({
    queryKey: ["stateList", form.watch("country")],
    queryFn: () => leadService.getStateList(form.watch("country")),
    enabled: !!form.watch("country"),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (companyData) {
      const responseData = Array.isArray(companyData)
        ? companyData[0]
        : companyData;
      if (
        responseData?.STATUS == "SUCCESS" &&
        Array.isArray(responseData?.DATA?.contacts)
      ) {
        setCompanyList(responseData.DATA.contacts);
      } else {
        toast.error(responseData?.MSG || "Invalid contact response data");
        setCompanyList([]);
      }
    }
  }, [companyData]);

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

  const addContactMutation = useMutation({
    mutationFn: async ({ data, selectedcompany }) => {
      const contactData = {
        country: data.country,
        state: data.state,
        contact_title: data.title,
        name: data.name,
        company_name: selectedcompany ? selectedcompany.title : "",
        email: data.Email,
        mobile: data.mobile,
        address1: data.address,
        city: data.city,
        // industry_id: data.industry,
        zipcode: data.pincode,
        area: data.area,
        // created_by: user.id,
      };

      const response = await leadService.saveRawContact(contactData);
      return { response };
    },
    onSuccess: async ({ response }) => {
      const responseData = Array.isArray(response) ? response[0] : response;

      if (responseData?.STATUS === "SUCCESS") {
        // Store the token in state/local storage if needed for registration
        const isProduction = process.env.NODE_ENV === "production";
        const cookieExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        document.cookie = `token=${token}; path=/; expires=${cookieExpiry.toUTCString()}${
          isProduction ? "; secure; sameSite=strict" : ""
        }`;
        // Set isEmployee cookie
        document.cookie = `isEmployee=${
          otpData.isEmployee ? "true" : "false"
        }; path=/; expires=${cookieExpiry.toUTCString()}${
          isProduction ? "; secure; sameSite=strict" : ""
        }`;

        // Perform login with CONTACT_DETAILS
        // Only update the specific user fields
        useLoginStore.setState((state) => ({
          user: {
            ...state.user, // Preserve all existing user data
            id: responseData.CONTACT_DETAILS.contact_id,
            name: responseData.CONTACT_DETAILS.contact_name,
            type: responseData.CONTACT_DETAILS.contact_type,
            object_name: responseData.CONTACT_DETAILS.contact_name,
          },
        }));
       // Determine redirect path based on user type
        const redirectPath = otpData.isEmployee ? "/dashboard" : "/leads";
        router.push(redirectPath);
        toast.success("Contact added successfully!",{
            duration: 2000,
          });
      } else {
        throw new Error(responseData?.MSG || "Failed to add contact");
      }
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.MSG ||
        error.message ||
        "Failed to add contact. Please try again.";
      toast.error(errorMessage);
    },
  });

  const handleContactFormSubmit = (data) => {
    addContactMutation.mutate({ data, selectedcompany: selectedCompany });
  };

  const handleMobileInput = async (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    form.setValue("mobile", value, { shouldValidate: true });
    await form.trigger("mobile");
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
    form.setValue("country", addressData.country || "", {
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

  const companySelect = (contact) => {
    setSelectedCompany(contact);
  };

  const selectedTitleId = form.watch("title");

  return (
    <CardContent className="">
      <h1 className="text-2xl text-center text-gray-700 font-medium mb-2">
        New User Registration
      </h1>
      <p className="text-center text-gray-500 mb-6">
        Please provide your details to register
      </p>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleContactFormSubmit)}
          className="grid gap-3 sm:gap-4 md:gap-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            <FormItem>
              <div className="grid grid-cols-1 gap-2">
                <Label className="text-sm md:text-base">
                  Name <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-start space-x-2">
                  <div className="">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
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
                  </div>
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

            {selectedTitleId != "1" && (
              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-1 gap-2">
                      <Label htmlFor="mobile" className="text-sm md:text-base">
                        Company
                      </Label>
                      <FormControl>
                        <CompanySearch
                          contacts={companyList}
                          onSelect={companySelect}
                          productSearch={false}
                        />
                      </FormControl>
                    </div>
                  </FormItem>
                )}
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            <FormField
              control={form.control}
              name="Email"
              render={({ field }) => (
                <FormItem>
                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="Email" className="text-sm md:text-base">
                      Email{" "}
                      {appConfig?.contact_required_email == "Y" && (
                        <span className="text-red-500">*</span>
                      )}
                    </Label>
                    <FormControl>
                      <Input
                        id="Email"
                        type="email"
                        className="w-full input-focus-style"
                        placeholder="john@example.com"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="text-xs h-2" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem>
                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="mobile" className="text-sm md:text-base">
                      Mobile{" "}
                      {/* {appConfig?.contact_required_mobile_no == "Y" && (
                        <span className="text-red-500">*</span>
                      )} */}
                      <span className="text-red-500">*</span>
                    </Label>
                    <FormControl>
                      <Input
                        id="mobile"
                        className="w-full input-focus-style"
                        placeholder="1234567890"
                        {...field}
                        onChange={handleMobileInput}
                        value={field.value}
                        inputMode="numeric"
                        disabled
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="text-xs h-2" />
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
            name="address"
            render={({ field }) => (
              <FormItem>
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="address" className="text-sm md:text-base">
                    Address{" "}
                    {appConfig?.required_add1 == "Y" && (
                      <span className="text-red-500">*</span>
                    )}
                  </Label>
                  <FormControl>
                    <Textarea
                      id="address"
                      className="w-full input-focus-style"
                      placeholder="123, MG Road"
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage className="text-xs h-2" />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            <FormField
              control={form.control}
              name="area"
              render={({ field }) => (
                <FormItem>
                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="area" className="text-sm md:text-base">
                      Area{" "}
                      {appConfig?.contact_required_area == "Y" && (
                        <span className="text-red-500">*</span>
                      )}
                    </Label>
                    <FormControl>
                      <Input
                        id="area"
                        className="w-full input-focus-style"
                        placeholder="Koramangala"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="text-xs h-2" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pincode"
              render={({ field }) => (
                <FormItem>
                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="pincode" className="text-sm md:text-base">
                      Pincode{" "}
                      {appConfig?.required_pincode == "Y" && (
                        <span className="text-red-500">*</span>
                      )}
                    </Label>
                    <FormControl>
                      <Input
                        id="pincode"
                        className="w-full input-focus-style"
                        placeholder="560001"
                        {...field}
                        onChange={handlePincodeInput}
                        value={field.value}
                        inputMode="numeric"
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="text-xs h-2" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="city" className="text-sm md:text-base">
                      City{" "}
                      {appConfig?.contact_required_city == "Y" && (
                        <span className="text-red-500">*</span>
                      )}
                    </Label>
                    <FormControl>
                      <Input
                        id="city"
                        className="w-full input-focus-style"
                        placeholder="Bangalore"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="text-xs h-2" />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="country" className="text-sm md:text-base">
                      Country <span className="text-red-500">*</span>
                    </Label>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
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
                  </div>
                  <FormMessage className="text-xs h-2" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="state" className="text-sm md:text-base">
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
                  <FormMessage className="text-xs h-2" />
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
              disabled={addContactMutation.isPending}
            >
              {addContactMutation.isPending ? "Registering..." : "Register"}
            </Button>
          </div>
        </form>
      </Form>
    </CardContent>
  );
};

export default NewUserRegistrationForm;
