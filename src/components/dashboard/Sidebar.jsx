"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLoginStore } from "@/stores/auth.store";
import { usePunchStore } from "@/stores/punch.store";
import PropTypes from "prop-types";
import { toast } from "sonner";
import {
  ChevronRight,
  ChevronDown,
  House,
  Triangle,
  Columns2,
  Mic,
  MessageSquare,
  CircleHelp,
  FileText,
  UserRound,
  ListChecks,
  Bell,
  Boxes,
} from "lucide-react";
import Image from "next/image";

// Constants
const ICON_SIZE = "w-5 h-5";
const ACTIVE_COLOR = "text-[#287f71]";
const INACTIVE_COLOR = "text-gray-600 hover:text-[#287f71]";

export default function DashboardSidebar({ onNavigate }) {
  const { empInTime, empOutTime } = usePunchStore();
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState({
    dashboard: pathname.startsWith("/dashboard"),
  });

  // Get store data with fallbacks
  const { navConfig = {}, user = {}, appConfig = {} } = useLoginStore();
  const { permissions = {}, labels = {} } = navConfig;
  const soPermissions = appConfig?.user_role?.so || {};

  // Permission checks
  const isEmployee = user?.isEmployee;
  const isRestrictedUser = !user?.isEmployee && user?.type !== 5;
  const showContactFollowups =
    appConfig?.contact_rawcontact_followup === "Y" && isEmployee;

  const canManageOrders = () => {
    if (appConfig?.isadmin === 1) return true;
    return (
      isEmployee &&
      (soPermissions.canCreateSO === 1 || soPermissions.canViewAllSO === 1)
    );
  };

  // Generate unique key for menu items
  const generateKey = (base, suffix = "") =>
    `${base}-${
      suffix || Math.random().toString(36).substring(2, 9)
    }`.toLowerCase();

  // Navigation items configuration
  const baseNavItems = isEmployee
    ? [
        {
          id: "dashboard",
          name: "Dashboard",
          href: "/dashboard",
          icon: <House className={ICON_SIZE} />,
          submenu: [
            {
              id: "sales-analysis",
              name: "Sales Analysis",
              href: "/dashboard",
            },
          ],
        },
      ]
    : [];

  const employeeNavItems = isEmployee
    ? [
        {
          id: "contacts",
          name: labels.contacts || "Contact",
          href: "/contacts",
          icon: <UserRound className={ICON_SIZE} />,
        },
      ].filter(Boolean)
    : [];

  const conditionalNavItems = [
    permissions.showLeads && {
      id: "leads",
      name: labels.leads || "Leads",
      href: "/leads",
      icon: <Triangle className={ICON_SIZE} />,
      originalName: "Leads",
    },
    permissions.showOrders &&
      canManageOrders() && {
        id: "orders",
        name: labels.orders || "Orders",
        href: "/orders",
        icon: <Columns2 className={ICON_SIZE} />,
        originalName: "Orders",
      },
  ].filter(Boolean);

  const conditionalNavItemsForContacts = [
    permissions.showLeads && {
      id: "leads",
      name: labels.leads || "Leads",
      href: "/leads",
      icon: <Triangle className={ICON_SIZE} />,
      originalName: "Leads",
    },
    permissions.showOrders && {
      id: "orders",
      name: labels.orders || "Orders",
      href: "/orders",
      icon: <Columns2 className={ICON_SIZE} />,
      originalName: "Orders",
    },
  ].filter(Boolean);

  const followUpItems =
    !isRestrictedUser && showContactFollowups
      ? [
          {
            id: "follow-ups",
            name: "Followups",
            href: "#",
            icon: <ListChecks className={ICON_SIZE} />,
            submenu: [
              {
                id: "contact-followups",
                name: `${labels.contacts || "Contacts"} Followups`,
                href: "/contact-followups",
              },
              permissions.showLeads && {
                id: "leads-followups",
                name: `${labels.leads || "Leads"} Followups`,
                href: "/leads-followups",
              },
            ].filter(Boolean),
          },
        ].filter((item) => item && item.submenu?.length > 0)
      : [];

  const reportItems =
    !isRestrictedUser && isEmployee
      ? [
          {
            id: "reports",
            name: "Reports",
            href: "/reports",
            icon: <FileText className={ICON_SIZE} />,
          },
        ]
      : [];

  // Add this to your navigation items configuration (before combining all navItems)
  // const customBomItems = [
  //   {
  //     id: "custom-bom-management",
  //     name: "Custom BOM Management",
  //     href: "/custom-bom-management",
  //     icon: <Boxes  className={ICON_SIZE} />, // Using ListChecks icon or choose another
  //   },
  // ];

  const navItems = isEmployee
    ? [
        ...baseNavItems,
        ...employeeNavItems,
        ...conditionalNavItems,
        ...followUpItems,
        ...reportItems,
        // ...customBomItems, // Add the BOM item
      ]
    : [...baseNavItems, ...conditionalNavItemsForContacts];

  const helpItems = [
    {
      id: "notifications",
      title: "Notifications",
      path: "/notifications",
      icon: <Bell className={`${ICON_SIZE} mr-2`} />,
    },
    // {
    //   id: "assistant",
    //   title: "AI Assistant",
    //   path: "/assistant",
    //   icon: <MessageSquare className={`${ICON_SIZE} mr-2`} />,
    // },
    {
      id: "faqs",
      title: "FAQs",
      path: "/faqs",
      icon: <CircleHelp className={`${ICON_SIZE} mr-2`} />,
    },
  ];

  // Handlers
  const toggleMenu = (menuId) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

  const handleNavigation = (e, href) => {
    // Skip punch check for logout or specific paths if needed
    if (href != "/logout") {
      if (
        isEmployee &&
        ((empInTime && empOutTime) || (!empInTime && !empOutTime))
      ) {
        e.preventDefault(); // Prevent default navigation
        toast.warning("Please Punch-In to continue.", {
          // description: "Please punch in to continue.",
          action: {
            label: "OK",
            onClick: () => {},
          },
        });
        onNavigate?.(); // Call onNavigate when navigation is allowed
        return;
      }
    }

    onNavigate?.(); // Call onNavigate when navigation is allowed
  };

  // Render helpers
  const renderSubmenu = (item) => {
    const isExpanded = expandedMenus[item.id];
    const isActive =
      pathname === item.href ||
      (item.submenu && item.submenu.some((sub) => pathname === sub.href));

    return (
      <div key={item.id} className="space-y-1">
        <button
          onClick={() => toggleMenu(item.id)}
          className={`flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md ${
            isActive ? ACTIVE_COLOR : INACTIVE_COLOR
          }`}
        >
          <span className="flex items-center gap-3">
            {item.icon}
            {item.name}
          </span>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        {isExpanded && item.submenu && (
          <div className="ml-8 space-y-1">
            {item.submenu.map((subItem) => (
              <Link
                key={subItem.id}
                href={subItem.href}
                className={`block px-3 py-2 text-sm rounded-md ${
                  pathname === subItem.href ? ACTIVE_COLOR : INACTIVE_COLOR
                }`}
                onClick={(e) => handleNavigation(e, subItem.href)}
              >
                {subItem.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderLink = (item) => {
    const isActive = pathname === item.href;
    return (
      <div key={item.id} className="space-y-1">
        <Link
          href={item.href}
          className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${
            isActive ? ACTIVE_COLOR : INACTIVE_COLOR
          }`}
          onClick={(e) => handleNavigation(e, item.href)}
        >
          {item.icon}
          {item.name}
        </Link>
      </div>
    );
  };

  return (
    <div className="border-r bg-white h-full">
      <div className="flex h-16 items-center px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold"
          onClick={(e) => handleNavigation(e, "/dashboard")}
        >
          <img
            src="/logo.png"
            alt="Company Logo"
            width={100}
            height={32}
            className="rounded"
          />
        </Link>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) =>
          item.submenu ? renderSubmenu(item) : renderLink(item)
        )}

        <h3 className="text-xs font-semibold text-gray-400 uppercase px-3 pt-6 pb-2">
          HELP
        </h3>

        {helpItems.map((item) => (
          <div key={item.id} className="space-y-1">
            <Link
              href={item.path}
              className={`flex items-center px-3 py-2 text-sm rounded-md font-medium ${
                pathname === item.path ? ACTIVE_COLOR : INACTIVE_COLOR
              }`}
              onClick={(e) => handleNavigation(e, item.path)}
            >
              {item.icon}
              {item.title}
            </Link>
          </div>
        ))}
      </nav>
    </div>
  );
}

DashboardSidebar.propTypes = {
  onNavigate: PropTypes.func,
};
