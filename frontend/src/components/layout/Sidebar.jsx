import { Lock, CreditCard, Users, BarChart3, Droplets, Building2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { VPayLogo } from "@/components/ui/VPay-logo"


export function Sidebar({ activeTab, setActiveTab, isOpen = true, onClose }) {
  const tabs = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: BarChart3,
      description: "Overview & Analytics",
    },
    {
      id: "lock",
      label: "Lock Tokens",
      icon: Lock,
      description: "Time & Vesting Locks",
    },
    {
      id: "investor",
      label: "Investor Payment",
      icon: CreditCard,
      description: "Multi-Investor Vesting",
    },
    {
      id: "payroll",
      label: "Company Payroll",
      icon: Building2,
      description: "Employee Salaries",
    },
    {
      id: "faucet",
      label: "Faucet",
      icon: Droplets,
      description: "Claim Tokens",
    },
    {
      id: "contact",
      label: "Contacts",
      icon: Users,
      description: "Saved Addresses",
    },
  ]

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed lg:relative inset-y-0 left-0 z-50 w-72 sm:w-80 h-full transition-transform duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Glassmorphism sidebar */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-xl border-r border-white/10">
          <div className="p-4 sm:p-6">
            {/* Mobile Close Button */}
            <div className="flex items-center justify-between mb-6 lg:mb-8">
              <div className="flex items-center gap-3">
                <VPayLogo size="lg" variant="icon" className="shadow-lg shadow-blue-500/25" />
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-white">VPay</h1>
                  <p className="text-xs text-gray-400">Secure Token Vesting</p>
                </div>
              </div>

              {/* Close button for mobile */}
              <button onClick={onClose} className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="space-y-2 sm:space-y-3">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id

                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id)
                      onClose?.() // Close mobile sidebar when item is selected
                    }}
                    className={cn(
                      "w-full p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 group relative overflow-hidden",
                      isActive
                        ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 shadow-lg shadow-blue-500/10"
                        : "bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20",
                    )}
                  >
                    {/* Neumorphism effect */}
                    <div
                      className={cn(
                        "absolute inset-0 rounded-xl sm:rounded-2xl transition-all duration-300",
                        isActive
                          ? "shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.1)]"
                          : "shadow-[inset_0_1px_0_rgba(255,255,255,0.05),inset_0_-1px_0_rgba(0,0,0,0.05)]",
                      )}
                    />

                    <div className="relative flex items-center gap-3 sm:gap-4">
                      <div
                        className={cn(
                          "w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-300",
                          isActive
                            ? "bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25"
                            : "bg-white/10 group-hover:bg-white/20",
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-300",
                            isActive ? "text-white" : "text-gray-300 group-hover:text-white",
                          )}
                        />
                      </div>

                      <div className="text-left flex-1 min-w-0">
                        <h3
                          className={cn(
                            "font-semibold transition-colors duration-300 text-sm sm:text-base truncate",
                            isActive ? "text-white" : "text-gray-300 group-hover:text-white",
                          )}
                        >
                          {tab.label}
                        </h3>
                        <p className="text-xs text-gray-400 group-hover:text-gray-300 truncate">{tab.description}</p>
                      </div>
                    </div>

                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 shadow-lg shadow-blue-400/50" />
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      </div>
    </>
  )
}
