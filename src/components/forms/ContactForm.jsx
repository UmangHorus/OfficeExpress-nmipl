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
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useLoginStore } from "@/stores/auth.store";
import { leadService } from "@/lib/leadService";
import { useEffect, useState } from "react";
import { CompanySearch } from "../inputs/search";
import useBasicSettingsStore from "@/stores/basicSettings.store";
import { useSharedDataStore } from "@/stores/sharedData.store";
import { toast } from "sonner";
import { createContactFormSchema } from "@/validation/contact-form.schema";
import MapWithAutocomplete from "../maps/MapWithAutocomplete";
import { MultiSelect } from "../shared/MultiSelect";

export const ContactForm = ({
  onAddContactSubmit,
  onCancel,
  contact,
  isSaveContact,
}) => {
  const { token, appConfig } = useLoginStore();
  const { countries, titles, setLoading, setError } = useBasicSettingsStore();
  const { companyBranchDivisionData, routeList } = useSharedDataStore();
  const contactLabel = useLoginStore(
    (state) => state.navConfig?.labels?.contacts || "Contact"
  );
  const [companyList, setCompanyList] = useState([]);
  const [stateList, setStateList] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [inputValue, setInputValue] = useState("");

  const form = useForm({
    resolver: zodResolver(createContactFormSchema(appConfig)),
    defaultValues: contact
      ? {
          title: contact.contact_title || "2", // Default to "Mr." if not provided
          name: contact.name.split(" (")[0] || "", // Extract name without type
          routes:
            contact.route_values?.map((route) => route.RouteMaster.route_id) ||
            [],
          Email: contact.email || "",
          mobile: contact.mobile || "",
          address: contact.address1 || "",
          area: contact.area || "",
          pincode: contact.zipcode || "",
          city: contact.city || "",
          industry:
            contact.industries_id ||
            companyBranchDivisionData?.industries?.[0]?.industry_id ||
            "",
          country: contact.country || "India",
          state: contact.state || "GUJARAT",
        }
      : {
          title: "2", // Default to "Mr." (ID: "2")
          name: "",
          routes: [],
          Email: "",
          mobile: "",
          address: "",
          area: "",
          pincode: "",
          city: "",
          industry:
            companyBranchDivisionData?.industries?.[0]?.industry_id || "",
          country: "India",
          state: "GUJARAT",
        },
    mode: "onChange",
  });

  useEffect(() => {
    if (companyBranchDivisionData?.industries?.length > 0 && !contact) {
      form.setValue(
        "industry",
        companyBranchDivisionData.industries[0].industry_id,
        {
          shouldValidate: true,
        }
      );
    }
  }, [companyBranchDivisionData, form, contact]);

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
        if (contact && contact.name.includes("(RC)")) {
          const company = responseData.DATA.contacts.find(
            (c) => c.title === contact.name.split(" (")[0]
          );
          if (company) {
            setSelectedCompany(company);
            setInputValue(company.title);
          }
        }
      } else {
        console.error(responseData?.MSG || "Invalid contact response data");
        setCompanyList([]);
      }
    }
  }, [companyData, contact]);

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
          if (gujarat && !contact) {
            form.setValue("state", gujarat.state_name, {
              shouldValidate: true,
            });
          } else if (contact && contact.state) {
            form.setValue("state", contact.state, {
              shouldValidate: true,
            });
          }
        }
      } else {
        console.error(responseData?.MSG || "Invalid state response data");
        setStateList([]);
      }
    }
  }, [stateData, form, contact]);

  const handleContactFormSubmit = (values) => {
    const formData = {
      ...values,
      routes: values.routes || [],
    };
    if (contact) {
      onAddContactSubmit(
        formData,
        selectedCompany,
        inputValue,
        contact.id,
        contact.contact_type,
        contact.address_id
      );
    } else {
      onAddContactSubmit(formData, selectedCompany, inputValue);
    }
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
    setInputValue(contact ? contact.title : "");
  };

  const handleInputChange = (value) => {
    setInputValue(value);
    if (!value) {
      setSelectedCompany(null);
    }
  };

  const selectedTitleId = form.watch("title");

  return (
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
                    render={({ field, fieldState }) => (
                      <>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={!!contact} // Disable in edit mode
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
                    render={({ field, fieldState }) => (
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

          {!contact && selectedTitleId != "1" && (
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
                        onInputChange={handleInputChange}
                        productSearch={false}
                        selectedItem={selectedCompany}
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
                    Mobile <span className="text-red-500">*</span>
                  </Label>
                  <FormControl>
                    <Input
                      id="mobile"
                      className="w-full input-focus-style"
                      placeholder="1234567890"
                      {...field}
                      onChange={contact ? undefined : handleMobileInput} // Disable onChange in edit mode
                      value={field.value}
                      inputMode="numeric"
                      disabled={!!contact} // Disable input in edit mode
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
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

          <MultiSelect
            control={form.control}
            name="routes"
            label="Route"
            required={false}
            options={routeList}
            valueKey="route_id"
            labelKey="name"
          />
        </div>

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
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
                        {countries
                          .filter(
                            (country) => country.Country.country_name == "India"
                          )
                          .map((country) => (
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

          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem>
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="industry" className="text-sm md:text-base">
                    Industry
                  </Label>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full input-focus-style">
                        <SelectValue placeholder="Select an Industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {companyBranchDivisionData?.industries?.map(
                          (industry) => (
                            <SelectItem
                              key={industry.industry_id}
                              value={industry.industry_id}
                            >
                              {industry.industry_name}
                            </SelectItem>
                          )
                        )}
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
            disabled={isSaveContact} // Disable button during API call
          >
            {contact ? `Update ${contactLabel}` : `Save ${contactLabel}`}
          </Button>
        </div>
      </form>
    </Form>
  );
};
