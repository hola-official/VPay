import { useState } from "react";
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  FileText,
  DollarSign,
  Calendar,
  User,
} from "lucide-react";

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data to simulate backend integration
  const mockInvoices = [
    {
      id: "INV-001",
      invoiceNumber: 1001,
      client: { name: "TechCorp Inc.", email: "billing@techcorp.com" },
      amount: 2500.0,
      currency: "USD",
      status: "Paid",
      issueDate: "2024-01-15",
      dueDate: "2024-02-15",
      paymentMethod: "crypto",
      cryptoToken: "USDC",
    },
    {
      id: "INV-002",
      invoiceNumber: 1002,
      client: { name: "Design Studio", email: "accounts@designstudio.com" },
      amount: 1800.0,
      currency: "USD",
      status: "Awaiting Payment",
      issueDate: "2024-01-20",
      dueDate: "2024-02-20",
      paymentMethod: "bank",
    },
    {
      id: "INV-003",
      invoiceNumber: 1003,
      client: { name: "Marketing Agency", email: "finance@marketing.com" },
      amount: 3200.0,
      currency: "USD",
      status: "Overdue",
      issueDate: "2024-01-10",
      dueDate: "2024-01-25",
      paymentMethod: "crypto",
      cryptoToken: "USDT",
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "Paid":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Awaiting Payment":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "Overdue":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "Partially Paid":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getPaymentMethodIcon = (method, token) => {
    if (method === "crypto") {
      return token === "USDC" ? "💙" : "💚";
    }
    return "🏦";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Invoices
          </h1>
          <p className="text-gray-400 mt-1">
            Manage your invoices and payment tracking
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg shadow-blue-500/25">
          <Plus className="w-4 h-4" />
          Create Invoice
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Invoices</p>
              <p className="text-xl font-bold text-white">24</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Revenue</p>
              <p className="text-xl font-bold text-white">$45,200</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Pending</p>
              <p className="text-xl font-bold text-white">8</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Overdue</p>
              <p className="text-xl font-bold text-white">3</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
          {["all", "paid", "pending", "overdue"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === tab
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
            />
          </div>
          <button className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {mockInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="hover:bg-white/5 transition-colors duration-200"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-white">
                        #{invoice.invoiceNumber}
                      </p>
                      <p className="text-xs text-gray-400">{invoice.id}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {invoice.client.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {invoice.client.email}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-white">
                      {invoice.currency} {invoice.amount.toLocaleString()}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-white">
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {getPaymentMethodIcon(
                          invoice.paymentMethod,
                          invoice.cryptoToken
                        )}
                      </span>
                      <span className="text-sm text-gray-300">
                        {invoice.paymentMethod === "crypto"
                          ? invoice.cryptoToken
                          : "Bank"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded transition-all duration-200">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded transition-all duration-200">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-all duration-200">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-gray-300 hover:bg-gray-500/20 rounded transition-all duration-200">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal Placeholder */}
      <div className="text-center py-8">
        <p className="text-gray-400 text-sm">
          This is a static UI demonstration. In the real application, clicking
          "Create Invoice" would open a form to create new invoices.
        </p>
      </div>
    </div>
  );
}
