"use client";

import React, { useState, useEffect, useRef, Component } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { ContactSearch } from "../inputs/search";
import { ContactForm } from "./ContactForm";
import { Modal } from "../shared/Modal";
import { leadService } from "@/lib/leadService";
import { ContactService } from "@/lib/ContactService";
import { SubordinateForm } from "./SubordinateForm";

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
            Error rendering sheet: {this.state.error?.message}
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

const AddFollowupForm = ({ isOpen, onClose, onFollowupSubmit }) => {
  const { user, token, location } = useLoginStore();
  const {
    companyBranchDivisionData,
    setCompanyBranchDivisionData,
    myLeadFollowupSettings,
  } = useSharedDataStore();
  const queryClient = useQueryClient();
  const contactLabel = useLoginStore(
    (state) => state.navConfig?.labels?.contacts || "Contact"
  );
  const [subordinateId, setSubordinateId] = useState("");
  const [subordinateName, setSubordinateName] = useState("");
  const [newlyAddedSubordinateId, setNewlyAddedSubordinateId] = useState(null);
  const [outcomeId, setOutcomeId] = useState("");
  const [followupTypeId, setFollowupTypeId] = useState("");
  const [singleFile, setSingleFile] = useState(null);
  const [followupDate, setFollowupDate] = useState(new Date());
  const [nextActionDate, setNextActionDate] = useState(new Date());
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subordinates, setSubordinates] = useState([]);
  const [contactList, setContactList] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isSubordinateModalOpen, setIsSubordinateModalOpen] = useState(false);
  const [pendingContactDetails, setPendingContactDetails] = useState(null);
  const [isSaveContact, setIsSaveContact] = useState(false); // New state for button disable

  const viewFollowupFromDatePickerRef = useRef(null);
  const viewFollowupToDatePickerRef = useRef(null);

  // Show Add button conditionally (e.g., if ContactSearch is enabled)
  const showAddButton = true; // Adjust based on your logic, e.g., if ContactSearch is available

  // Close date picker
  const closeDatePicker = (ref) => {
    if (ref.current) {
      ref.current.setOpen(false);
    }
  };

  // Fetch contact data
  const {
    data: contactData,
    error: contactError,
    isLoading: contactLoading,
  } = useQuery({
    queryKey: ["contactList", token],
    queryFn: () => leadService.getContactRawcontactAutoComplete(token),
    enabled: !!token,
    refetchOnMount: "always",
  });

  useEffect(() => {
    if (contactData) {
      const responseData = Array.isArray(contactData)
        ? contactData[0]
        : contactData;
      if (
        responseData?.STATUS === "SUCCESS" &&
        Array.isArray(responseData?.DATA?.contacts)
      ) {
        setContactList(responseData.DATA.contacts);
      } else {
        toast.error(responseData?.MSG || "Invalid contact response data");
        setContactList([]);
      }
    }
    if (contactError) {
      toast.error("Error fetching contacts: " + contactError.message);
      setContactList([]);
    }
  }, [contactData, contactError]);

  // Process matchedContact when contactList updates and pendingContactDetails exists
  useEffect(() => {
    if (pendingContactDetails && contactList.length > 0) {
      const contact_details = pendingContactDetails;
      let matchedContact = null;
      if (contact_details?.contact_id && contact_details?.company_id) {
        matchedContact = contactList.find(
          (contact) =>
            contact?.id == contact_details.company_id &&
            contact?.type == contact_details.company_type
        );
      } else if (contact_details?.contact_id) {
        matchedContact = contactList.find(
          (contact) =>
            contact?.id == contact_details.contact_id &&
            contact?.type == contact_details.contact_type
        );
      }
      if (matchedContact) {
        contactSelect(matchedContact);
      }
      setPendingContactDetails(null); // Clear after processing
    }
  }, [contactList, pendingContactDetails]);

  const {
    data: companyData,
    error: companyError,
    isLoading: companyLoading,
  } = useQuery({
    queryKey: ["companyBranchDivisionData", user?.id, token],
    queryFn: () => leadService.getCompanyBranchDivisionData(token, user?.id),
    enabled: !!user?.id && !!token && !companyBranchDivisionData,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (companyData) {
      const responseData = Array.isArray(companyData)
        ? companyData[0]
        : companyData;
      if (responseData?.STATUS === "SUCCESS") {
        setCompanyBranchDivisionData(responseData.DATA);
      } else {
        console.error(responseData?.MSG || "Invalid company response data");
        toast.error(responseData?.MSG || "Invalid company response data");
      }
    }
  }, [companyData, companyBranchDivisionData, setCompanyBranchDivisionData]);

  // Fetch Subordinates
  const {
    data: subordinatesData,
    isPending,
    isFetching,
    error: subordinatesError,
    isError,
  } = useQuery({
    queryKey: [
      "subordinates",
      token,
      selectedContact?.id,
      selectedContact?.type,
    ],
    queryFn: () => {
      const response = ContactService.getSubordinates(
        token,
        selectedContact?.id,
        selectedContact?.type
      );
      return response;
    },
    enabled: !!token && !!selectedContact?.id && !!selectedContact?.type,
    refetchOnMount: "always",
    staleTime: 0, // Mark data as stale immediately
    cacheTime: 0, // Disable caching (use gcTime: 0 for React Query v5)
  });

  // Process Subordinates and select the newly added subordinate
  useEffect(() => {
    if (subordinatesData) {
      const responseData = Array.isArray(subordinatesData)
        ? subordinatesData[0]
        : subordinatesData;
      if (responseData?.STATUS === "SUCCESS") {
        const newSubordinates = responseData.DATA || [];
        setSubordinates(newSubordinates);
      } else {
        toast.error(responseData?.MSG || "Failed to fetch subordinates");
        setSubordinates([]);
      }
    }
    if (isError) {
      toast.error("Error fetching subordinates: " + subordinatesError.message);
      setSubordinates([]);
    }
  }, [subordinatesData, isError, subordinatesError, newlyAddedSubordinateId]);

  useEffect(() => {
    if (!selectedContact) {
      setSubordinates([]);
      setSubordinateId("");
      setSubordinateName("");
    }
  }, [selectedContact]);

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

  const contactSelect = (contact) => {
    setSelectedContact(contact);
  };

  const addContactMutation = useMutation({
    mutationFn: async ({ data, selectedcompany, inputvalue }) => {
      const contactData = {
        country: data.country,
        state: data.state,
        contact_title: data.title,
        name: data.name,
        company_name: selectedcompany ? selectedcompany.title : inputvalue, // Explicit fallback to ""
        email: data.Email,
        mobile: data.mobile,
        address1: data.address,
        city: data.city,
        industry_id: data.industry,
        zipcode: data.pincode,
        area: data.area,
        created_by: user.id,
        routes: data.routes,
      };

      const response = await leadService.saveRawContact(contactData);
      return { response };
    },
    onMutate: () => {
      setIsSaveContact(true); // Disable button before API call
    },
    onSuccess: async ({ response }) => {
      const responseData = Array.isArray(response) ? response[0] : response;

      if (responseData?.STATUS === "SUCCESS") {
        setContactList([]);
        setIsContactModalOpen(false);
        toast.success("Contact added successfully!",{
            duration: 2000,
          });
        // Invalidate contact list query to trigger refetch
        await queryClient.refetchQueries({
          queryKey: ["contactList", token],
        });
        // Store CONTACT_DETAILS for processing after refetch
        if (responseData.CONTACT_DETAILS) {
          setPendingContactDetails(responseData.CONTACT_DETAILS);
        }
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
    onSettled: () => {
      setIsSaveContact(false); // Re-enable button after API call
    },
  });

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
        setIsSubordinateModalOpen(false);
        // Store the new subordinate_id to select after refetch
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
        setSubordinateName(responseData.DATA.name); // Optional, if used elsewhere
      } else {
        throw new Error(responseData?.MSG || "Failed to add subordinate");
      }
    },
    onError: (error) => {
      toast.error("Failed to add subordinate: " + error.message);
    },
  });

  const handleAddContact = (data, selectedcompany, inputvalue) => {
    addContactMutation.mutate({ data, selectedcompany, inputvalue });
  };

  const handleAddSubordinate = (data) => {
    addSubordinateMutation.mutate(data);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedContact?.id) {
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
      contactId: selectedContact.id,
      contactType: selectedContact.type,
      outcomeId,
      followupTypeId,
      description,
      subordinateId,
      subordinateName,
      followupDate,
      nextActionDate,
      singleFile,
      location,
    };

    onFollowupSubmit(followupData).finally(() => {
      setIsSubmitting(false);
      // onClose();
    });
  };

  return (
    <DialogErrorBoundary>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-[90vw] max-w-[425px] md:max-w-[600px] lg:max-w-[400px] max-h-[100vh] overflow-y-auto bg-white p-4 sm:p-6">
          <SheetHeader className="text-left">
            <SheetTitle className="text-lg sm:text-xl font-semibold">
              Add Contact Followup
            </SheetTitle>
          </SheetHeader>
          <form
            onSubmit={handleSubmit}
            className="grid gap-3 sm:gap-4 md:gap-6"
          >
            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6">
              {/* Contact Search */}
              <div className="space-y-1 mt-2">
                <h3 className="text-sm font-medium">Select Contact</h3>
                <div className="flex items-center">
                  <div className="relative flex-1">
                    <ContactSearch
                      contacts={contactList}
                      onSelect={contactSelect}
                      productSearch={false}
                      selectedItem={selectedContact}
                    />
                  </div>
                  {showAddButton && (
                    <>
                      <Button
                        className="h-9 px-4 ml-0 rounded-l-none bg-[#287f71] hover:bg-[#1e6a5e] text-white"
                        type="button"
                        onClick={() => setIsContactModalOpen(true)}
                      >
                        Add
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Subordinate Field */}
              {selectedContact && (
                <div className="lg:col-span-1">
                  <div>
                    <Label
                      htmlFor="subordinate"
                      className="text-sm font-medium"
                    >
                      Subordinate
                    </Label>
                    <div className="flex items-center">
                      <div className="relative flex-1">
                        <Select
                          value={subordinateId || ""} // Ensure we never pass undefined
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
                      <>
                        <Button
                          className="h-9 px-4 ml-0 rounded-l-none bg-[#287f71] hover:bg-[#1e6a5e] text-white"
                          type="button"
                          onClick={() => setIsSubordinateModalOpen(true)}
                        >
                          Add
                        </Button>
                      </>
                    </div>
                  </div>
                </div>
              )}

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
            <div className="flex justify-end gap-2 p-4">
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
        </SheetContent>
      </Sheet>

      {/* Add Contact Modal */}
      <Modal
        open={isContactModalOpen}
        onOpenChange={setIsContactModalOpen}
        title={`Add New ${contactLabel}`}
      >
        <ContactForm
          onAddContactSubmit={handleAddContact}
          onCancel={() => setIsContactModalOpen(false)}
          isSaveContact={isSaveContact} // Pass isSaveContact to ContactForm
        />
      </Modal>

      {/* Add Subordinate Modal */}
      <Modal
        open={isSubordinateModalOpen}
        onOpenChange={setIsSubordinateModalOpen}
        title="Add New Subordinate"
      >
        <SubordinateForm
          onAddSubordinateSubmit={handleAddSubordinate}
          onCancel={() => setIsSubordinateModalOpen(false)}
          selectedContact={selectedContact}
          addSubordinateMutation={addSubordinateMutation} // Pass mutation as prop
        />
      </Modal>
    </DialogErrorBoundary>
  );
};

export default AddFollowupForm;
