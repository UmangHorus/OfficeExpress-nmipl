"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Eye,
  EyeOff,
  CalendarCheck,
  UserPlus,
  ShoppingCart,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useToast } from "@/hooks/use-toast";
import { NotificationModal } from "@/components/notification/NotificationModal";
import api from "@/lib/api/axios";
import { useLoginStore } from "@/stores/auth.store";

const NotificationsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);

  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { token, user } = useLoginStore();

  // Safe user ID access with fallback
  const userId = user?.id || "";
  const itemsPerPage = 10;

  // Redirect if not authenticated
  useEffect(() => {
    if (!token || !userId) {
      router.push("/login");
    }
  }, [token, userId, router]);

  // Enhanced timestamp formatting with error handling
  const formatTimestamp = (unixTimestamp) => {
    if (!unixTimestamp || isNaN(unixTimestamp)) return "Unknown time";
    
    try {
      const now = new Date();
      const notificationDate = new Date(unixTimestamp * 1000);
      if (isNaN(notificationDate.getTime())) return "Invalid date";
      
      const diffInSeconds = Math.floor((now - notificationDate) / 1000);

      if (diffInSeconds < 60) return "Just now";
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
      
      return notificationDate.toLocaleDateString();
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "Unknown time";
    }
  };

  // Fetch notifications with comprehensive error handling
  const {
    data: notifications = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      try {
        if (!userId) {
          console.warn("No user ID available");
          return [];
        }

        const formData = new FormData();
        formData.append("PHPTOKEN", token || "");
        formData.append("AUTHORIZEKEY", process.env.NEXT_PUBLIC_API_AUTH_KEY || "");
        formData.append("employee_id", userId);

        const response = await api.post(
          "/expo_access_api/getNotificationList",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        if (!response?.data?.DATA) {
          console.warn("Invalid response format", response);
          return [];
        }

        return response.data.DATA.map((notification) => ({
          id: notification?.notification_id || Math.random().toString(36).substr(2, 9),
          title: notification?.title || "No title available",
          description: notification?.message || "No description available",
          timestamp: formatTimestamp(notification?.notification_dt),
          isRead: notification?.isRead === "Y",
          type: notification?.type || "default",
          rawData: notification || {},
        }));
      } catch (err) {
        console.error("Notification fetch error:", err);
        throw new Error("Failed to load notifications");
      }
    },
    enabled: !!userId,
    retry: 2,
  });

  // Mutations with error handling
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      const formData = new FormData();
      formData.append("PHPTOKEN", token || "");
      formData.append("AUTHORIZEKEY", process.env.NEXT_PUBLIC_API_AUTH_KEY || "");
      formData.append("notification_id", notificationId);

      await api.post("/expo_access_api/markNotificationAsRead", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["notifications"]);
      toast({
        title: "Marked as read",
        description: "Notification marked as read.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark notification as read.",
        variant: "destructive",
      });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId) => {
      const formData = new FormData();
      formData.append("PHPTOKEN", token || "");
      formData.append("AUTHORIZEKEY", process.env.NEXT_PUBLIC_API_AUTH_KEY || "");
      formData.append("notification_id", notificationId);

      await api.post("/expo_access_api/deleteNotification", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["notifications"]);
      toast({
        title: "Deleted",
        description: "Notification deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete notification.",
        variant: "destructive",
      });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("PHPTOKEN", token || "");
      formData.append("AUTHORIZEKEY", process.env.NEXT_PUBLIC_API_AUTH_KEY || "");
      formData.append("employee_id", userId);

      await api.post("/expo_access_api/deleteNotification", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["notifications"]);
      setShowClearDialog(false);
      toast({
        title: "All cleared",
        description: "All notifications have been cleared.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear notifications.",
        variant: "destructive",
      });
    },
  });

  // Safe filtering and pagination
  const filteredNotifications = notifications
    .filter(Boolean)
    .filter((notification) => {
      const { title = "", description = "", isRead = false } = notification || {};
      const searchLower = searchQuery.toLowerCase();
      
      const matchesSearch =
        title.toLowerCase().includes(searchLower) ||
        description.toLowerCase().includes(searchLower);
        
      const matchesFilter =
        filterType === "all" ||
        (filterType === "unread" && !isRead) ||
        (filterType === "read" && isRead);
        
      return matchesSearch && matchesFilter;
    });

  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / itemsPerPage));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedNotifications = filteredNotifications.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage
  );

  const getNotificationIcon = (type) => {
    const iconProps = { className: "w-5 h-5" };
    switch (type) {
      case "CalendarCheck":
        return <CalendarCheck {...iconProps} className="text-blue-500" />;
      case "UserPlus":
        return <UserPlus {...iconProps} className="text-green-500" />;
      case "ShoppingCart":
        return <ShoppingCart {...iconProps} className="text-orange-500" />;
      default:
        return <Bell {...iconProps} className="text-gray-500" />;
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p>Loading user information...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-red-500 mb-4">
                <Bell className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Error loading notifications
              </h3>
              <p className="text-gray-500 mb-4">
                {error?.message || "Failed to fetch notifications"}
              </p>
              <Button 
                variant="outline" 
                onClick={() => refetch()}
                disabled={isLoading}
              >
                {isLoading ? "Retrying..." : "Retry"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <Badge variant="outline" className="px-3 py-1">
              {filteredNotifications.length} total
            </Badge>
          </div>
          <p className="text-gray-600">
            Manage and view all your notifications
          </p>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
                <Select 
                  value={filterType} 
                  onValueChange={(value) => {
                    setFilterType(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {notifications.length > 0 && (
                <AlertDialog
                  open={showClearDialog}
                  onOpenChange={setShowClearDialog}
                >
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Clear all notifications?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. All notifications will be
                        permanently deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => clearAllMutation.mutate()}
                        disabled={clearAllMutation.isLoading}
                      >
                        {clearAllMutation.isLoading ? "Clearing..." : "Clear All"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : paginatedNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery || filterType !== "all"
                  ? "No matching notifications"
                  : "No notifications"}
              </h3>
              <p className="text-gray-500">
                {searchQuery || filterType !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "You're all caught up!"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {paginatedNotifications.map((notification) => (
              <Card
                key={`${notification.id}-${notification.isRead}`}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  !notification.isRead ? "border-blue-200 bg-blue-50/30" : ""
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div
                      className="flex-1"
                      onClick={() => {
                        setSelectedNotification(notification);
                        setIsModalOpen(true);
                        if (!notification.isRead) {
                          markAsReadMutation.mutate(notification.id);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <h3
                          className={`font-semibold ${
                            !notification.isRead
                              ? "text-gray-900"
                              : "text-gray-700"
                          }`}
                        >
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <Badge
                            variant="secondary"
                            className="bg-blue-100 text-blue-800"
                          >
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 mb-2 line-clamp-2">
                        {notification.description}
                      </p>
                      <p className="text-sm text-gray-500">
                        {notification.timestamp}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsReadMutation.mutate(notification.id);
                        }}
                        disabled={notification.isRead || markAsReadMutation.isLoading}
                        title={
                          notification.isRead ? "Already read" : "Mark as read"
                        }
                      >
                        {notification.isRead ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotificationMutation.mutate(notification.id);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={deleteNotificationMutation.isLoading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => {
                const page = i + 1;
                const isCurrentPage = page === currentPage;

                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <Button
                      key={page}
                      variant={isCurrentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  );
                }

                if (
                  (page === currentPage - 2 && currentPage > 3) ||
                  (page === currentPage + 2 && currentPage < totalPages - 2)
                ) {
                  return (
                    <span key={`ellipsis-${page}`} className="px-2">
                      ...
                    </span>
                  );
                }

                return null;
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Notification Details Modal */}
      {selectedNotification && (
        <NotificationModal
          notification={selectedNotification}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedNotification(null);
          }}
        />
      )}
    </div>
  );
};

export default NotificationsPage;