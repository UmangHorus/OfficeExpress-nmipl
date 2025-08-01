"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLoginStore } from "@/stores/auth.store";

export const LeadTitleDialog = ({
  open,
  setOpen,
  leadTitleValue,
  setLeadTitleValue,
  handleAddLeadTitle,
  leadTitleErrorMsg,
  setLeadTitleErrorMsg,
  isLoading,
}) => {
  const leadInputRef = useRef(null);
  const { navConfig } = useLoginStore();
  const leadLabel = navConfig?.labels?.leads || "Lead";

  // Reset input and error when dialog opens/closes
  useEffect(() => {
    if (open) {
      setLeadTitleValue("");
      setLeadTitleErrorMsg("");
      leadInputRef.current?.focus();
    }
  }, [open, setLeadTitleValue, setLeadTitleErrorMsg]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!leadTitleValue.trim()) {
      setLeadTitleErrorMsg("Lead title is required");
      return;
    }
    await handleAddLeadTitle(e);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="w-[90vw] max-w-[425px] md:w-full md:max-w-[600px] lg:max-w-[800px] rounded-lg
          p-4 sm:p-6 bg-[#fff]"
      >
        <DialogHeader>
          <DialogTitle>Add New {leadLabel} Title</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="newLeadTitle">{leadLabel} Title Name</Label>
            <Input
              id="newLeadTitle"
              value={leadTitleValue}
              onChange={(e) => setLeadTitleValue(e.target.value)}
              placeholder={`Enter new ${leadLabel} title`} // Fixed: Uses template literal
              className="input-focus-style"
              ref={leadInputRef}
              autoFocus
            />
            {leadTitleErrorMsg && (
              <p className="text-red-500 text-sm mt-2 text-center">
                {leadTitleErrorMsg}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setLeadTitleValue("");
                setLeadTitleErrorMsg("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || !leadTitleValue.trim()}
              className="bg-[#287f71] hover:bg-[#20665a] text-white"
            >
              {isLoading ? "Adding..." : `Add ${leadLabel} Title`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
