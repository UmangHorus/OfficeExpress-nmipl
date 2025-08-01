"use client";
import DashboardSidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/Header";
import DashboardFooter from "@/components/dashboard/Footer";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Loading from "@/components/ui/Loading";
import BasicSettingsInitializer from "../BasicSettingsInitializer";
import PunchStatusInitializer from "../PunchStatusInitializer";
import LeadFollowupSettingsInitializer from "../LeadFollowupSettingsInitializer";
import RouteListInitializer from "../RouteListInitializer";
import { useLoginStore } from "@/stores/auth.store";
import { getCurrentLocation, checkLocationPermission } from "@/utils/location";

export default function DashboardLayout({ children }) {
  const [loading, setLoading] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true); // Sidebar visible by default
  const pathname = usePathname();
  const { setLocation, setLocationError} = useLoginStore();

  useEffect(() => {
    const handleLocation = async () => {
      try {
        const permission = await checkLocationPermission();

        if (permission === "denied") {
          setLocationError(
            "You have blocked location access. Please enable it in your browser settings to use this feature."
          );
          return;
        }

        if (permission === "granted" || permission === "prompt") {
          const location = await getCurrentLocation();
          setLocation(location);

          if (location.error) {
            setLocationError(location.error);
          }
        }
      } catch (error) {
        console.error("Location error:", error);
        setLocationError(error.message);
      }
    };

    handleLocation();
  }, [setLocation, setLocationError]);

  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleComplete = () => setLoading(false);

    handleStart();
    const timer = setTimeout(handleComplete, 1000);

    return () => {
      clearTimeout(timer);
      handleComplete();
    };
  }, [pathname]);

  const toggleSidebar = () => {
    setSidebarVisible((prev) => !prev);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Sidebar and Main Content Container */}
      {/* <BasicSettingsInitializer /> */}
      <PunchStatusInitializer />
      <LeadFollowupSettingsInitializer />
      <RouteListInitializer />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Hidden on mobile, toggleable on desktop */}
        <div
          className={`hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 transition-transform duration-300 ease-in-out ${
            sidebarVisible ? "translate-x-0" : "-translate-x-64"
          }`}
        >
          <DashboardSidebar setLoading={setLoading} />
        </div>

        {/* Main Content Area */}
        <div
          className={`flex flex-col flex-1 min-h-0 overflow-auto bg-[#e5edf4] transition-all duration-300 ease-in-out ${
            sidebarVisible ? "md:ml-64" : "md:ml-0"
          }`}
        >
          <DashboardHeader
            toggleSidebar={toggleSidebar}
            sidebarVisible={sidebarVisible}
          />

          {/* Main Content with scrolling */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 relative">
            <div className="min-h-full">
              {loading && <Loading />}
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Footer - Always at bottom */}
      <DashboardFooter />
    </div>
  );
}
