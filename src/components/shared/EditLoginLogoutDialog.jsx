import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "sonner";
import { format, parse } from "date-fns";
import { punchService } from "@/lib/punchService";

export const EditLoginLogoutDialog = ({
  open,
  setOpen,
  selectedRow,
  searchParams,
}) => {
  const [loginTime, setLoginTime] = useState(null);
  const [logoutTime, setLogoutTime] = useState(null);
  const [calculatedHours, setCalculatedHours] = useState("");
  const [remark, setRemark] = useState("");
  const queryClient = useQueryClient();

  const parseTime = (timeStr) => {
    if (!timeStr) return null;
    const [time, period] = timeStr.split(" ");
    const [h, m, s] = time.split(":").map(Number);
    const date = new Date();
    let hours = h;
    if (period === "PM" && h < 12) hours += 12;
    if (period === "AM" && h === 12) hours = 0;
    date.setHours(hours, m, s || 0);
    return date;
  };

  useEffect(() => {
    if (open && selectedRow) {
      setLoginTime(parseTime(selectedRow.loginTime));
      setLogoutTime(parseTime(selectedRow.logoutTime));
      setRemark(selectedRow.remark || "");
    }
  }, [open, selectedRow]);

  useEffect(() => {
    updateHours();
  }, [loginTime, logoutTime]);

  const formatTime = (date) => {
    if (!date) return "";
    return format(date, "hh:mm:ss a");
  };

  const timeToMs = (date) => {
    if (!date) return 0;
    return (
      (date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()) *
      1000
    );
  };

  const formatDiff = (diff) => {
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const updateHours = () => {
    if (loginTime && logoutTime) {
      let loginMs = timeToMs(loginTime);
      let logoutMs = timeToMs(logoutTime);
      let diff = logoutMs - loginMs;
      if (diff < 0) diff += 24 * 3600 * 1000;
      setCalculatedHours(formatDiff(diff));
    } else {
      setCalculatedHours(selectedRow?.loginHours || "00:00:00");
    }
  };

  const formatDateToDDMMYYYY = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return format(date, "dd/MM/yyyy");
  };

  const updateLoginLogoutMutation = useMutation({
    mutationFn: async (values) => {
      if (!values.loginTime || !values.logoutTime) {
        throw new Error("Both login and logout times are required");
      }

      const formattedLogin_Date = format(
        parse(values.date, "yyyy-MM-dd", new Date()),
        "dd-MM-yy"
      );
      const formattedLogin_Time = format(
        parse(formatTime(values.loginTime), "hh:mm:ss a", new Date()),
        "hh:mm a"
      );
      const dateTimeLogin_String = `${formattedLogin_Date} ${formattedLogin_Time}`;

      const formattedLogout_Date = format(
        parse(values.date, "yyyy-MM-dd", new Date()),
        "dd-MM-yy"
      );
      const formattedLogout_Time = format(
        parse(formatTime(values.logoutTime), "hh:mm:ss a", new Date()),
        "hh:mm a"
      );
      const dateTimeLogout_String = `${formattedLogout_Date} ${formattedLogout_Time}`;

      const payload = {
        att_id: values.att_id,
        login_time: dateTimeLogin_String,
        logout_time: dateTimeLogout_String,
        remarks: values.remarks || "",
      };

      const response = await punchService.updateLoginLogoutTime(payload);
      return response;
    },
    onSuccess: async (response) => {
      const responseData = Array.isArray(response) ? response[0] : response;
      if (responseData?.STATUS == "success") {
        toast.success("Login/Logout time updated successfully!", {
          duration: 2000,
        });
        setOpen(false);
        await queryClient.refetchQueries({
          queryKey: ["attendanceReport", searchParams],
        });
      } else {
        throw new Error(
          responseData?.MSG || "Failed to update login/logout time"
        );
      }
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.MSG ||
        error.message ||
        "Failed to update login/logout time. Please try again.";
      toast.error(errorMessage);
    },
  });

  const handleSave = () => {
    if (!loginTime || !logoutTime) {
      toast.error("Both login and logout times are required");
      return;
    }
    
    updateLoginLogoutMutation.mutate({
      att_id: selectedRow?.id,
      date: selectedRow?.date,
      loginTime,
      logoutTime,
      remarks: remark,
    });
  };

  const handleOpenChange = (isOpen) => {
    setOpen(isOpen);
    
    // Reset state when dialog is closing
    if (!isOpen) {
      setLoginTime(null);
      setLogoutTime(null);
      setCalculatedHours("");
      setRemark("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[90vw] max-w-[425px] sm:max-w-[600px] lg:max-w-[800px] max-h-[90vh] overflow-y-auto bg-white p-4 sm:p-6 rounded-lg">
        <DialogHeader>
          <DialogTitle>Edit Login/Logout Details</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 grid-cols-1 sm:grid-cols-2 sm:gap-x-6">
          <div className="grid gap-2">
            <Label>User Name</Label>
            <Input
              value={selectedRow?.userName || "N/A"}
              disabled
              className="w-full"
            />
          </div>
          <div className="grid gap-2">
            <Label>Date</Label>
            <Input
              value={formatDateToDDMMYYYY(selectedRow?.date) || "N/A"}
              disabled
              className="w-full"
            />
          </div>
          <div className="grid gap-2">
            <Label>Login Time</Label>
            <div className="relative loginlogout-datepicker-div">
              <DatePicker
                selected={loginTime}
                onChange={(date) => setLoginTime(date)}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={1}
                timeCaption="Time"
                dateFormat="h:mm:ss aa"
                className="w-full p-2 border rounded-md input-focus-style h-10"
                placeholderText="Select login time"
                popperClassName="fixed z-50"
                // popperPlacement="bottom-start"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Logout Time</Label>
            <div className="relative loginlogout-datepicker-div">
              <DatePicker
                selected={logoutTime}
                onChange={(date) => setLogoutTime(date)}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={1}
                timeCaption="Time"
                dateFormat="h:mm:ss aa"
                className="w-full p-2 border rounded-md input-focus-style h-10"
                placeholderText="Select logout time"
                popperClassName="fixed z-50"
                // popperPlacement="bottom-start"
              />
            </div>
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label>Login Hours</Label>
            <Input
              value={calculatedHours || selectedRow?.loginHours || "00:00:00"}
              disabled
              className="w-full bg-gray-100 font-bold input-focus-style"
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label>Remark</Label>
            <Textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Enter remark"
              className="w-full min-h-[80px] input-focus-style"
              rows={3}
            />
          </div>
        </div>
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-[#287f71] hover:bg-[#20665a] text-white text-sm sm:text-base"
            onClick={handleSave}
            disabled={updateLoginLogoutMutation.isPending}
          >
            {updateLoginLogoutMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};