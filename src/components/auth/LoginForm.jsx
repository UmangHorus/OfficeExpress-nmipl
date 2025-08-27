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
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api/axios";
import { usePunchStore } from "@/stores/punch.store";
import NewUserRegistrationForm from "../forms/NewUserRegistrationForm";

const AUTHORIZE_KEY = process.env.NEXT_PUBLIC_API_AUTH_KEY || "";

const authService = {
  generateOTP: async (mobileNumber) => {
    const response = await api.post(
      "/expo_access_api/verifyGenerateOTPByMobileForOrderBot/",
      {
        AUTHORIZEKEY: AUTHORIZE_KEY,
        contact_mobile: mobileNumber,
        country_isd: "+91",
        form_type: 1,
      }
    );
    return response.data;
  },
  verifyOTP: async (mobileNumber, otp, otpData) => {
    const response = await api.post(
      "/expo_access_api/verifyRegisterOTPByMobile/",
      {
        AUTHORIZEKEY: AUTHORIZE_KEY,
        contact: mobileNumber,
        key: otpData.DATA,
        object_id: otpData.OBJECT_ID,
        object_type: otpData.OBJECT_TYPE,
        verifyOTP: otp,
      }
    );
    return response.data;
  },
};

export default function LoginForm() {
  const router = useRouter();
  const {
    step,
    mobile,
    setMobile,
    setStep,
    login,
    setOtpData,
    otpData,
    logout,
  } = useLoginStore();

  const { setAttrId, setBreakId, setEmpInTime, setEmpOutTime, setPunchIn } =
    usePunchStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onChange", // Validate on change to catch pasted values
  });

  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const otpInputRef = useRef(null);

  useEffect(() => {
    logout();
    setStep("mobile");
    setMobile("");
    setOtpError("");
    setCountdown(0);
  }, [setStep, setMobile, logout]);

  useEffect(() => {
    let timer;
    if (step === "otp") {
      setCountdown(30);
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else {
      setCountdown(0);
    }
    return () => clearInterval(timer);
  }, [step]);

  useEffect(() => {
    if (otpValue.length === 6) {
      onSubmitOtp(otpValue);
    }
  }, [otpValue]);

  const generateOTPMutation = useMutation({
    mutationFn: authService.generateOTP,
    onSuccess: (data, mobileNumber) => {
      const responseData = Array.isArray(data) ? data[0] : data;
      if (responseData?.STATUS === "SUCCESS") {
        const otpPayload = {
          DATA: responseData.DATA,
          OBJECT_ID: responseData.OBJECT_ID,
          OBJECT_TYPE: responseData.OBJECT_TYPE,
          OBJECT_NAME: responseData.OBJECT_NAME,
          employeeName: responseData.employee_name,
          isEmployee: responseData.is_employee === "Y",
          enableOtp: responseData.enable_otp === "Y",
        };
        setOtpData(otpPayload);
        setMobile(mobileNumber);
        setStep("otp");
        setOtpValue("");
        setOtpError("");
        setCountdown(30);
        toast.success(responseData.MSG || `OTP sent to ${mobileNumber}`, {
          duration: 2000, // 3 seconds
        });
        setTimeout(() => otpInputRef.current?.focus(), 100);
      } else {
        throw new Error(responseData?.MSG || "Failed to send OTP");
      }
    },
    onError: (error) => {
      toast.warning(error.message || "Failed to send OTP. Please try again.", {
        duration: 3000,
        action: {
          label: "OK",
          onClick: () => {},
        },
      });
    },
  });

  const verifyOTPMutation = useMutation({
    mutationFn: ({ mobile, otp }) => {
      if (!otpData) {
        throw new Error("OTP session expired. Please request a new OTP.");
      }
      return authService.verifyOTP(mobile, otp, otpData);
    },

    onSuccess: (data) => {
      const responseData = Array.isArray(data) ? data[0] : data;

      if (responseData?.STATUS !== "SUCCESS") {
        throw new Error(responseData?.MSG || "OTP verification failed");
      }

      if (!responseData.PHPTOKEN) {
        throw new Error("Authentication token missing");
      }

      // ===== New User → Registration Flow =====
      if (!otpData.OBJECT_ID) {
        login(responseData.PHPTOKEN, { mobile }, responseData);
        setStep("register");
        setCountdown(0);
        return;
      }

      // ===== Existing User Flow =====
      const { emp_in_time, emp_out_time, emp_breakid, att_id } =
        responseData?.DATA || {};
      const isProduction = process.env.NODE_ENV === "production";
      const cookieExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Set cookies before redirect
      document.cookie = `token=${
        responseData.PHPTOKEN
      }; path=/; expires=${cookieExpiry.toUTCString()}${
        isProduction ? "; secure; sameSite=strict" : ""
      }`;
      document.cookie = `isEmployee=${
        otpData.isEmployee ? "true" : "false"
      }; path=/; expires=${cookieExpiry.toUTCString()}${
        isProduction ? "; secure; sameSite=strict" : ""
      }`;

      // Update global state
      login(
        responseData.PHPTOKEN,
        {
          id: otpData.OBJECT_ID,
          name: otpData.employeeName,
          mobile,
          isEmployee: otpData.isEmployee,
          enableOtp: otpData.enableOtp,
          type: otpData.OBJECT_TYPE,
          object_name: otpData.OBJECT_NAME,
        },
        responseData
      );
      setEmpInTime(emp_in_time);
      setEmpOutTime(emp_out_time);
      setBreakId(emp_breakid);
      setAttrId(att_id);
      setPunchIn(
        (emp_in_time && emp_out_time) || (!emp_in_time && !emp_out_time)
          ? true
          : false
      );

      // ===== Instant Redirect (No toast) =====
      setTimeout(() => {
        const redirectPath = otpData.isEmployee ? "/dashboard" : "/leads";
        router.replace(redirectPath);
      }, 0);
    },

    onError: (error) => {
      const errorMessage =
        error.response?.data?.MSG ||
        (Array.isArray(error.response?.data)
          ? error.response?.data[0]?.MSG
          : null) ||
        error.message ||
        "OTP verification failed";

      setOtpError(errorMessage);
      setOtpValue("");
      setTimeout(() => otpInputRef.current?.focus(), 100);
    },
  });

  const onSubmitMobile = (data) => {
    generateOTPMutation.mutate(data.mobile);
  };

  const onSubmitOtp = (otp) => {
    verifyOTPMutation.mutate({ mobile, otp });
  };

  const handleResendOtp = () => {
    if (countdown > 0) return;
    generateOTPMutation.mutate(mobile);
    setOtpValue("");
    setOtpError("");
    setCountdown(30);
  };

  const handleRegistrationCancel = () => {
    logout();
    setStep("mobile");
    setMobile("");
    setOtpError("");
    setOtpValue("");
    setCountdown(0);
  };

  const isLoading =
    generateOTPMutation.isPending || verifyOTPMutation.isPending;

  // Handle key down to allow only numbers and specific keys, including Enter
  const handleKeyDown = (e) => {
    if (
      !/[0-9]/.test(e.key) && // Allow numbers
      e.key !== "Backspace" &&
      e.key !== "Delete" &&
      e.key !== "Tab" &&
      e.key !== "Enter" && // Allow Enter key
      !(e.key === "v" && (e.ctrlKey || e.metaKey)) // Allow Ctrl+V or Cmd+V
    ) {
      e.preventDefault();
    }
  };

  // Handle paste to extract numbers and update form state
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text/plain");
    const numbersOnly = pastedText.replace(/\D/g, "").slice(0, 10); // Extract numbers, limit to 10
    setValue("mobile", numbersOnly, { shouldValidate: true }); // Update form state
  };

  return (
    <div className="min-h-screen bg-mint-100 flex flex-col md:flex-row items-center justify-center px-4 py-8 w-full">
      <Card
        className={`w-full ${
          step === "register" ? "max-w-2xl" : "max-w-md"
        } mb-8 md:mb-0 py-8`}
      >
        {step === "register" ? (
          <NewUserRegistrationForm
            mobile={mobile}
            onCancel={handleRegistrationCancel}
          />
        ) : (
          <CardContent className="py-6">
            <div className="flex justify-center mb-6">
              <img
                src="/logo.png"
                alt="Company Logo"
                width={230}
                height={115}
                priority="true"
              />
            </div>
            <h1 className="text-2xl text-center text-gray-700 font-medium mb-2">
              {step === "mobile" ? "Welcome" : "Verify OTP"}
            </h1>
            <p className="text-center text-gray-500 mb-6">
              {step === "mobile"
                ? "Login With Mobile Number"
                : `Enter code sent to ${mobile}`}
            </p>
            {step === "mobile" ? (
              <form onSubmit={handleSubmit(onSubmitMobile)} noValidate>
                <div className="mb-4">
                  <Label htmlFor="mobile" className="text-gray-600">
                    Your Registered Mobile Number
                  </Label>
                  <Input
                    id="mobile"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    placeholder="Enter 10-digit mobile number"
                    {...register("mobile")}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    className="mt-1"
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    We will send you OTP to verify your account.
                  </p>
                  {errors.mobile && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.mobile.message}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700 mt-4"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Send OTP"}
                </Button>
              </form>
            ) : (
              <div className="flex flex-col items-center">
                <form onSubmit={(e) => e.preventDefault()}>
                  <InputOTP
                    ref={otpInputRef}
                    maxLength={6}
                    value={otpValue}
                    onChange={setOtpValue}
                    pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
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
                    type="button"
                    onClick={() => onSubmitOtp(otpValue)}
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
                      onClick={handleResendOtp}
                      disabled={isLoading || countdown > 0}
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>
      <div className="w-full md:ml-12 hidden sm:flex md:max-w-[1000px] justify-center items-center">
        <img
          src="/login-image.png"
          alt="Login Illustration"
          width={800}
          height={800}
          className="max-w-full h-auto"
          priority="true"
        />
      </div>
    </div>
  );
}