import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Loader2,
  Clock,
  Wallet,
  CreditCard,
} from "lucide-react";
import { useInvoices } from "@/hooks/useInvoices";
import { useAccount } from "wagmi";

export default function InvoicesPage() {
  const navigate = useNavigate();
  const { address: userAddress } = useAccount();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const {
    sentInvoices,
    receivedInvoices,
    isLoading,
    error,
    stats,
    loadSentInvoices,
    loadReceivedInvoices,
    loadInvoiceStats,
    deleteInvoice,
    searchInvoices,
  } = useInvoices();

  // Get invoices based on active tab
  const getInvoicesForTab = () => {
    switch (activeTab) {
      case "sent":
        return sentInvoices;
      case "received":
        return receivedInvoices;
      case "all":
        return [...sentInvoices, ...receivedInvoices];
      default:
        return sentInvoices;
    }
  };

  // Filter invoices by status
  const getFilteredInvoices = () => {
    let invoices = getInvoicesForTab();

    if (selectedStatus && selectedStatus !== "all") {
      invoices = invoices.filter(
        (invoice) => invoice.invoiceStatus === selectedStatus
      );
    }

    return invoices;
  };

  const invoices = getFilteredInvoices();

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
      case "Rejected":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      case "Payment Pending Verification":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getPaymentMethodIcon = (method, token) => {
    if (method === "crypto") {
      return (
        <div className="flex items-center gap-1">
          <img
            src={`/${token?.toLowerCase() || "usdc"}.png`}
            alt={token || "USDC"}
            className="w-4 h-4"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "inline";
            }}
          />
          <span style={{ display: "none" }}>
            {token === "USDC" ? "💙" : "💚"}
          </span>
        </div>
      );
    }
    return <CreditCard className="w-4 h-4 text-green-400" />;
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      if (searchQuery.trim()) {
        await searchInvoices(searchQuery, { invoiceStatus: selectedStatus });
      } else {
        // Reload invoices without search
        if (activeTab === "sent" || activeTab === "all") {
          await loadSentInvoices(selectedStatus);
        }
        if (activeTab === "received" || activeTab === "all") {
          await loadReceivedInvoices(selectedStatus);
        }
      }
      // Reload stats after search/filter
      await loadInvoiceStats();
    } finally {
      setIsSearching(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      try {
        await deleteInvoice(invoiceId);
        // Reload stats after deletion
        await loadInvoiceStats();
      } catch (error) {
        console.error("Error deleting invoice:", error);
      }
    }
  };

  const handleStatusFilter = async (status) => {
    setSelectedStatus(status);
    setIsSearching(true);
    try {
      if (activeTab === "sent" || activeTab === "all") {
        await loadSentInvoices(status === "all" ? null : status);
      }
      if (activeTab === "received" || activeTab === "all") {
        await loadReceivedInvoices(status === "all" ? null : status);
      }
      // Reload stats after filter
      await loadInvoiceStats();
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    // Load invoices when component mounts or tab changes
    if (userAddress) {
      if (activeTab === "sent" || activeTab === "all") {
        loadSentInvoices(selectedStatus === "all" ? null : selectedStatus);
      }
      if (activeTab === "received" || activeTab === "all") {
        loadReceivedInvoices(selectedStatus === "all" ? null : selectedStatus);
      }
      // Load stats
      loadInvoiceStats();
    }
  }, [
    activeTab,
    selectedStatus,
    userAddress,
    loadSentInvoices,
    loadReceivedInvoices,
    loadInvoiceStats,
  ]);

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
        <button
          onClick={() => navigate("/invoices/create")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg shadow-blue-500/25 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Invoice
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      {userAddress && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">
                  {isLoading || isSearching ? (
                    <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                  ) : (
                    stats?.totalInvoices || 0
                  )}
                </p>
                <p className="text-gray-400 text-xs sm:text-sm">
                  Total Invoices
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">
                  {isLoading || isSearching ? (
                    <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                  ) : (
                    `$${(stats?.totalPaidAmount || 0).toLocaleString()}`
                  )}
                </p>
                <p className="text-gray-400 text-xs sm:text-sm">Total Paid</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">
                  {isLoading || isSearching ? (
                    <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                  ) : (
                    `$${(stats?.totalPendingAmount || 0).toLocaleString()}`
                  )}
                </p>
                <p className="text-gray-400 text-xs sm:text-sm">
                  Total Pending
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">
                  {isLoading || isSearching ? (
                    <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                  ) : (
                    `$${(stats?.totalOverdueAmount || 0).toLocaleString()}`
                  )}
                </p>
                <p className="text-gray-400 text-xs sm:text-sm">
                  Total Overdue
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Connection Prompt */}
      {!userAddress && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 text-center">
          <Wallet className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Connect Your Wallet
          </h3>
          <p className="text-gray-400">
            Please connect your wallet to view and manage your invoices.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            activeTab === "all"
              ? "bg-white/10 text-white shadow-sm"
              : "text-gray-400 hover:text-white"
          }`}
        >
          All Invoices
        </button>
        <button
          onClick={() => setActiveTab("sent")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            activeTab === "sent"
              ? "bg-white/10 text-white shadow-sm"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Sent
        </button>
        <button
          onClick={() => setActiveTab("received")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            activeTab === "received"
              ? "bg-white/10 text-white shadow-sm"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Received
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 transition-all duration-200"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50 transition-all duration-200"
          >
            <option value="all">All Status</option>
            <option value="Awaiting Payment">Awaiting Payment</option>
            <option value="Paid">Paid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Overdue">Overdue</option>
            <option value="Rejected">Rejected</option>
            <option value="Payment Pending Verification">
              Pending Verification
            </option>
          </select>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all duration-200"
          >
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
                {/* <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th> */}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {isLoading || isSearching ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                      <span className="text-gray-400">
                        {isSearching ? "Searching..." : "Loading invoices..."}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center">
                    <div className="text-gray-400">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No invoices found</p>
                      <p className="text-sm mt-1">
                        {activeTab === "sent"
                          ? "Create your first invoice to get started"
                          : "No received invoices yet"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr
                    key={invoice._id}
                    className="hover:bg-white/5 transition-colors duration-200 cursor-pointer"
                    onClick={() => navigate(`/invoices/${invoice._id}`)}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-white">
                          #{invoice.invoiceNumber}
                        </p>
                        <p className="text-xs text-gray-400">{invoice._id}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {invoice.client?.name || "N/A"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {invoice.client?.email || "No email"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-white">
                        {invoice.currency || "USD"}{" "}
                        {invoice.grandTotal?.toLocaleString() || 0}
                      </p>
                      {invoice.remainingAmount > 0 && (
                        <p className="text-xs text-gray-400">
                          Remaining: {invoice.currency || "USD"}{" "}
                          {invoice.remainingAmount?.toLocaleString() || 0}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(invoice.invoiceStatus)}`}
                      >
                        {invoice.invoiceStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-white">
                        {invoice.dueDate
                          ? new Date(invoice.dueDate).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {getPaymentMethodIcon(
                            invoice.paymentMethod,
                            invoice.paymentRecords?.[0]?.cryptoToken
                          )}
                        </span>
                        <span className="text-sm text-gray-300">
                          {invoice.paymentMethod === "crypto"
                            ? invoice.paymentRecords?.[0]?.cryptoToken ||
                              "Crypto"
                            : "Bank"}
                        </span>
                      </div>
                    </td>
                    {/* <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/invoices/${invoice._id}`)}
                          className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded transition-all duration-200"
                        >
                        <Eye className="w-4 h-4" />
                      </button>
                        <button
                          onClick={() =>
                            navigate(`/invoices/${invoice._id}/edit`)
                          }
                          className="p-1 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded transition-all duration-200"
                        >
                        <Edit className="w-4 h-4" />
                      </button>
                        <button
                          onClick={() => handleDeleteInvoice(invoice._id)}
                          className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-all duration-200"
                        >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-gray-300 hover:bg-gray-500/20 rounded transition-all duration-200">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                    </td> */}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
