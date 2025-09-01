import { useState } from "react";
import { Repeat, Calendar, Clock, Play, Pause, Settings, Plus, TrendingUp, AlertCircle } from "lucide-react";

export default function RecurringPage() {
  const [activeTab, setActiveTab] = useState("active");

  // Mock recurring invoice data
  const mockRecurringInvoices = [
    {
      id: "REC-001",
      invoiceNumber: 1001,
      client: { name: "TechCorp Inc.", email: "billing@techcorp.com" },
      amount: 2500.00,
      frequency: "monthly",
      nextInvoiceDate: "2024-02-15",
      currentCount: 3,
      totalCount: 12,
      status: "active",
      startDate: "2024-01-15",
      endDate: "2024-12-15",
      lastGenerated: "2024-01-15",
      totalGenerated: 3,
      totalRevenue: 7500.00
    },
    {
      id: "REC-002",
      invoiceNumber: 1002,
      client: { name: "Design Studio", email: "accounts@designstudio.com" },
      amount: 1800.00,
      frequency: "weekly",
      nextInvoiceDate: "2024-01-29",
      currentCount: 8,
      totalCount: 52,
      status: "active",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      lastGenerated: "2024-01-22",
      totalGenerated: 8,
      totalRevenue: 14400.00
    }
  ];

  const getFrequencyInfo = (frequency) => {
    switch (frequency) {
      case "weekly":
        return { label: "Weekly", icon: "📅", color: "text-blue-400" };
      case "monthly":
        return { label: "Monthly", icon: "📆", color: "text-green-400" };
      case "yearly":
        return { label: "Yearly", icon: "🗓️", color: "text-purple-400" };
      default:
        return { label: "Unknown", icon: "❓", color: "text-gray-400" };
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case "active":
        return {
          icon: Play,
          color: "text-green-400",
          bgColor: "bg-green-500/20",
          borderColor: "border-green-500/30",
          label: "Active"
        };
      case "paused":
        return {
          icon: Pause,
          color: "text-yellow-400",
          bgColor: "bg-yellow-500/20",
          borderColor: "border-yellow-500/30",
          label: "Paused"
        };
      default:
        return {
          icon: Clock,
          color: "text-gray-400",
          bgColor: "bg-gray-500/20",
          borderColor: "border-gray-500/30",
          label: "Unknown"
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Recurring Invoices</h1>
          <p className="text-gray-400 mt-1">Automate your invoice generation with smart scheduling</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg shadow-blue-500/25">
          <Plus className="w-4 h-4" />
          Create Recurring
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Play className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Active</p>
              <p className="text-xl font-bold text-white">2</p>
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
              <p className="text-xl font-bold text-white">12</p>
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
              <p className="text-xl font-bold text-white">3</p>
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
              <p className="text-xl font-bold text-white">$25,100</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recurring Invoices Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mockRecurringInvoices.map((invoice) => {
          const frequencyInfo = getFrequencyInfo(invoice.frequency);
          const statusInfo = getStatusInfo(invoice.status);
          const StatusIcon = statusInfo.icon;

          return (
            <div key={invoice.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">#{invoice.invoiceNumber}</h3>
                  <p className="text-sm text-gray-400">{invoice.client.name}</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusInfo.bgColor} ${statusInfo.color} ${statusInfo.borderColor}`}>
                  <StatusIcon className="w-3 h-3" />
                  {statusInfo.label}
                </span>
              </div>

              {/* Amount and Frequency */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-2xl font-bold text-white">
                  ${invoice.amount.toLocaleString()}
                </div>
                <div className={`flex items-center gap-2 ${frequencyInfo.color}`}>
                  <span className="text-lg">{frequencyInfo.icon}</span>
                  <span className="text-sm font-medium">{frequencyInfo.label}</span>
                </div>
              </div>

              {/* Schedule Info */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-400">Next Invoice</p>
                  <p className="text-white font-medium">{new Date(invoice.nextInvoiceDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-400">Last Generated</p>
                  <p className="text-white font-medium">{new Date(invoice.lastGenerated).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/30 transition-all duration-200 text-sm">
                  <Pause className="w-4 h-4 inline mr-2" />
                  Pause
                </button>
                <button className="px-3 py-2 bg-white/10 text-gray-300 border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-200 text-sm">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
