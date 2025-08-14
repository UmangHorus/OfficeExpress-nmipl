"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Clock, Lock, Maximize, Menu, Search, User, LogOut } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useRouter } from "next/navigation";
import { useLoginStore } from "@/stores/auth.store";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { punchService } from "@/lib/punchService";
import { usePunchStore } from "@/stores/punch.store";
import DashboardSidebar from "./Sidebar";
import ProfileForm from "../forms/ProfileForm";
import { useSharedDataStore } from "@/stores/sharedData.store";
import { NotificationBell } from "@/components/notification/NotificationBell";
import useLocationPermission from "@/hooks/useLocationPermission";
import PunchSystem from "../PunchSystem";

export default function DashboardHeader({ toggleSidebar, sidebarVisible }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { contactProfileName } = useSharedDataStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isPunchOutDialogOpen, setIsPunchOutDialogOpen] = useState(false);
  const [isPunchOutConfirmOpen, setIsPunchOutConfirmOpen] = useState(false);
  const [punchOutBtn, setPunchOutBtn] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownTriggerRef = useRef(null);
  const baseurl = process.env.NEXT_PUBLIC_API_BASE_URL_FALLBACK;

  const { user = {}, appConfig = {}, token, logout } = useLoginStore();
  const { attrId, punchOut, employeePunchoutReset, resetAttendance } = usePunchStore();
  const checkAndRequestLocation = useLocationPermission();
  const queryClient = useQueryClient();
  const userName = user?.name || user?.object_name;
  const loggedInUserId = user?.id;
  const photo_path = appConfig?.photo_path;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsFullscreen(!!document.fullscreenElement);
    }
  }, []);

  const toggleFullscreen = () => {
    if (typeof window === "undefined") return;

    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(console.error);
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(console.error);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleLockScreen = () => {
    setIsDropdownOpen(false);
    setIsProfileDialogOpen(true);
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

  const punchOutMutation = useMutation({
    mutationFn: async () => {
      return await punchService.employeePunchOut({
        employee_id: loggedInUserId,
        datetime: format(new Date(), "dd-MM-yy h:mm a"),
        id: attrId,
      });
    },
    onSuccess: (data) => {
      if (
        data[0]?.STATUS == "success" &&
        data[0]?.MSG == "Punch out Successfully"
      ) {
        employeePunchoutReset();
        toast.success("You have been successfully punched out!", {
          position: "top-right",
          duration: 2000,
        });
      }
    },
    onError: (error) => {
      toast.error(
        error.message || "Could not complete punch out. Please try again.",
        {
          position: "top-right",
          duration: 3000,
        }
      );
    },
    onSettled: () => {
      setPunchOutBtn(false);
      setIsPunchOutConfirmOpen(false);
    },
  });

  const handlePunchOutClick = () => {
    setIsDropdownOpen(false);
    setIsPunchOutDialogOpen(true);
  };

  const handlePunchOutConfirm = () => {
    setIsPunchOutDialogOpen(false);
    setIsPunchOutConfirmOpen(true);
  };

  const handlePunchOut = async () => {
    try {
      await checkAndRequestLocation("Punch-out");
      setPunchOutBtn(true);
      punchOutMutation.mutate();
    } catch (error) {
      toast.error(error.message, {
        position: "top-right",
        duration: 3000,
      });
      setPunchOutBtn(false);
      setIsPunchOutConfirmOpen(false);
    }
  };

  const handleDialogClose = () => {
    setIsProfileDialogOpen(false);
    if (dropdownTriggerRef.current) {
      dropdownTriggerRef.current.focus();
    }
  };

  const shouldShowDropdown = !user?.isEmployee || punchOut;

  if (!isMounted) {
    return null;
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          <div className="md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Toggle menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <DashboardSidebar onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
          <div className="hidden md:block">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleSidebar}
              aria-label={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <NotificationBell />
          </div>

          {user?.isEmployee && <PunchSystem />}
          
          <Button
            className="flex items-center gap-1.5 bg-gray-500 hover:bg-gray-600 text-white font-medium py-1.5 px-2 rounded-md text-xs"
            onClick={() => setShowLogoutConfirm(true)}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>

          {shouldShowDropdown ? (
            <DropdownMenu.Root
              open={isDropdownOpen}
              onOpenChange={setIsDropdownOpen}
            >
              <DropdownMenu.Trigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 h-8 px-2"
                  ref={dropdownTriggerRef}
                >
                  <img
                    src={photo_path}
                    alt="User Avatar"
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-full"
                  />
                  <span className="hidden sm:inline text-sm font-medium text-gray-800">
                    {!user?.isEmployee ? contactProfileName : userName}
                  </span>
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="z-50 mt-2 w-48 rounded-md border border-gray-200 bg-white p-1 shadow-lg"
                  sideOffset={5}
                >
                  {!user?.isEmployee && (
                    <DropdownMenu.Item
                      className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm hover:bg-gray-100"
                      onSelect={handleLockScreen}
                    >
                      <Lock className="h-4 w-4" />
                      <span>My Profile</span>
                    </DropdownMenu.Item>
                  )}
                  {punchOut && (
                    <DropdownMenu.Item
                      className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                      onSelect={handlePunchOutClick}
                      disabled={punchOutBtn}
                    >
                      <Clock className="h-4 w-4" />
                      <span>Punch-Out</span>
                      {punchOutBtn && (
                        <span className="ml-auto h-2 w-2 animate-ping rounded-full bg-amber-400" />
                      )}
                    </DropdownMenu.Item>
                  )}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          ) : (
            <div className="flex items-center gap-2 h-8 px-2">
              <img
                src={photo_path}
                alt="User Avatar"
                width={28}
                height={28}
                className="h-7 w-7 rounded-full"
              />
              <span className="hidden sm:inline text-sm font-medium text-gray-800">
                {userName}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Profile Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogTrigger asChild>
          <span className="hidden" />
        </DialogTrigger>
        <ProfileForm onClose={handleDialogClose} />
      </Dialog>

      {/* Punch-Out Dialogs */}
      <Dialog
        open={isPunchOutDialogOpen}
        onOpenChange={setIsPunchOutDialogOpen}
      >
        <DialogContent className="w-[90vw] max-w-[425px] md:w-full md:max-w-[600px] lg:max-w-[800px] max-h-[90vh] overflow-y-auto bg-white p-4 sm:p-6 rounded-lg">
          <DialogHeader>
            <DialogTitle>Confirm Punch Out</DialogTitle>
            <DialogDescription>
              Are you sure you want to punch out?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end gap-2">
            <Button
              onClick={() => setIsPunchOutDialogOpen(false)}
              className="bg-[#ec344c] hover:bg-[#d42f44] text-white text-xs py-1.5 px-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePunchOutConfirm}
              className="bg-[#287f71] hover:bg-[#20665a] text-white text-xs py-1.5 px-2"
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={isPunchOutConfirmOpen}
        onOpenChange={setIsPunchOutConfirmOpen}
      >
        <DialogContent className="w-[90vw] max-w-[425px] md:w-full md:max-w-[600px] lg:max-w-[800px] max-h-[90vh] overflow-y-auto bg-white p-4 sm:p-6 rounded-lg">
          <DialogHeader>
            <DialogTitle>Punch Out Confirmation</DialogTitle>
            <DialogDescription className="text-left">
              You are about to Punch OUT. Please note: Once you punch out, you
              will not be able to Punch IN again today.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end gap-2">
            <Button
              onClick={() => setIsPunchOutConfirmOpen(false)}
              className="bg-[#ec344c] hover:bg-[#d42f44] text-white text-xs py-1.5 px-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePunchOut}
              className="bg-[#287f71] hover:bg-[#20665a] text-white text-xs py-1.5 px-2"
            >
              Confirm Punch Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="w-[90vw] max-w-[425px] max-h-[90vh] overflow-y-auto bg-white p-4 sm:p-6 rounded-lg">
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
    </header>
  );
}