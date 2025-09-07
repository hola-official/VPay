import { useState, useEffect } from "react";
import {
  Repeat,
  Calendar,
  Clock,
  Play,
  Pause,
  Settings,
  Plus,
  TrendingUp,
  AlertCircle,
  Loader2,
  Wallet,
} from "lucide-react";
import { useInvoices } from "@/hooks/useInvoices";
import { useAccount } from "wagmi";
import { useNavigate } from "react-router-dom";

export default function RecurringPage() {
  const { address: userAddress } = useAccount();
  const [activeTab, setActiveTab] = useState("active");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const {
    recurringInvoices,
    isLoading: invoicesLoading,
    error,
    loadRecurringInvoices,
    stopRecurringInvoice,
    generateRecurringInvoices,
  } = useInvoices();

  const getFrequencyInfo = (frequency) => {
    switch (frequency?.type) {
      case "weekly":
        return { label: "Weekly", icon: "📅", color: "text-blue-400" };
      case "monthly":
        return { label: "Monthly", icon: "📆", color: "text-green-400" };
      case "yearly":
        return { label: "Yearly", icon: "🗓️", color: "text-purple-400" };
      case "custom":
        return {
          label: `Every ${frequency?.customDays || 0} days`,
          icon: "📅",
          color: "text-orange-400",
        };
      default:
        return { label: "Unknown", icon: "❓", color: "text-gray-400" };
    }
  };

  const getStatusInfo = (invoice) => {
    const isActive = invoice?.recurring?.isRecurring;
    const isStopped = invoice?.recurring?.stoppedAt;

    if (isStopped) {
      return {
        icon: Pause,
        color: "text-red-400",
        bgColor: "bg-red-500/20",
        borderColor: "border-red-500/30",
        label: "Stopped",
      };
    } else if (isActive) {
      return {
        icon: Play,
        color: "text-green-400",
        bgColor: "bg-green-500/20",
        borderColor: "border-green-500/30",
        label: "Active",
      };
    } else {
      return {
        icon: Clock,
        color: "text-gray-400",
        bgColor: "bg-gray-500/20",
        borderColor: "border-gray-500/30",
        label: "Inactive",
      };
    }
  };

  // Calculate stats from recurring invoices
  const calculateStats = () => {
    if (!recurringInvoices || recurringInvoices.length === 0) {
      return {
        active: 0,
        totalGenerated: 0,
        nextDue: 0,
        totalRevenue: 0,
      };
    }

    const active = recurringInvoices.filter(
      (invoice) =>
        invoice.recurring?.isRecurring && !invoice.recurring?.stoppedAt
    ).length;

    const totalGenerated = recurringInvoices.reduce(
      (sum, invoice) => sum + (invoice.recurring?.currentCount || 0),
      0
    );

    const nextDue = recurringInvoices.filter((invoice) => {
      if (!invoice.recurring?.isRecurring || invoice.recurring?.stoppedAt)
        return false;
      const nextDate = new Date(invoice.issueDate);
      const now = new Date();
      return nextDate > now;
    }).length;

    const totalRevenue = recurringInvoices.reduce(
      (sum, invoice) =>
        sum + invoice.grandTotal * (invoice.recurring?.currentCount || 0),
      0
    );

    return { active, totalGenerated, nextDue, totalRevenue };
  };

  const handleStopRecurring = async (invoiceId) => {
    if (
      window.confirm("Are you sure you want to stop this recurring invoice?")
    ) {
      setIsLoading(true);
      try {
        await stopRecurringInvoice(invoiceId);
        await loadRecurringInvoices();
      } catch (error) {
        console.error("Error stopping recurring invoice:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleGenerateRecurring = async () => {
    setIsLoading(true);
    try {
      await generateRecurringInvoices();
      await loadRecurringInvoices();
    } catch (error) {
      console.error("Error generating recurring invoices:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load recurring invoices when component mounts
  useEffect(() => {
    if (userAddress) {
      loadRecurringInvoices();
    }
  }, [userAddress, loadRecurringInvoices]);

  const stats = calculateStats();
  const filteredInvoices =
    recurringInvoices?.filter((invoice) => {
      if (activeTab === "active") {
        return invoice.recurring?.isRecurring && !invoice.recurring?.stoppedAt;
      } else if (activeTab === "stopped") {
        return invoice.recurring?.stoppedAt;
      }
      return true;
    }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Recurring Invoices
          </h1>
          <p className="text-gray-400 mt-1">
            Automate your invoice generation with smart scheduling
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateRecurring}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg shadow-green-500/25 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Repeat className="w-4 h-4" />
            )}
            Generate All
          </button>
          <button
            onClick={() => navigate("/invoices/create")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg shadow-blue-500/25 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Recurring
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
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
            Please connect your wallet to view and manage your recurring
            invoices.
          </p>
        </div>
      )}

      {/* Stats Cards */}
      {userAddress && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Play className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Active</p>
                <p className="text-xl font-bold text-white">
                  {invoicesLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    stats.active
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Generated</p>
                <p className="text-xl font-bold text-white">
                  {invoicesLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    stats.totalGenerated
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Next Due</p>
                <p className="text-xl font-bold text-white">
                  {invoicesLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    stats.nextDue
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Repeat className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Revenue</p>
                <p className="text-xl font-bold text-white">
                  {invoicesLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    `$${stats.totalRevenue.toLocaleString()}`
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      {userAddress && (
        <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === "active"
                ? "bg-white/10 text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab("stopped")}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === "stopped"
                ? "bg-white/10 text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Stopped
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === "all"
                ? "bg-white/10 text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            All
          </button>
        </div>
      )}

      {/* Recurring Invoices Grid */}
      {userAddress && (
        <div className="space-y-6">
          {invoicesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                <span className="text-gray-400">
                  Loading recurring invoices...
                </span>
              </div>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <Repeat className="w-12 h-12 mx-auto mb-4 text-gray-400 opacity-50" />
              <h3 className="text-lg font-semibold text-white mb-2">
                No Recurring Invoices
              </h3>
              <p className="text-gray-400">
                {activeTab === "active"
                  ? "No active recurring invoices found"
                  : activeTab === "stopped"
                    ? "No stopped recurring invoices found"
                    : "Create your first recurring invoice to get started"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredInvoices.map((invoice) => {
                const frequencyInfo = getFrequencyInfo(
                  invoice.recurring?.frequency
                );
                const statusInfo = getStatusInfo(invoice);
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={invoice._id}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          #{invoice.invoiceNumber}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {invoice.client?.name || "N/A"}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusInfo.bgColor} ${statusInfo.color} ${statusInfo.borderColor}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Amount and Frequency */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-xl sm:text-2xl font-bold text-white">
                        {invoice.currency || "USD"}{" "}
                        {invoice.grandTotal?.toLocaleString() || 0}
                      </div>
                      <div
                        className={`flex items-center gap-2 ${frequencyInfo.color}`}
                      >
                        <span className="text-lg">{frequencyInfo.icon}</span>
                        <span className="text-sm font-medium">
                          {frequencyInfo.label}
                        </span>
                      </div>
                    </div>

                    {/* Schedule Info */}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-gray-400">Current Count</p>
                        <p className="text-white font-medium">
                          {invoice.recurring?.currentCount || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Start Date</p>
                        <p className="text-white font-medium">
                          {invoice.recurring?.startDate
                            ? new Date(
                                invoice.recurring.startDate
                              ).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Progress */}
                    {invoice.recurring?.endCondition && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">Progress</span>
                          <span className="text-white">
                            {invoice.recurring.currentCount || 0} /{" "}
                            {invoice.recurring.endCondition.value || "∞"}
                          </span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(
                                ((invoice.recurring.currentCount || 0) /
                                  (invoice.recurring.endCondition.value || 1)) *
                                  100,
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {invoice.recurring?.isRecurring &&
                      !invoice.recurring?.stoppedAt ? (
                        <button
                          onClick={() => handleStopRecurring(invoice._id)}
                          disabled={isLoading}
                          className="flex-1 px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all duration-200 text-sm disabled:opacity-50"
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                          ) : (
                            <Pause className="w-4 h-4 inline mr-2" />
                          )}
                          Stop
                        </button>
                      ) : (
                        <button
                          disabled
                          className="flex-1 px-3 py-2 bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded-lg text-sm cursor-not-allowed"
                        >
                          <Pause className="w-4 h-4 inline mr-2" />
                          Stopped
                        </button>
                      )}
                      <button className="px-3 py-2 bg-white/10 text-gray-300 border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-200 text-sm">
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
