import {
  List,
  PlusCircle,
  Info,
  BriefcaseBusiness,
  Contact,
  X,
  FileText,
  CreditCard,
  Repeat,
  Receipt,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { useState } from "react";
import { VPayLogo } from "@/components/ui/VPay-logo";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function Sidebar({ isOpen, onClose }) {
  const { pathname } = useLocation();
  const [expandedGroups, setExpandedGroups] = useState({
    invoices: true,
    tokenLock: false,
  });

  const isActive = (path) => {
    return pathname === path;
  };

  const toggleGroup = (groupName) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const navItems = [
    {
      path: "/",
      label: "Dashboard",
      icon: BarChart3,
      description: "Overview of invoices, payments, and statistics",
      standalone: true,
    },
    {
      group: "invoices",
      label: "Invoice Management",
      icon: FileText,
      description: "Manage invoices, payments, and receipts",
      items: [
        {
          path: "/invoices",
          label: "Invoices",
          icon: FileText,
          description: "Create and manage your invoices",
        },
        // {
        //   path: "/payments",
        //   label: "Payments",
        //   icon: CreditCard,
        //   description: "Process crypto and bank payments",
        // },
        {
          path: "/recurring",
          label: "Recurring",
          icon: Repeat,
          description: "Manage automated recurring invoices",
        },
        // {
        //   path: "/receipts",
        //   label: "Receipts",
        //   icon: Receipt,
        //   description: "View payment receipts and NFT tokens",
        // },
      ],
    },
    {
      group: "tokenLock",
      label: "Token Lock",
      icon: PlusCircle,
      description: "Token vesting and locking features",
      items: [
        {
          path: "/create-lock",
          label: "Create Lock",
          icon: PlusCircle,
          description: "Lock your tokens with secure time-release vault",
        },
        {
          path: "/pay",
          label: "Create Payroll",
          icon: BriefcaseBusiness,
          description: "Create payroll vesting for your workers",
        },
      ],
    },
    {
      path: "/token-lock",
      label: "Token Locks",
      icon: List,
      description: "View all token locks and manage your own",
      standalone: true,
    },
    {
      path: "/contact",
      label: "Contact",
      icon: Contact,
      description: "Manage contact information",
      standalone: true,
    },
  ];

  const renderNavItem = (item, isSubItem = false) => {
    const Icon = item.icon;
    const isItemActive = isActive(item.path);

    return (
      <Link key={item.path} to={item.path}>
        <motion.button
          className={cn(
            "w-full p-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
            isSubItem ? "ml-4" : "",
            isItemActive
              ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 shadow-lg shadow-blue-500/10"
              : "bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onClose?.()}
        >
          {/* Neumorphism effect */}
          <div
            className={cn(
              "absolute inset-0 rounded-xl transition-all duration-300",
              isItemActive
                ? "shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.1)]"
                : "shadow-[inset_0_1px_0_rgba(255,255,255,0.05),inset_0_-1px_0_rgba(0,0,0,0.05)]"
            )}
          />

          <div className="relative flex items-center gap-3">
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
                isItemActive
                  ? "bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25"
                  : "bg-white/10 group-hover:bg-white/20"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 transition-colors duration-300",
                  isItemActive
                    ? "text-white"
                    : "text-gray-300 group-hover:text-white"
                )}
              />
            </div>

            <div className="text-left flex-1 min-w-0">
              <h3
                className={cn(
                  "font-medium transition-colors duration-300 text-sm truncate",
                  isItemActive
                    ? "text-white"
                    : "text-gray-300 group-hover:text-white"
                )}
              >
                {item.label}
              </h3>
              {!isSubItem && (
                <p className="text-xs text-gray-400 group-hover:text-gray-300 truncate">
                  {item.description}
                </p>
              )}
            </div>

            {/* Active indicator */}
            {isItemActive && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 shadow-lg shadow-blue-400/50" />
            )}
          </div>
        </motion.button>
      </Link>
    );
  };

  const renderGroup = (group) => {
    const GroupIcon = group.icon;
    const isExpanded = expandedGroups[group.group];

    return (
      <div key={group.group} className="space-y-2">
        {/* Group Header */}
        <button
          onClick={() => toggleGroup(group.group)}
          className="w-full p-3 rounded-xl transition-all duration-300 group relative overflow-hidden bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 group-hover:bg-white/20 transition-all duration-300">
              <GroupIcon className="w-4 h-4 text-gray-300 group-hover:text-white transition-colors duration-300" />
            </div>

            <div className="text-left flex-1 min-w-0">
              <h3 className="font-medium text-sm text-gray-300 group-hover:text-white transition-colors duration-300">
                {group.label}
              </h3>
              <p className="text-xs text-gray-400 group-hover:text-gray-300 truncate">
                {group.description}
              </p>
            </div>

            <div className="text-gray-400 group-hover:text-white transition-colors duration-300">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </div>
          </div>
        </button>

        {/* Group Items */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-1"
          >
            {group.items.map((item) => renderNavItem(item, true))}
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed lg:relative inset-y-0 left-0 z-50 w-72 sm:w-80 h-full transition-transform duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Glassmorphism sidebar */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-xl border-r border-white/10">
          <div className="p-4 sm:p-6">
            {/* Mobile Close Button */}
            <div className="flex items-center justify-between mb-6 lg:mb-8">
              <div className="flex items-center gap-3">
                <VPayLogo
                  size="lg"
                  variant="icon"
                  className="shadow-lg shadow-blue-500/25"
                />
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-white">
                    VPay
                  </h1>
                  <p className="text-xs text-gray-400">Secure Token Vesting</p>
                </div>
              </div>

              {/* Close button for mobile */}
              <button
                onClick={onClose}
                className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="space-y-3">
              {navItems.map((item) => {
                if (item.standalone) {
                  return renderNavItem(item);
                } else if (item.group) {
                  return renderGroup(item);
                }
                return null;
              })}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}
