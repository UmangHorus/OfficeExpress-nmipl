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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLoginStore } from "@/stores/auth.store";
import { toast } from "sonner";
import { z } from "zod";
import { ContactService } from "@/lib/ContactService";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSubordinateFormSchema } from "@/validation/subordinate-form.schema";
import useBasicSettingsStore from "@/stores/basicSettings.store";

export const SubordinateForm = ({
  onAddSubordinateSubmit,
  onCancel,
  selectedContact,
  addSubordinateMutation,
}) => {
  const { token, appConfig } = useLoginStore();
  const { titles } = useBasicSettingsStore();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(createSubordinateFormSchema(appConfig)),
    defaultValues: {
      title: "2", // Default to "Mr."
      name: "",
      Email: "",
      mobile: "",
    },
    mode: "onChange",
  });

  const handleSubordinateFormSubmit = async (values) => {
  try {
    // Get the type from either type or contactType property
    const contactType = selectedContact?.type || selectedContact?.contactType;
    
    // Determine parent_contact_type based on the rules
    let parentContactType;
    if (contactType == '1' || contactType == '6') {
      // Pass through as-is if already 1 or 6
      parentContactType = contactType;
    } else if (contactType == 'RC') {
      // Convert RC to 6
      parentContactType = '6';
    } else if (contactType == 'C') {
      // Convert C to 1
      parentContactType = '1';
    } else {
      // Fallback to original type if none of the above
      parentContactType = contactType;
    }

    const subordinateData = {
      subordinate_title: values.title,
      subordinate_name: values.name,
      subordinate_email: values.Email,
      subordinate_mobile: values.mobile,
      parent_contact_id: selectedContact?.id,
      parent_contact_type: parentContactType,
    };

    await onAddSubordinateSubmit(subordinateData);
    form.reset();
  } catch (error) {
    toast.error("Failed to add subordinate: " + error.message);
  }
};

  const handleMobileInput = async (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    form.setValue("mobile", value, { shouldValidate: true });
    await form.trigger("mobile");
  };

  const handleNameInput = async (e) => {
    const value = e.target.value.replace(/[^A-Za-z\s]/g, "");
    form.setValue("name", value, { shouldValidate: true });
    await form.trigger("name");
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubordinateFormSubmit)}
        className="grid gap-3 sm:gap-4 md:gap-6"
      >
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6">
          <FormItem>
            <div className="grid grid-cols-1 gap-2">
              <Label className="text-sm md:text-base">
                Name <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-start space-x-2">
                <div>
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
                              {titles
                                .filter((title) => title.ID != "1") // Exclude ID: "1" (M/S)
                                .map((title) => (
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
                            placeholder="Subordinate Name"
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
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-[#287f71] hover:bg-[#20665a] text-white text-sm sm:text-base"
            disabled={addSubordinateMutation.isPending}
          >
            Save Subordinate
          </Button>
        </div>
      </form>
    </Form>
  );
};
