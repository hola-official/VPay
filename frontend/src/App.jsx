import { useState } from "react";
import { Route, Routes } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import Dashboard from "@/pages/Dashboard";
import TokenLockPage from "@/pages/Lock";
import TokenLock from "@/pages/Lock/TOKEN";
import LPLockListPage from "@/pages/Lock/LP";
import Payroll from "@/pages/Payroll";
import { BackgroundEffects } from "@/components/ui/BackgroundEffects";
import ContactsPage from "@/pages/Contact";
import InvoicesPage from "@/pages/Invoices";
import PaymentsPage from "@/pages/Payments";
import RecurringPage from "@/pages/Recurring";
import ReceiptsPage from "@/pages/Receipts";
import SettingsPage from "@/pages/Settings";
import InvoiceViewPage from "@/pages/InvoiceView";
import CreateInvoicePage from "@/pages/CreateInvoice";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <BackgroundEffects />

      <Header onMenuToggle={toggleSidebar} />

      <div className="flex h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)]">
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/invoices/create" element={<CreateInvoicePage />} />
              <Route path="/invoices/:id" element={<InvoiceViewPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/recurring" element={<RecurringPage />} />
              <Route path="/receipts" element={<ReceiptsPage />} />
              <Route path="/create-lock" element={<TokenLockPage />} />
              <Route path="/pay" element={<Payroll />} />
              <Route path="/contact" element={<ContactsPage />} />
              <Route path="/token-lock" element={<TokenLock />} />
              <Route path="/lp-lock" element={<LPLockListPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
