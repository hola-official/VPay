import {
  Lock,
  CreditCard,
  TrendingUp,
  Shield,
  Users,
  BarChart3,
  Droplets,
  Building2,
  X,
} from "lucide-react";
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";

export function Sidebar({ activeTab, setActiveTab, isOpen = true, onClose }) {
  const { isConnected } = useAccount();

  const tabs = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: BarChart3,
      description: "Overview & Claimables",
      disabled: !isConnected,
    },
    {
      id: "timelock",
      label: "Lock Tokens",
      icon: Lock,
      description: "Time & Vesting Locks",
      disabled: !isConnected,
    },
    {
      id: "investor",
      label: "Investor Payment",
      icon: CreditCard,
      description: "Multiple Vesting Lock",
      disabled: !isConnected,
    },
    {
      id: "payroll",
      label: "Company Payroll",
      icon: Building2,
      description: "Multiple Vesting Schedules",
      disabled: !isConnected,
    },
    {
      id: "faucet",
      label: "Faucet",
      icon: Droplets,
      description: "Coming Soon",
      disabled: true,
    },
    {
      id: "contacts",
      label: "Contacts",
      icon: Users,
      description: "Saved Addresses",
      disabled: !isConnected,
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

      {/* Sidebar - Fixed Position */}
      <div
        className={cn(
          "fixed lg:relative inset-y-0 left-0 z-50 w-72 sm:w-80 transition-transform duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Glassmorphism sidebar with fixed height */}
        <div className="h-full bg-black/20 backdrop-blur-xl border-r border-white/10 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {/* Mobile Close Button */}
            <div className="flex items-center justify-between mb-6 lg:mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-white">
                    VestLock
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

            {/* Connection Status */}
            {!isConnected && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-yellow-500/10 backdrop-blur-xl border border-yellow-500/20 rounded-xl">
                <p className="text-yellow-400 text-xs sm:text-sm font-medium">
                  ⚠️ Connect wallet to access features
                </p>
              </div>
            )}

            {/* Navigation */}
            <nav className="space-y-2 sm:space-y-3">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const isDisabled = tab.disabled;

                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (!isDisabled) {
                        setActiveTab(tab.id);
                        onClose?.(); // Close mobile sidebar when item is selected
                      }
                    }}
                    disabled={isDisabled}
                    className={cn(
                      "w-full p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 group relative overflow-hidden touch-manipulation select-none",
                      isActive && !isDisabled
                        ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 shadow-lg shadow-blue-500/10"
                        : isDisabled
                          ? "bg-white/5 border border-white/10 opacity-50 cursor-not-allowed"
                          : "bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 active:bg-white/15"
                    )}
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    {/* Neumorphism effect */}
                    <div
                      className={cn(
                        "absolute inset-0 rounded-xl sm:rounded-2xl transition-all duration-300 pointer-events-none",
                        isActive && !isDisabled
                          ? "shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.1)]"
                          : "shadow-[inset_0_1px_0_rgba(255,255,255,0.05),inset_0_-1px_0_rgba(0,0,0,0.05)]"
                      )}
                    />

                    <div className="relative flex items-center gap-3 sm:gap-4 pointer-events-none">
                      <div
                        className={cn(
                          "w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-300",
                          isActive && !isDisabled
                            ? "bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25"
                            : isDisabled
                              ? "bg-white/10"
                              : "bg-white/10 group-hover:bg-white/20"
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-300",
                            isActive && !isDisabled
                              ? "text-white"
                              : isDisabled
                                ? "text-gray-500"
                                : "text-gray-300 group-hover:text-white"
                          )}
                        />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <h3
                          className={cn(
                            "font-semibold transition-colors duration-300 text-sm sm:text-base truncate",
                            isActive && !isDisabled
                              ? "text-white"
                              : isDisabled
                                ? "text-gray-500"
                                : "text-gray-300 group-hover:text-white"
                          )}
                        >
                          {tab.label}
                        </h3>
                        <p
                          className={cn(
                            "text-xs truncate transition-colors duration-300",
                            isDisabled
                              ? "text-gray-600"
                              : "text-gray-400 group-hover:text-gray-300"
                          )}
                        >
                          {tab.description}
                        </p>
                      </div>
                    </div>

                    {/* Active indicator */}
                    {isActive && !isDisabled && (
                      <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 shadow-lg shadow-blue-400/50" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Fixed Bottom Section */}
          <div className="p-4 sm:p-6 border-t border-white/10">
            {/* Stats Card - Responsive */}
            <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] mb-4">
              <div className="flex items-center space-x-3 mb-3 sm:mb-4">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                <h4 className="text-gray-300 font-semibold text-sm sm:text-base">
                  Your Stats
                </h4>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs sm:text-sm">
                    Active Locks
                  </span>
                  <span className="text-blue-400 font-bold text-base sm:text-lg">
                    3
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs sm:text-sm">
                    Total Locked
                  </span>
                  <span className="text-cyan-400 font-bold text-base sm:text-lg">
                    $12,450
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs sm:text-sm">
                    Recipients
                  </span>
                  <span className="text-green-400 font-bold text-base sm:text-lg">
                    8
                  </span>
                </div>
              </div>
            </div>

            {/* Help Section - Responsive */}
            <div className="p-3 sm:p-4 bg-blue-500/10 backdrop-blur-xl border border-blue-500/20 rounded-xl">
              <p className="text-blue-300 text-xs">
                💡 <strong>Tip:</strong> Use Dashboard to view all claimables,
                Lock Tokens for simple locks, and Investor/Payroll for batch
                operations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
