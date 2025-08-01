"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePunchStatus } from "@/hooks/usePunchStatus";
import { Button } from "@/components/ui/button";
import { punchService } from "@/lib/punchService";
import { usePunchStore } from "@/stores/punch.store";
import { useLoginStore } from "@/stores/auth.store";
import useLocationPermission from "@/hooks/useLocationPermission";
import { LogOut, Clock, Coffee, AlarmClock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const PunchSystem = () => {
  const {
    punchIn,
    punchOut,
    breakIn,
    breakOut,
    attrId,
    breakId,
    setPunchIn,
    setPunchOut,
    setBreakIn,
    setBreakOut,
    setAttrId,
    setBreakId,
    resetAttendance,
    employeePunchoutReset,
  } = usePunchStore();

  const checkAndRequestLocation = useLocationPermission();
  const queryClient = useQueryClient();
  const { user, logout } = useLoginStore();
  const loggedInUserId = user?.id;

  const [punchInBtn, setPunchInBtn] = useState(false);
  const [breakInBtn, setBreakInBtn] = useState(false);
  const [breakOutBtn, setBreakOutBtn] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const { refetch: getAttrID } = usePunchStatus(attrId);

  const punchInMutation = useMutation({
    mutationFn: async () => {
      return await punchService.employeePunchIn({
        employee_id: loggedInUserId,
        datetime: format(new Date(), "dd-MM-yy h:mm a"),
      });
    },
    onSuccess: (data) => {
      if (
        data &&
        data[0]?.STATUS == "success" &&
        data[0]?.MSG == "Punch in Successfully"
      ) {
        setAttrId(data[0]?.Id);
        setPunchOut(true);
        setPunchIn(false);
        setBreakIn(true);
        queryClient.refetchQueries({ queryKey: ["punchStatus"] });
        toast.success("Punch in Successfully!", {
          position: "top-right",
          duration: 3000,
        });
      } else {
        toast.error(
          "You have already PUNCHED OUT for the day. Punch IN is not allowed after Punch OUT",
          {
            position: "top-right",
            duration: 3000,
          }
        );
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error while punching in!", {
        position: "top-right",
        duration: 3000,
      });
    },
    onSettled: () => {
      setPunchInBtn(false);
    },
  });

  const breakInMutation = useMutation({
    mutationFn: async () => {
      return await punchService.employeeBreakInOut({
        att_id: attrId,
        break_type: "in",
        datetime: format(new Date(), "dd-MM-yy h:mm a"),
      });
    },
    onSuccess: (data) => {
      if (
        data &&
        data[0]?.STATUS === "success" &&
        data[0]?.MSG === "successfully Break in"
      ) {
        setBreakIn(false);
        setBreakOut(true);
        setBreakId(data[0]?.id_break);
        toast.success("Break in Successfully!", {
          position: "top-right",
          duration: 3000,
        });
      }
    },
    onError: () => {
      toast.error("Error while breaking in!", {
        position: "top-right",
        duration: 3000,
      });
    },
    onSettled: () => {
      setBreakInBtn(false);
    },
  });

  const breakOutMutation = useMutation({
    mutationFn: async () => {
      return await punchService.employeeBreakInOut({
        id: breakId,
        att_id: attrId,
        break_type: "out",
        datetime: format(new Date(), "dd-MM-yy h:mm a"),
      });
    },
    onSuccess: (data) => {
      if (
        data &&
        data[0]?.STATUS === "success" &&
        data[0]?.MSG === "successfully Break out"
      ) {
        setBreakIn(true);
        setBreakOut(false);
        setBreakId(null);
        toast.success("Break out Successfully!", {
          position: "top-right",
          duration: 3000,
        });
      }
    },
    onError: () => {
      toast.error("Error while breaking out!", {
        position: "top-right",
        duration: 3000,
      });
    },
    onSettled: () => {
      setBreakOutBtn(false);
    },
  });

  const handlePunchIn = async () => {
    try {
      await checkAndRequestLocation("Punch-in");
      setPunchInBtn(true);
      punchInMutation.mutate();
    } catch (error) {
      toast.error(error.message, {
        position: "top-right",
        duration: 3000,
      });
      setPunchInBtn(false);
    }
  };

  const handleLogout = async () => {
    try {
      logout();
      const cookiesToClear = ["token", "isEmployee"];
      cookiesToClear.forEach((cookieName) => {
        document.cookie = `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${
          process.env.NODE_ENV === "production" ? "; Secure" : ""
        }`;
      });
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth-storage");
        resetAttendance();
      }
      window.location.href = "/login";
    } catch (error) {
      toast.error("Logout failed: " + error.message, {
        position: "top-right",
        duration: 3000,
      });
    }
  };

  return (
    <div className="flex flex-nowrap gap-1.5">
      {punchIn && (
        <Button
          id="punchin"
          className="flex items-center gap-1.5 bg-[#287f71] hover:bg-[#20665a] text-white font-medium py-1.5 px-2 rounded-md text-xs"
          onClick={handlePunchIn}
          disabled={punchInBtn}
        >
          <Clock className="h-4 w-4" />
          Punch-In
        </Button>
      )}

      {breakIn && (
        <Button
          className="flex items-center gap-1.5 bg-[#ec344c] hover:bg-[#d42f44] text-white font-medium py-1.5 px-2 rounded-md text-xs"
          onClick={() => {
            setBreakInBtn(true);
            breakInMutation.mutate();
          }}
          disabled={breakInBtn}
        >
          <Coffee className="h-4 w-4" />
          Break-In
        </Button>
      )}

      {breakOut && (
        <Button
          className="flex items-center gap-1.5 bg-[#ec344c] hover:bg-[#d42f44] text-white font-medium py-1.5 px-2 rounded-md text-xs"
          onClick={() => {
            setBreakOutBtn(true);
            breakOutMutation.mutate();
          }}
          disabled={breakOutBtn}
        >
          <AlarmClock className="h-4 w-4" />
          Break-Out
        </Button>
      )}

      <Button
        className="flex items-center gap-1.5 bg-gray-500 hover:bg-gray-600 text-white font-medium py-1.5 px-2 rounded-md text-xs"
        onClick={() => setShowLogoutConfirm(true)}
      >
        <LogOut className="h-4 w-4" />
        Logout
      </Button>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out of the system?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowLogoutConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-gray-500 hover:bg-gray-600"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PunchSystem;
