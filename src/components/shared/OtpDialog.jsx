"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";

export const OTPDialog = ({
  open,
  setOpen,
  otpValue,
  setOtpValue,
  onSubmitOtp,
  handleResendOtp,
}) => {
  const otpInputRef = useRef(null);
  const [otpError, setOtpError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const timerRef = useRef(null); // Simple number/ID for setTimeout

  // Countdown effect (runs only when dialog is open)
  useEffect(() => {
    if (open && countdown > 0) {
      timerRef.current = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }

    // Cleanup: Clear timeout when dialog closes or countdown hits 0
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [open, countdown]);

  // Reset everything when dialog opens/closes
  useEffect(() => {
    if (open) {
      setOtpValue("");
      setOtpError("");
      setCountdown(30);
      otpInputRef.current?.focus();
    } else {
      // Force stop countdown when closing
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setCountdown(0); // Immediately reset to 0
    }
  }, [open, setOtpValue]);

  useEffect(() => {
    if (otpValue.length == 6) {
      handleSubmit(new Event("submit"));
    }
  }, [otpValue]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otpValue.length !== 6) {
      setOtpError("Please enter a 6-digit OTP");
      return;
    }
    setIsLoading(true);
    try {
      await onSubmitOtp(otpValue);
      setOpen(false);
    } catch (error) {
      setOtpError(error.message || "Invalid OTP. Please try again.");
      setOtpValue(""); // Clear OTP input on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    try {
      await handleResendOtp();
      setCountdown(30);
      setOtpValue("");
      setOtpError("");
    } catch (error) {
      setOtpError("Failed to resend OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[90vw] max-w-[425px] md:w-full max-h-[90vh] overflow-y-auto overflow-x-hidden bg-white p-4 sm:p-6 rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-center">Verify OTP</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center">
          <form onSubmit={handleSubmit}>
            <InputOTP
              ref={otpInputRef}
              maxLength={6}
              value={otpValue}
              onChange={setOtpValue}
              className="justify-center"
              autoFocus
            >
              <InputOTPGroup className="gap-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    className="h-12 w-12 text-lg border-2"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>

            {otpError && (
              <p className="text-red-500 text-sm mt-2 text-center">
                {otpError}
              </p>
            )}

            <Button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700 mt-6"
              disabled={otpValue.length < 6 || isLoading}
            >
              {isLoading ? "Verifying..." : "Verify OTP"}
            </Button>
          </form>

          <div className="text-sm text-gray-500 mt-4 text-center">
            {countdown > 0 ? (
              <span>Resend OTP in {countdown}s</span>
            ) : (
              <button
                type="button"
                className="text-teal-600 hover:underline font-medium"
                onClick={handleResend}
                disabled={isLoading}
              >
                Resend OTP
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
