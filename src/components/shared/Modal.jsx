"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect } from "react";

export const Modal = ({
  children,
  open,
  onOpenChange,
  title,
  size = "w-[90vw] max-w-[425px] md:w-full md:max-w-[600px] lg:max-w-[800px]",
  contentClassName = "",
  onCancel, // Add onCancel prop
}) => {

  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      // When dialog is closing
      onCancel?.(); // Call onCancel if provided
    }
    onOpenChange(isOpen);
  };
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={`
          ${size}
          max-h-[90vh] overflow-y-auto
          rounded-lg
          p-4 sm:p-6 bg-[#fff]
          ${contentClassName}
        `}
      >
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg sm:text-xl font-semibold">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
};
