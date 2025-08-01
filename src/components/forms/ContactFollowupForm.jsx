"use client";

import { useEffect, useState, useCallback } from "react";
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
import MapWithAutocomplete from "../maps/MapWithAutocomplete";
import axios from "axios";
import toast from "react-hot-toast";
import api from "@/lib/api/axios";
import { useLoginStore } from "@/stores/auth.store";
import { createContactFormSchema } from "@/validation/contact-form.schema";

export const ContactFollowupForm = ({
  onAddContactSubmit,
  handleAddContactSubmit,
  onCancel,
  user,
  token,
}) => {
  const [titles, setTitles] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isStateLoading, setIsStateLoading] = useState(false);
  const [stateError, setStateError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [isSuggestionSelected, setIsSuggestionSelected] = useState(false);

  const AUTHORIZE_KEY = process.env.NEXT_PUBLIC_API_AUTH_KEY || "";

  const contactLabel = useLoginStore(
    (state) => state.navConfig?.labels?.contacts || "Contact"
  );

  // Initialize form
  const form = useForm({
    resolver: zodResolver(createContactFormSchema),
    defaultValues: {
      title: "2", // Set after titles load
      name: "",
      subordinate: "",
      Email: "",
      mobile: "",
      address: "",
      area: "",
      pincode: "",
      city: "",
      industry: "",
      country: "IN", // Auto-select India
      state: "24",
    },
    mode: "onChange",
  });

  // Fetch basic settings (titles, industries, countries) on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.post("/expo_access_api/getBasicSettings", {
          type: "2",
          AUTHORIZEKEY: AUTHORIZE_KEY,
        });

        // For Axios, the data is in response.data
        const data = response.data;

        // Check if the first item in the data array has STATUS: "SUCCESS"
        if (data[0]?.STATUS !== "SUCCESS") {
          throw new Error(data[0]?.MSG || "API returned an error");
        }

        const settings = data[0]?.DATA || {};

        // Filter countries to only include India
        const mappedCountries = (settings.country || [])
          .filter((item) => item.Country.country_name === "India")
          .map((item) => ({
            ID: item.Country.country_code,
            Name: item.Country.country_name,
          }));

        setTitles(settings.titles_data || []);
        setIndustries(settings.industry || []);
        setCountries(mappedCountries);

        // Auto-select India if available
        if (mappedCountries.length > 0) {
          form.setValue("country", mappedCountries[0].ID, {
            shouldValidate: true,
          });
        }

        // Auto-select title ID=2 if available, else first title
        if (settings.titles_data?.length > 0) {
          const defaultTitle =
            settings.titles_data.find((t) => t.ID === "2") ||
            settings.titles_data[0];
          form.setValue("title", defaultTitle?.ID || "", {
            shouldValidate: true,
          });
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [form]);

  // Fetch states when country changes
  const fetchStates = async (countryName) => {
    if (!countryName) {
      setStates([]);
      form.setValue("state", "", { shouldValidate: true });
      return;
    }

    setIsStateLoading(true);
    setStateError(null);
    try {
      const response = await api.post("/expo_access_api/getstatelist", {
        COUNTRY: countryName,
        AUTHORIZEKEY: AUTHORIZE_KEY,
      });

      const data = response.data;

      if (!Array.isArray(data) || !data[0]) {
        throw new Error("Invalid response format: No data returned");
      }

      if (data[0].STATUS !== "SUCCESS") {
        throw new Error(data[0].MSG || "State API returned an error");
      }

      const stateList = Array.isArray(data[0].DATA?.state)
        ? data[0].DATA.state
        : [];
      // Map states to match expected format
      const mappedStates = stateList
        .filter((item) => item?.State?.state_code && item?.State?.state_name)
        .map((item) => ({
          ID: item.State.state_code,
          Name: item.State.state_name,
        }));

      setStates(mappedStates);

      // Auto-select Gujarat if India is selected
      if (countryName === "India") {
        const gujarat = mappedStates.find(
          (state) => state.ID === "24" || state.Name.toUpperCase() === "GUJARAT"
        );
        if (gujarat) {
          form.setValue("state", gujarat.ID, { shouldValidate: true });
        } else {
          console.warn("Gujarat not found in state list");
          form.setValue("state", mappedStates[0]?.ID || "", {
            shouldValidate: true,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching states:", {
        message: error.message,
        response: error.response?.data,
      });
      setStateError(error.message);
      setStates([]);
      form.setValue("state", "", { shouldValidate: true });
      toast.error("Failed to load states.");
    } finally {
      setIsStateLoading(false);
    }
  };

  // Watch country and title fields
  const selectedCountry = form.watch("country");
  const selectedTitle = form.watch("title");
  const subordinateValue = form.watch("subordinate");

  // Fetch states when country changes
  useEffect(() => {
    if (selectedCountry) {
      const country = countries.find((c) => c.ID === selectedCountry);
      const countryName = country?.Name || "";
      fetchStates(countryName);
      if (countryName !== "India") {
        form.setValue("state", "", { shouldValidate: true });
      }
    } else {
      setStates([]);
      form.setValue("state", "", { shouldValidate: true });
    }
  }, [selectedCountry, countries, form]);

  // Fetch contact suggestions for subordinate autocomplete
  const fetchContactSuggestions = useCallback(
    async (searchTerm) => {
      if (!searchTerm || searchTerm.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        setIsSuggestionSelected(false);
        return;
      }

      setIsFetchingSuggestions(true);
      try {
        const response = await api.post(
          "/expo_access_api/getContactRawcontactAutoComplete",
          {
            AUTHORIZEKEY: AUTHORIZE_KEY,
            PHPTOKEN: token,
            created_by: user?.id || "",
            search: "1",
            name: searchTerm,
            distributed_in_company: "",
          }
        );

        const result = response.data[0] || {};
        const { STATUS, DATA, MSG } = result;

        if (STATUS === "SUCCESS" && DATA?.contacts) {
          const mappedSuggestions = DATA.contacts.map((contact) => ({
            id: contact.id,
            name: contact.title,
            type: contact.typeShortLabel,
            mobile: contact.mobile,
            email: contact.Email,
            creditlimit_days: contact.creditlimit_days,
          }));
          const filteredSuggestions = mappedSuggestions.filter((suggestion) =>
            suggestion.name.toLowerCase().includes(searchTerm.toLowerCase())
          );
          setSuggestions(filteredSuggestions);
          if (!isSuggestionSelected) {
            setShowSuggestions(filteredSuggestions.length > 0);
          }
        } else {
          setSuggestions([]);
          if (!isSuggestionSelected) {
            setShowSuggestions(false);
          }
          toast.error(MSG || "No contacts found", {
            position: "top-right",
            autoClose: 3000,
            theme: "colored",
          });
        }
      } catch (err) {
        console.error("Fetch Suggestions Error:", err);
        setSuggestions([]);
        if (!isSuggestionSelected) {
          setShowSuggestions(false);
        }
        toast.error("Failed to fetch contact suggestions", {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        });
      } finally {
        setIsFetchingSuggestions(false);
      }
    },
    [user?.id, token, isSuggestionSelected]
  );

  // Debounce API calls for subordinate suggestions
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (selectedTitle && selectedTitle !== "1" && !isSuggestionSelected) {
        fetchContactSuggestions(subordinateValue);
      }
    }, 300);
    return () => clearTimeout(debounceTimeout);
  }, [
    subordinateValue,
    selectedTitle,
    fetchContactSuggestions,
    isSuggestionSelected,
  ]);

  const handleContactFormSubmit = async (values) => {
    // Validate required fields
    if (!values.name || !values.mobile) {
      toast.error("Name and mobile are required", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
      return;
    }

    try {
      // Map state_code to state_name
      const selectedState = states.find((state) => state.ID === values.state);
      const stateName = selectedState ? selectedState.Name : "";

      if (!stateName) {
        toast.error("State is not selected or unavailable", {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        });
        return;
      }

      const payload = {
        contact: {
          email: values.Email || "",
          contact_title: values.title || "2",
          name: values.name || "",
          created_by: user?.id || "1",
          mobile: values.mobile || "",
          industry_id: values.industry || "",
          country_isd: "91", // Hardcoded for India
          gstnumber: "", // Not in form
          address1: values.address || "",
          address2: "", // Not in form
          area: values.area || "",
          city: values.city || "",
          state: stateName || "",
          country: "India", // Hardcoded for India
          zipcode: values.pincode || "",
          company_name: values.subordinate || "",
        },
        AUTHORIZEKEY: AUTHORIZE_KEY,
        // PHPTOKEN: token, // Commented out to test without it
      };

      const response = await api.post("/ecommerce_api/saveRawContact", payload);

      const result = response.data[0] || {};
      const { STATUS, MSG, DATA } = result;

      if (STATUS === "SUCCESS") {
        toast.success("Contact saved successfully!", {
          position: "top-right",
          autoClose: 2000,
          theme: "colored",
        });
        onAddContactSubmit({ ...values, contact_id: DATA });
        //handleAddContactSubmit({ ...values, contact_id: DATA });
        form.reset(); // Reset form after successful submission
      } else {
        console.error("API Error:", MSG);
        toast.error(MSG || "Failed to save contact", {
          position: "top-right",
          autoClose: 2000,
          theme: "colored",
        });
      }
    } catch (err) {
      console.error("Save Contact Error:", err);
      console.error("Error Response:", err.response?.data);
      toast.error(
        "Failed to save contact: " +
          (err.response?.data?.[0]?.MSG || err.message),
        {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        }
      );
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

  const handleSubordinateInput = (e) => {
    const value = e.target.value;
    form.setValue("subordinate", value, { shouldValidate: true });
    setIsSuggestionSelected(false);
  };

  const handleAddressChange = (addressData) => {
    form.setValue("address", addressData.address || "", {
      shouldValidate: true,
    });
    form.setValue("area", addressData.area || "", { shouldValidate: true });
    form.setValue("city", addressData.city || "", { shouldValidate: true });
    form.setValue("state", addressData.state || "", { shouldValidate: true });
    form.setValue("country", addressData.country || "IN", {
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
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleContactFormSubmit)}
        className="grid gap-3 sm:gap-4 md:gap-6"
      >
        {/* Loading and Error States */}
        {isLoading && <p className="text-blue-500">Loading settings...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}

        {/* Title, Name, and Subordinate Fields */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-start space-x-2">
                    <div className="grid grid-cols-1 gap-2">
                      <Label
                        htmlFor="contactTitle"
                        className="text-sm md:text-base"
                      >
                        Title <span className="text-red-500">*</span>
                      </Label>
                      <FormControl>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Reset subordinate when title changes
                            form.setValue("subordinate", "", {
                              shouldValidate: true,
                            });
                            setSuggestions([]);
                            setShowSuggestions(false);
                            setIsSuggestionSelected(false);
                          }}
                          value={field.value}
                        >
                          <SelectTrigger className="w-[80px] input-focus-style">
                            <SelectValue
                              placeholder={
                                isLoading
                                  ? "Loading..."
                                  : titles.length === 0
                                  ? "No titles available"
                                  : "Select a Title"
                              }
                            />
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
                    </div>
                    <div className="flex-1 grid grid-cols-1 gap-2">
                      <Label
                        htmlFor="contactName"
                        className="text-sm md:text-base"
                      >
                        Name <span className="text-red-500">*</span>
                      </Label>
                      <FormControl>
                        <Input
                          id="contactName"
                          className="w-full input-focus-style"
                          placeholder="Enter name"
                          {...form.register("name")}
                          onChange={handleNameInput}
                        />
                      </FormControl>
                    </div>
                  </div>
                </div>
                {selectedTitle && selectedTitle !== "1" && (
                  <div className="grid grid-cols-1 gap-2">
                    <Label
                      htmlFor="subordinate"
                      className="text-sm md:text-base"
                    >
                      Search Company
                    </Label>
                    <div className="relative">
                      <FormControl>
                        <Input
                          id="subordinate"
                          className="w-full input-focus-style"
                          placeholder="Search company"
                          {...form.register("subordinate")}
                          onChange={handleSubordinateInput}
                          onFocus={() => {
                            if (subordinateValue && !isSuggestionSelected) {
                              fetchContactSuggestions(subordinateValue);
                            }
                          }}
                          onBlur={() => {
                            setTimeout(() => setShowSuggestions(false), 200);
                          }}
                          autoComplete="off"
                        />
                      </FormControl>
                      {showSuggestions && (
                        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
                          {isFetchingSuggestions ? (
                            <li className="px-4 py-2 text-gray-500">
                              Loading...
                            </li>
                          ) : suggestions.length > 0 ? (
                            suggestions.map((suggestion) => (
                              <li
                                key={suggestion.id}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                                onClick={() => {
                                  form.setValue(
                                    "subordinate",
                                    `${suggestion.name} (${suggestion.type})`,
                                    { shouldValidate: true }
                                  );
                                  setShowSuggestions(false);
                                  setIsSuggestionSelected(true);
                                }}
                                onMouseDown={(e) => e.preventDefault()}
                              >
                                <span>
                                  {suggestion.name} ({suggestion.type})
                                </span>
                                <span className="text-sm text-gray-500">
                                  {suggestion.mobile || suggestion.email}
                                </span>
                              </li>
                            ))
                          ) : (
                            <li className="px-4 py-2 text-gray-500">
                              No results
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <FormMessage className="text-xs h-2" />
            </FormItem>
          )}
        />

        {/* Email and Mobile Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
          <FormField
            control={form.control}
            name="Email"
            render={({ field }) => (
              <FormItem>
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="Email" className="text-sm md:text-base">
                    Email <span className="text-red-500">*</span>
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
                      onChange={handleMobileInput}
                      value={field.value}
                      inputMode="numeric"
                    />
                  </FormControl>
                </div>
                <FormMessage className="text-xs h-2" />
              </FormItem>
            )}
          />
        </div>

        {/* Google Maps Autocomplete */}
        <div>
          <MapWithAutocomplete
            setValue={form.setValue}
            onAddressChange={handleAddressChange}
          />
        </div>

        {/* Address Field */}
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="address" className="text-sm md:text-base">
                  Address
                </Label>
                <FormControl>
                  <Textarea
                    id="address"
                    className="w-full input-focus-style"
                    placeholder="123, MG Road, Bangalore, Karnataka, 560001"
                    {...field}
                  />
                </FormControl>
              </div>
              <FormMessage className="text-xs h-2" />
            </FormItem>
          )}
        />

        {/* Area, Pincode, and City Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <FormField
            control={form.control}
            name="area"
            render={({ field }) => (
              <FormItem>
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="area" className="text-sm md:text-base">
                    Area <span className="text-red-500">*</span>
                  </Label>
                  <FormControl>
                    <Input
                      id="area"
                      className="w-full input-focus-style"
                      placeholder="Koramangala, Andheri East, etc."
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
                    Pincode <span className="text-red-500">*</span>
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
                    City <span className="text-red-500">*</span>
                  </Label>
                  <FormControl>
                    <Input
                      id="city"
                      className="w-full input-focus-style"
                      placeholder="Mumbai, Delhi, Bangalore"
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage className="text-xs h-2" />
              </FormItem>
            )}
          />
        </div>

        {/* Country, State, and Industry Fields */}
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
                      disabled={countries.length <= 1}
                    >
                      <SelectTrigger className="w-full input-focus-style">
                        <SelectValue placeholder="Select a Country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.ID} value={country.ID}>
                            {country.Name}
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
                      defaultValue={field.value}
                      disabled={isStateLoading || !selectedCountry}
                    >
                      <SelectTrigger className="w-full input-focus-style">
                        <SelectValue
                          placeholder={
                            isStateLoading
                              ? "Loading..."
                              : states.length === 0
                              ? "No states available"
                              : "Select a State"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state.ID} value={state.ID}>
                            {state.Name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </div>
                {stateError && (
                  <p className="text-red-500 text-xs">{stateError}</p>
                )}
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
                    Industry <span className="text-red-500">*</span>
                  </Label>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="w-full input-focus-style">
                        <SelectValue placeholder="Select an Industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map((industry) => (
                          <SelectItem key={industry.ID} value={industry.ID}>
                            {industry.Name}
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

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">{`Save  ${contactLabel}`}</Button>
        </div>
      </form>
    </Form>
  );
};
