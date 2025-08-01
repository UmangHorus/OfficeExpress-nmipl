import {
  Bell,
  Calendar,
  Truck,
  CreditCard,
  Settings,
  MessageCircle,
  X,
  CalendarCheck,
  UserPlus,
  ShoppingCart,
} from "lucide-react";

const getNotificationIcon = (type) => {
  const iconProps = { className: "w-5 h-5" };

  switch (type) {
    case "CalendarCheck":
      return <CalendarCheck {...iconProps} className="w-5 h-5 text-blue-500" />;
    case "UserPlus":
      return <UserPlus {...iconProps} className="w-5 h-5 text-green-500" />;
    case "ShoppingCart":
      return (
        <ShoppingCart {...iconProps} className="w-5 h-5 text-orange-500" />
      );
    default:
      return <Bell {...iconProps} className="w-5 h-5 text-gray-500" />;
  }
};

export const NotificationItem = ({ notification, onClick, onDelete }) => {
  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div
      onClick={onClick}
      className={`relative px-6 py-4 hover:bg-gray-50 cursor-pointer transition-all duration-150 group ${
        !notification.isRead ? "bg-blue-50/50 border-l-4 border-blue-500" : ""
      }`}
    >
      <div className="flex items-start space-x-4">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            {getNotificationIcon(notification.type)}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-semibold ${
                  !notification.isRead ? "text-gray-900" : "text-gray-700"
                } mb-1 leading-tight`}
              >
                {notification.title}
              </p>

              <p className="text-sm text-gray-600 leading-relaxed mb-2 pr-2">
                {notification.description.length > 100
                  ? `${notification.description.substring(0, 100)}...`
                  : notification.description}
              </p>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">
                  {notification.timestamp}
                </span>

                {!notification.isRead && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Delete button - shows on hover */}
        <button
          onClick={handleDelete}
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200 flex-shrink-0"
          aria-label="Delete notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
