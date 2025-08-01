import {
  X,
  Calendar,
  MessageCircle,
  Truck,
  CreditCard,
  Settings,
  Bell,
} from "lucide-react";
import { useEffect } from "react";

const getNotificationIcon = (type) => {
  const iconProps = { className: "w-6 h-6" };

  switch (type) {
    case "message":
      return <MessageCircle {...iconProps} className="w-6 h-6 text-blue-500" />;
    case "event":
      return <Calendar {...iconProps} className="w-6 h-6 text-green-500" />;
    case "update":
      return <Truck {...iconProps} className="w-6 h-6 text-orange-500" />;
    case "payment":
      return <CreditCard {...iconProps} className="w-6 h-6 text-purple-500" />;
    case "system":
      return <Settings {...iconProps} className="w-6 h-6 text-gray-500" />;
    default:
      return <Bell {...iconProps} className="w-6 h-6 text-gray-500" />;
  }
};

export const NotificationModal = ({ notification, isOpen, onClose }) => {
  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !notification) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in-0 duration-300"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              {getNotificationIcon(notification.type)}
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Notification Details
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {notification.title}
            </h3>

            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {notification.timestamp}
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  notification.isRead
                    ? "bg-green-100 text-green-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {notification.isRead ? "Read" : "Unread"}
              </span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <p className="text-gray-700 leading-relaxed text-sm">
              {notification.description}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium shadow-sm"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
