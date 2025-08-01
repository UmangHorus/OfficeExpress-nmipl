"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, X, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { NotificationItem } from "./NotificationItem";
import { NotificationModal } from "./NotificationModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api/axios";
import { useLoginStore } from "@/stores/auth.store";
import { useSound } from "@/hooks/useSound";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const queryClient = useQueryClient();
  const { token, user } = useLoginStore();
  const [previousUnreadCount, setPreviousUnreadCount] = useState(0);
  const playNotificationSound = useSound("/notification_sound.wav");
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const router = useRouter();

  // Hybrid solution states
  const [displayLimit, setDisplayLimit] = useState(10);
  const [isExpanded, setIsExpanded] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Format timestamp function
  const formatTimestamp = (unixTimestamp) => {
    const now = new Date();
    const notificationDate = new Date(unixTimestamp * 1000);
    const diffInSeconds = Math.floor((now - notificationDate) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return notificationDate.toLocaleDateString();
  };

  // Fetch notifications
  const {
    data: notifications = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const formData = new FormData();
      formData.append("PHPTOKEN", token);
      formData.append("AUTHORIZEKEY", process.env.NEXT_PUBLIC_API_AUTH_KEY);
      formData.append("employee_id", user.id);

      const response = await api.post(
        "/expo_access_api/getNotificationList",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (!response.data?.DATA) return [];

      return response.data.DATA.map((notification) => ({
        id: notification.notification_id,
        title: notification.title,
        description: notification.message,
        timestamp: formatTimestamp(notification.notification_dt),
        isRead: notification?.isRead === "Y",
        type: notification.type,
        rawData: notification,
      }));
    },
    refetchInterval: 600000, // 10 minutes
  });

  // Mutation for marking notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      const formData = new FormData();
      formData.append("PHPTOKEN", token);
      formData.append("AUTHORIZEKEY", process.env.NEXT_PUBLIC_API_AUTH_KEY);
      formData.append("notification_id", notificationId);

      await api.post("/expo_access_api/markNotificationAsRead", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["notifications"]);
    },
  });

  // Mutation for deleting notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId) => {
      const formData = new FormData();
      formData.append("PHPTOKEN", token);
      formData.append("AUTHORIZEKEY", process.env.NEXT_PUBLIC_API_AUTH_KEY);
      formData.append("notification_id", notificationId);

      await api.post("/expo_access_api/deleteNotification", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["notifications"]);
    },
  });

  // Calculate unread count
  const unreadCount = notifications
    ? notifications.filter((n) => n.isRead === false).length
    : 0;

  // Track user interaction for sound
  useEffect(() => {
    const handleInteraction = () => {
      setHasUserInteracted(true);
      document.removeEventListener("click", handleInteraction);
    };
    document.addEventListener("click", handleInteraction);
    return () => document.removeEventListener("click", handleInteraction);
  }, []);

  // Play sound when new notifications arrive
  useEffect(() => {
    if (unreadCount > previousUnreadCount && hasUserInteracted) {
      playNotificationSound().catch((e) => {
        console.log("Sound blocked by browser:", e);
      });
    }
    setPreviousUnreadCount(unreadCount);
  }, [
    unreadCount,
    previousUnreadCount,
    playNotificationSound,
    hasUserInteracted,
  ]);

  // Notification display logic
  const displayedNotifications = isExpanded
    ? notifications
    : notifications.slice(0, displayLimit);

  const shouldShowLoadMore = notifications.length > displayLimit && !isExpanded;
  const shouldShowLess = isExpanded && displayLimit > 10;

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setDisplayLimit(notifications.length);
    } else {
      setDisplayLimit(10);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    setSelectedNotification(notification);
    setIsModalOpen(true);
    setIsOpen(false);
  };

  const handleDeleteNotification = (notificationId) => {
    deleteNotificationMutation.mutate(notificationId);
  };

  const handleClearAll = async () => {
    const shouldClear = window.confirm(
      "Are you sure you want to clear all notifications?"
    );

    if (!shouldClear) return;

    try {
      const formData = new FormData();
      formData.append("PHPTOKEN", token);
      formData.append("AUTHORIZEKEY", process.env.NEXT_PUBLIC_API_AUTH_KEY);
      formData.append("employee_id", user.id);

      await api.post("/expo_access_api/deleteNotification", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      queryClient.invalidateQueries(["notifications"]);
      setIsOpen(false);
    } catch (error) {
      console.error("Error clearing notifications:", error);
      alert("Failed to clear notifications. Please try again.");
    }
  };

  const handleViewAllNotifications = () => {
    setIsOpen(false);
    router.push("/notifications");
  };

  return (
    <>
      <div className="relative">
        {/* Bell Icon Button */}
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className=" relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Notifications"
        >
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-[20px] flex items-center justify-center font-semibold px-1 shadow-sm">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown Panel */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className="notification-dropdown absolute right-0 mt-3 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden transform transition-all duration-200 ease-out"
            style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-white">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Notifications
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isLoading && (
                <p className="text-sm text-gray-600 mb-3">
                  Loading notifications...
                </p>
              )}

              {isError && (
                <p className="text-sm text-red-600 mb-3">
                  Error loading notifications
                </p>
              )}

              {!isLoading && !isError && (
                <p className="text-sm text-gray-600 mb-3">
                  {unreadCount > 0
                    ? `You have ${unreadCount} new notification${
                        unreadCount > 1 ? "s" : ""
                      }`
                    : `Showing ${Math.min(
                        displayLimit,
                        notifications.length
                      )} of ${notifications.length} notifications`}
                </p>
              )}

              {/* Clear All Button */}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium transition-colors border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear all notifications
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  <div className="animate-pulse w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Bell className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Loading notifications...
                  </p>
                </div>
              ) : isError ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                    <Bell className="w-8 h-8 text-red-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Error loading notifications
                  </p>
                  <p className="text-xs text-gray-500">
                    Please try again later
                  </p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Bell className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    No notifications
                  </p>
                  <p className="text-xs text-gray-500">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {displayedNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                      onDelete={() => handleDeleteNotification(notification.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                <button
                  onClick={handleViewAllNotifications}
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  View all notifications
                </button>

                <div className="flex gap-2">
                  {shouldShowLoadMore && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDisplayLimit((prev) => prev + 10)}
                      className="flex items-center gap-1"
                    >
                      Load More
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  )}
                  {shouldShowLess && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDisplayLimit(10);
                        setIsExpanded(false);
                      }}
                      className="flex items-center gap-1"
                    >
                      Show Less
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                  )}
                  {!shouldShowLoadMore &&
                    !shouldShowLess &&
                    notifications.length > 10 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleExpanded}
                        className="flex items-center gap-1"
                      >
                        {isExpanded ? "Show Less" : "Show All"}
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal for notification details */}
      <NotificationModal
        notification={selectedNotification}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedNotification(null);
        }}
      />
    </>
  );
};
