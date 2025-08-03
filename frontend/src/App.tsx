import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { BackgroundEffects } from "@/components/ui/BackgroundEffects"
import { DashboardTab } from "@/components/features/dashboard/DashboardTab"
import { LockTab } from "@/components/features/lock/LockTab"
import { ContactTab } from "@/components/features/contacts/ContactTab"
import EnhancedInvestorPaymentTab from "@/components/features/investor/InvestorPaymentTab"
import CompanyPayrollTab from "@/components/features/payroll/CompanyPayrollTab"
import { FaucetTab } from "@/components/features/faucet/FaucetTab"
import { ContactsProvider } from "@/contexts/ContactsContext"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

export default function TokenLockerApp() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardTab />
      case "lock":
        return <LockTab />
      case "investor":
        return <EnhancedInvestorPaymentTab />
      case "payroll":
        return <CompanyPayrollTab />
      case "faucet":
        return <FaucetTab />
      case "contact":
        return <ContactTab />
      default:
        return <DashboardTab />
    }
  }

  return (
    <ContactsProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
        <BackgroundEffects />

        <div className="flex h-screen relative z-10">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="fixed top-4 left-4 z-50 lg:hidden w-10 h-10 rounded-xl bg-black/20 backdrop-blur-xl border border-white/10 hover:bg-white/10"
          >
            <Menu className="w-5 h-5 text-white" />
          </Button>

          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          <div className="flex-1 flex flex-col min-w-0">
            <Header />

            <main className="flex-1 p-3 sm:p-6 overflow-auto">
              <div className="max-w-7xl mx-auto">{renderActiveTab()}</div>
            </main>
          </div>
        </div>

        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </div>
    </ContactsProvider>
  )
}
