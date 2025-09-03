"use client";

import React, { useState, useEffect, Component, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import FileUploadCard from "../inputs/FileUploadCard";
import { toast } from "sonner";
import { useLoginStore } from "@/stores/auth.store";
import { useSharedDataStore } from "@/stores/sharedData.store";
import { ContactService } from "@/lib/ContactService";
import { SubordinateForm } from "../forms/SubordinateForm";

// Error Boundary Component
class DialogErrorBoundary extends Component {
  state = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Dialog rendering error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4">
          <p className="text-red-500">
            Error rendering dialog: {this.state.error?.message}
          </p>
          <pre className="text-sm text-gray-500">
            {this.state.errorInfo?.componentStack}
          </pre>
          <Button
            onClick={() =>
              this.setState({ hasError: false, error: null, errorInfo: null })
            }
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

const ContactFollowupForm = ({
  isOpen,
  onClose,
  onFollowupSubmit,
  contact,
}) => {
  const { user, token } = useLoginStore();
  const { myLeadFollowupSettings } = useSharedDataStore();
  const queryClient = useQueryClient();
  const [contactName, setContactName] = useState(contact?.name || "");
  const [subordinateId, setSubordinateId] = useState("");
  const [subordinateName, setSubordinateName] = useState("");
  const [outcomeId, setOutcomeId] = useState("");
  const [followupTypeId, setFollowupTypeId] = useState("");
  const [singleFile, setSingleFile] = useState(null);
  const [followupDate, setFollowupDate] = useState(new Date());
  const [nextActionDate, setNextActionDate] = useState(new Date());
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subordinates, setSubordinates] = useState([]);
  const [isSubordinateSheetOpen, setIsSubordinateSheetOpen] = useState(false);
  const viewFollowupFromDatePickerRef = useRef(null);
  const viewFollowupToDatePickerRef = useRef(null);

  // Function to close date picker
  const closeDatePicker = (ref) => {
    if (ref.current) {
      ref.current.setOpen(false);
    }
  };

  // Set default "Visit" for Type of Follow-up
  useEffect(() => {
    if (myLeadFollowupSettings?.lead_followups?.length) {
      const visitFollowup = myLeadFollowupSettings.lead_followups.find(
        (followup) =>
          followup.LeadFollowupType.followup_type.toLowerCase() === "visit"
      );
      if (visitFollowup) {
        setFollowupTypeId(visitFollowup.LeadFollowupType.lft_id);
      }
    }
  }, [myLeadFollowupSettings]);

  const {
    data: subordinatesData,
    isPending,
    isFetching,
    error: subordinatesError,
    isError,
  } = useQuery({
    queryKey: ["subordinates", token, contact?.id, contact?.contactType],
    queryFn: async () => {
      // Handle type conversion (RC → 6, C → 1, others pass through)
      const getProcessedContactType = () => {
        const contactType = contact?.type || contact?.contactType;
        if (contactType == "1" || contactType == "6") return contactType;
        if (contactType == "RC") return "6";
        if (contactType == "C") return "1";
        return contactType;
      };

      const processedContactType = getProcessedContactType();

      // Timeout after 10 seconds
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out")), 10000)
      );

      try {
        const response = await Promise.race([
          ContactService.getSubordinates(
            token,
            contact?.id,
            processedContactType // Use the processed contact type
          ),
          timeout,
        ]);
        return response;
      } catch (error) {
        console.error("Subordinates fetch error:", error);
        throw error;
      }
    },
    enabled: isOpen && !!token && !!contact?.id && !!contact?.contactType,
    refetchOnMount: "always",
    staleTime: 0, // Mark data as stale immediately
    cacheTime: 0, // Disable caching (use gcTime: 0 for React Query v5)
  });

  // Process Subordinates
  useEffect(() => {
    if (subordinatesData) {
      const responseData = Array.isArray(subordinatesData)
        ? subordinatesData[0]
        : subordinatesData;
      if (responseData?.STATUS === "SUCCESS") {
        setSubordinates(responseData.DATA || []);
      } else {
        toast.error(responseData?.MSG || "Failed to fetch subordinates");
        setSubordinates([]);
      }
    }
    if (isError) {
      toast.error("Error fetching subordinates: " + subordinatesError.message);
      setSubordinates([]);
      onClose();
    }
  }, [subordinatesData, isError, subordinatesError, onClose]);

  // Mutation for adding a subordinate
  const addSubordinateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await ContactService.addSubordinate(
        token,
        data.parent_contact_id,
        data.parent_contact_type,
        {
          subordinate_title: data.subordinate_title,
          subordinate_name: data.subordinate_name,
          subordinate_email: data.subordinate_email,
          subordinate_mobile: data.subordinate_mobile,
        }
      );
      return response;
    },
    onSuccess: async (response) => {
      const responseData = Array.isArray(response) ? response[0] : response;
      if (responseData?.STATUS === "SUCCESS") {
        toast.success("Subordinate added successfully!",{
            duration: 2000,
          });
        setIsSubordinateSheetOpen(false);
        // Add the new subordinate to the list
        const newSubordinate = {
          subordinate_id: responseData.DATA.subordinate_id,
          contact_id: responseData.DATA.contact_id,
          name: responseData.DATA.name,
        };
        setSubordinates((prevSubordinates) => [
          ...prevSubordinates,
          newSubordinate,
        ]);
        // Set the newly added subordinate as the selected option
        setSubordinateId(responseData.DATA.subordinate_id);
        setSubordinateName(responseData.DATA.name);
      } else {
        throw new Error(responseData?.MSG || "Failed to add subordinate");
      }
    },
    onError: (error) => {
      toast.error("Failed to add subordinate: " + error.message);
    },
  });

  const handleSubordinateChange = (value) => {
    // Only proceed if we have a valid value and subordinates are loaded
    if (value && subordinates?.length) {
      const selectedSubordinate = subordinates.find(
        (sub) => sub.subordinate_id == value
      );
      if (selectedSubordinate) {
        setSubordinateId(value);
        setSubordinateName(selectedSubordinate.name);
      }
    }
  };

  const handleAddSubordinate = (data) => {
    addSubordinateMutation.mutate(data);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!contact?.id) {
      toast.error("Please select a contact.");
      return;
    }
    if (!outcomeId) {
      toast.error("Please select an outcome.");
      return;
    }
    if (!followupTypeId) {
      toast.error("Please select a follow-up type.");
      return;
    }
    if (!followupDate) {
      toast.error("Please select a follow-up date.");
      return;
    }
    if (!nextActionDate) {
      toast.error("Please select a next action date.");
      return;
    }
    if (!description) {
      toast.error("Please provide a description.");
      return;
    }

    setIsSubmitting(true);
    const followupData = {
      contactId: contact.id,
      contactType: contact.contactType === "C" ? "1" : "6",
      outcomeId,
      followupTypeId,
      description,
      subordinateId,
      subordinateName,
      followupDate,
      nextActionDate,
      singleFile,
    };

    onFollowupSubmit(followupData).finally(() => {
      setIsSubmitting(false);
    });
  };

  return (
    <DialogErrorBoundary>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[90vw] max-w-[425px] md:w-full md:max-w-[600px] lg:max-w-[800px] max-h-[90vh] overflow-y-auto bg-white p-4 sm:p-6 rounded-lg">
          <DialogHeader className="text-left">
            <DialogTitle className="text-lg sm:text-xl font-semibold">
              Add Contact Followup
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Field */}
              <div>
                <Label htmlFor="contact" className="text-sm font-medium">
                  Contact <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contact"
                  value={contactName}
                  disabled
                  className="mt-1"
                  placeholder="Contact name"
                />
              </div>

              {/* Subordinate Field */}
              <div>
                <Label htmlFor="subordinate" className="text-sm font-medium">
                  Subordinate
                </Label>
                <div className="flex items-center">
                  <div className="relative flex-1">
                    <Select
                      value={subordinateId || ""}
                      onValueChange={handleSubordinateChange}
                      className="mt-1"
                      disabled={!subordinates?.length}
                    >
                      <SelectTrigger id="subordinate">
                        <SelectValue placeholder="Select Subordinate" />
                      </SelectTrigger>
                      <SelectContent>
                        {subordinates?.map((sub) => (
                          <SelectItem
                            key={sub.subordinate_id}
                            value={sub.subordinate_id}
                          >
                            {sub.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="h-9 px-4 ml-0 rounded-l-none bg-[#287f71] hover:bg-[#1e6a5e] text-white"
                    type="button"
                    onClick={() => setIsSubordinateSheetOpen(true)}
                  >
                    Add
                  </Button>
                </div>
                {!subordinates?.length && !isPending && !isFetching && (
                  <p className="text-sm text-yellow-600">
                    No subordinates available.
                  </p>
                )}
              </div>

              {/* Outcome Field */}
              <div>
                <Label htmlFor="outcome" className="text-sm font-medium">
                  Outcome <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={outcomeId}
                  onValueChange={setOutcomeId}
                  className="mt-1"
                  disabled={!myLeadFollowupSettings?.lead_outcomes?.length}
                >
                  <SelectTrigger id="outcome">
                    <SelectValue placeholder="Select Outcome" />
                  </SelectTrigger>
                  <SelectContent>
                    {myLeadFollowupSettings?.lead_outcomes?.map((outcome) => (
                      <SelectItem
                        key={outcome.LeadOutcome.outcome_id}
                        value={outcome.LeadOutcome.outcome_id}
                      >
                        {outcome.LeadOutcome.outcome_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type of Follow-up Field */}
              <div>
                <Label className="text-sm font-medium">
                  Type of Follow-up <span className="text-red-500">*</span>
                </Label>
                <RadioGroup
                  value={followupTypeId}
                  onValueChange={setFollowupTypeId}
                  className="mt-1 flex flex-row flex-wrap gap-2"
                  disabled={!myLeadFollowupSettings?.lead_followups?.length}
                >
                  {myLeadFollowupSettings?.lead_followups?.map((followup) => (
                    <div
                      key={followup.LeadFollowupType.lft_id}
                      className="flex items-center space-x-2"
                    >
                      <RadioGroupItem
                        value={followup.LeadFollowupType.lft_id}
                        id={`followup-${followup.LeadFollowupType.lft_id}`}
                      />
                      <Label
                        htmlFor={`followup-${followup.LeadFollowupType.lft_id}`}
                      >
                        {followup.LeadFollowupType.followup_type}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Followup Taken Date */}
              <div>
                <Label htmlFor="followup-date" className="text-sm font-medium">
                  Followup Taken Date <span className="text-red-500">*</span>
                </Label>
                <DatePicker
                  ref={viewFollowupFromDatePickerRef}
                  selected={followupDate}
                  onChange={(date) => setFollowupDate(date)}
                  showTimeSelect
                  isClearable={!!followupDate}
                  showIcon
                  toggleCalendarOnIconClick
                  timeFormat="hh:mm aa"
                  timeIntervals={5}
                  timeCaption="Time"
                  dateFormat="dd-MM-yyyy hh:mm aa"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  wrapperClassName="w-full followup-datepicker"
                  onSelect={() =>
                    closeDatePicker(viewFollowupFromDatePickerRef)
                  }
                  shouldCloseOnSelect={false}
                />
              </div>

              {/* Next Action Date */}
              <div>
                <Label
                  htmlFor="next-action-date"
                  className="text-sm font-medium"
                >
                  Next Action Date <span className="text-red-500">*</span>
                </Label>
                <DatePicker
                  ref={viewFollowupToDatePickerRef}
                  selected={nextActionDate}
                  onChange={(date) => setNextActionDate(date)}
                  showTimeSelect
                  isClearable={!!nextActionDate}
                  showIcon
                  toggleCalendarOnIconClick
                  timeFormat="hh:mm aa"
                  timeIntervals={5}
                  timeCaption="Time"
                  dateFormat="dd-MM-yyyy hh:mm aa"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  wrapperClassName="w-full followup-datepicker"
                  onSelect={() => closeDatePicker(viewFollowupToDatePickerRef)}
                  shouldCloseOnSelect={false}
                />
              </div>

              {/* File Attachment */}
              <div>
                <Label className="text-sm font-medium">File Attachment</Label>
                <FileUploadCard
                  title="Upload Single File"
                  description="(Allow only JPG, PNG, JPEG, or PDF file.)"
                  onFilesSelected={(files) => setSingleFile(files[0])}
                  allowedTypes={["jpg", "png", "jpeg", "pdf"]}
                  className="h-full"
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add Description"
                  className="mt-1"
                  rows={4}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 py-4 pl-4">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  isPending ||
                  isFetching ||
                  !myLeadFollowupSettings?.lead_outcomes?.length ||
                  !myLeadFollowupSettings?.lead_followups?.length
                }
                className="bg-[#287f71] hover:bg-[#20665a] text-white text-sm sm:text-base px-4 py-2"
              >
                {isSubmitting ? "Submitting..." : "Add Followup"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Subordinate Sheet */}
      <Sheet
        open={isSubordinateSheetOpen}
        onOpenChange={setIsSubordinateSheetOpen}
      >
        <SheetContent className="w-[90vw] max-w-[425px] md:max-w-[600px] lg:max-w-[400px] max-h-[100vh] overflow-y-auto bg-white p-4 sm:p-6">
          <SheetHeader className="text-left mb-3">
            <SheetTitle className="text-lg sm:text-xl font-semibold">
              Add New Subordinate
            </SheetTitle>
          </SheetHeader>
          <SubordinateForm
            onAddSubordinateSubmit={handleAddSubordinate}
            onCancel={() => setIsSubordinateSheetOpen(false)}
            selectedContact={contact}
            addSubordinateMutation={addSubordinateMutation}
          />
        </SheetContent>
      </Sheet>
    </DialogErrorBoundary>
  );
};

export default ContactFollowupForm;
