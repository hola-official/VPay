import { useState } from "react";
import { useAccount } from "wagmi";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { DashboardPanel } from "@/components/DashboardPanel";
import { TimeLockPanel } from "@/components/TimeLockPanel";
import { InvestorPaymentPanel } from "@/components/InvestorPaymentPanel";
import { PayrollPanel } from "@/components/PayrollPanel";
import { BackgroundEffects } from "@/components/BackgroundEffects";
import { useMultiTokenVesting } from "@/hooks/useMultiTokenVesting";
import { useTokenLocker } from "@/hooks/useTokenLocker";
import { useContacts } from "@/hooks/useContacts";
import { Wallet, Shield, Sparkles, Menu, X } from "lucide-react";
import { ContactsPanel } from "@/components/ContactsPanel";

export default function TokenVestingApp() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isConnected } = useAccount();

  // Initialize hooks only when wallet is connected
  const multiVesting = useMultiTokenVesting();
  const tokenLocker = useTokenLocker();
  const contacts = useContacts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <BackgroundEffects />

      {/* Header - Fixed at top */}
      <Header />

      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-20 left-4 z-[60]">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-12 h-12 bg-black/20 backdrop-blur-xl border border-white/10 hover:bg-black/30 text-white rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center touch-manipulation"
        >
          {sidebarOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Main Container - Below header */}
      <div
        className="relative z-10 flex"
        style={{ height: "calc(100vh - 4rem)" }}
      >
        {/* Sidebar - Fixed height, scrollable content */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-y-auto mobile-padding py-4 sm:py-6 lg:py-8">
          <div className="max-w-7xl mx-auto">
            {/* Content Panels - Only show when wallet is connected */}
            {isConnected ? (
              <>
                {activeTab === "dashboard" && (
                  <DashboardPanel
                    multiVesting={multiVesting}
                    tokenLocker={tokenLocker}
                  />
                )}
                {activeTab === "timelock" && (
                  <TimeLockPanel
                    tokenLocker={tokenLocker}
                    contacts={contacts}
                  />
                )}
                {activeTab === "investor" && (
                  <InvestorPaymentPanel
                    tokenLocker={tokenLocker}
                    contacts={contacts}
                  />
                )}
                {activeTab === "payroll" && (
                  <PayrollPanel
                    multiVesting={multiVesting}
                    contacts={contacts}
                  />
                )}
                {activeTab === "faucet" && (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mx-auto mb-6 animate-pulse">
                      <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4">
                      Faucet Coming Soon
                    </h2>
                    <p className="text-slate-400 max-w-md mx-auto">
                      Free token distribution features will be available here.
                      Stay tuned for updates!
                    </p>
                  </div>
                )}
                {activeTab === "contacts" && (
                  <ContactsPanel contacts={contacts} />
                )}
              </>
            ) : (
              <div className="text-center py-8 sm:py-16">
                <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 mb-6">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-xl animate-glow">
                    <Wallet className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                  </div>
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-400 animate-pulse opacity-30"></div>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                  Welcome to VestLock
                </h3>
                <p className="text-slate-400 text-base sm:text-lg max-w-md mx-auto mb-6 sm:mb-8 px-4">
                  The most advanced and user-friendly token vesting platform.
                  Connect your wallet to unlock powerful features.
                </p>

                {/* Feature preview - Responsive Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto px-4">
                  <div className="p-4 sm:p-6 bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl animate-float">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h4 className="text-white font-semibold mb-2 text-sm sm:text-base">
                      Time Locks
                    </h4>
                    <p className="text-slate-400 text-xs sm:text-sm">
                      Lock tokens for specific periods with precise control
                    </p>
                  </div>
                  <div className="p-4 sm:p-6 bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl animate-float delay-100">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-400 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h4 className="text-white font-semibold mb-2 text-sm sm:text-base">
                      Multi Vesting
                    </h4>
                    <p className="text-slate-400 text-xs sm:text-sm">
                      Create complex vesting schedules for multiple recipients
                    </p>
                  </div>
                  <div className="p-4 sm:p-6 bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl animate-float delay-200 sm:col-span-2 lg:col-span-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-400 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h4 className="text-white font-semibold mb-2 text-sm sm:text-base">
                      Easy Claims
                    </h4>
                    <p className="text-slate-400 text-xs sm:text-sm">
                      Claim your vested tokens with one-click simplicity
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
