"use client";
import React, { useState, useEffect, Component } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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

const LeadFollowupForm = ({
  isOpen,
  onClose,
  onFollowupSubmit,
  lead,
}) => {
  const { user, token } = useLoginStore();
  const { myLeadFollowupSettings } = useSharedDataStore();
  const [outcomeId, setOutcomeId] = useState("");
  const [followupTypeId, setFollowupTypeId] = useState("");
  const [singleFile, setSingleFile] = useState(null);
  const [followupDate, setFollowupDate] = useState(new Date()); // Default to current date/time
  const [nextActionDate, setNextActionDate] = useState(new Date()); // Default to current date/time
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!lead?.id) {
      toast.error("Please select a lead.");
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
      leadId: lead.id,
      leadType : 7,     
       outcomeId,
      followupTypeId,
      description,
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
              Add Lead Followup
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
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
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm "
                  wrapperClassName="w-full followup-datepicker"
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
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm "
                  wrapperClassName="w-full followup-datepicker"
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
                type="submit"
                disabled={
                  isSubmitting ||
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
    </DialogErrorBoundary>
  );
};

export default LeadFollowupForm;