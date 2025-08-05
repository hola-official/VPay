import {
  List,
  PlusCircle,
  Info,
  BriefcaseBusiness,
  Contact,
  X,
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { useState } from "react";
import { VPayLogo } from "@/components/ui/VPay-logo";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function Sidebar({ isOpen, onClose }) {
  const { pathname } = useLocation();
  const [showTooltip, setShowTooltip] = useState(null);

  const isActive = (path) => {
    return pathname === path;
  };

  const navItems = [
    {
      path: "/",
      label: "Dashboard",
      icon: List,
      description: "Overview of your locks and vesting schedules",
    },
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
    {
      path: "/contact",
      label: "Contact",
      icon: Contact,
      description: "Manage contact information",
    },
    {
      path: "/token-lock",
      label: "Token Locks",
      icon: List,
      description: "View all token locks and manage your own",
    },
    {
      path: "/lp-lock",
      label: "LP Locks",
      icon: List,
      description: "View all liquidity pool token locks",
    },
  ];

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
            <nav className="space-y-2 sm:space-y-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isItemActive = isActive(item.path);

                return (
                  <div key={item.path} className="relative">
                    <Link to={item.path}>
                      <motion.button
                        className={cn(
                          "w-full p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 group relative overflow-hidden",
                          isItemActive
                            ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 shadow-lg shadow-blue-500/10"
                            : "bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20"
                        )}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onMouseEnter={() => setShowTooltip(item.path)}
                        onMouseLeave={() => setShowTooltip(null)}
                        onClick={() => onClose?.()}
                      >
                        {/* Neumorphism effect */}
                        <div
                          className={cn(
                            "absolute inset-0 rounded-xl sm:rounded-2xl transition-all duration-300",
                            isItemActive
                              ? "shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.1)]"
                              : "shadow-[inset_0_1px_0_rgba(255,255,255,0.05),inset_0_-1px_0_rgba(0,0,0,0.05)]"
                          )}
                        />

                        <div className="relative flex items-center gap-3 sm:gap-4">
                          <div
                            className={cn(
                              "w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-300",
                              isItemActive
                                ? "bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25"
                                : "bg-white/10 group-hover:bg-white/20"
                            )}
                          >
                            <Icon
                              className={cn(
                                "w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-300",
                                isItemActive
                                  ? "text-white"
                                  : "text-gray-300 group-hover:text-white"
                              )}
                            />
                          </div>

                          <div className="text-left flex-1 min-w-0">
                            <h3
                              className={cn(
                                "font-semibold transition-colors duration-300 text-sm sm:text-base truncate",
                                isItemActive
                                  ? "text-white"
                                  : "text-gray-300 group-hover:text-white"
                              )}
                            >
                              {item.label}
                            </h3>
                            <p className="text-xs text-gray-400 group-hover:text-gray-300 truncate">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {/* Active indicator */}
                        {isItemActive && (
                          <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 shadow-lg shadow-blue-400/50" />
                        )}
                      </motion.button>
                    </Link>

                    {/* Tooltip for desktop */}
                    {showTooltip === item.path && (
                      <motion.div
                        className="hidden lg:block absolute left-full top-1/2 transform -translate-y-1/2 ml-2 w-48 p-2 bg-[#0a0a20] border border-[#475B74]/50 rounded-lg shadow-lg text-xs text-[#97CBDC]/90 text-center z-10"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {item.description}
                        <div className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45 w-2 h-2 bg-[#0a0a20] border-l border-b border-[#475B74]/50"></div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}
