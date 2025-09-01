import { useState } from "react";
import { CreditCard, Wallet, Coins, Receipt, CheckCircle, Clock, AlertCircle, Download, Eye } from "lucide-react";

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState("crypto");
  const [selectedToken, setSelectedToken] = useState("USDC");

  // Mock payment data
  const mockPayments = [
    {
      id: "PAY-001",
      invoiceId: "INV-001",
      amount: 2500.00,
      token: "USDC",
      status: "completed",
      txnHash: "0x1234...5678",
      nftReceiptId: "NFT-001",
      payer: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
      creator: "0x8ba1f109551bD432803012645Hac136c772c3c",
      timestamp: "2024-01-15T10:30:00Z",
      gasUsed: "45,000",
      gasPrice: "20 Gwei"
    },
    {
      id: "PAY-002",
      invoiceId: "INV-003",
      amount: 1800.00,
      token: "USDT",
      status: "pending",
      txnHash: "0x8765...4321",
      nftReceiptId: "NFT-002",
      payer: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
      creator: "0x8ba1f109551bD432803012645Hac136c772c3c",
      timestamp: "2024-01-20T14:15:00Z",
      gasUsed: "52,000",
      gasPrice: "18 Gwei"
    },
    {
      id: "PAY-003",
      invoiceId: "INV-002",
      amount: 3200.00,
      token: "USDC",
      status: "failed",
      txnHash: "0x9876...5432",
      nftReceiptId: null,
      payer: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
      creator: "0x8ba1f109551bD432803012645Hac136c772c3c",
      timestamp: "2024-01-18T09:45:00Z",
      gasUsed: "48,000",
      gasPrice: "22 Gwei",
      error: "Insufficient balance"
    }
  ];

  const getStatusInfo = (status) => {
    switch (status) {
      case "completed":
        return {
          icon: CheckCircle,
          color: "text-green-400",
          bgColor: "bg-green-500/20",
          borderColor: "border-green-500/30",
          label: "Completed"
        };
      case "pending":
        return {
          icon: Clock,
          color: "text-yellow-400",
          bgColor: "bg-yellow-500/20",
          borderColor: "border-yellow-500/30",
          label: "Pending"
        };
      case "failed":
        return {
          icon: AlertCircle,
          color: "text-red-400",
          bgColor: "bg-red-500/20",
          borderColor: "border-red-500/30",
          label: "Failed"
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

  const getTokenIcon = (token) => {
    return token === "USDC" ? "💙" : "💚";
  };

  const shortenAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Payments</h1>
          <p className="text-gray-400 mt-1">Process and track crypto payments with NFT receipts</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg shadow-blue-500/25">
          <CreditCard className="w-4 h-4" />
          Process Payment
        </button>
      </div>

      {/* Payment Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Completed</p>
              <p className="text-xl font-bold text-white">18</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Pending</p>
              <p className="text-xl font-bold text-white">3</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Failed</p>
              <p className="text-xl font-bold text-white">2</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Coins className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Volume</p>
              <p className="text-xl font-bold text-white">$67,400</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Tabs */}
      <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
        {["crypto", "bank", "all"].map((tab) => (
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

      {/* Token Selection for Crypto Payments */}
      {activeTab === "crypto" && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Select Payment Token</h3>
          <div className="flex gap-3">
            {["USDC", "USDT"].map((token) => (
              <button
                key={token}
                onClick={() => setSelectedToken(token)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
                  selectedToken === token
                    ? "border-blue-500 bg-blue-500/20 text-blue-400"
                    : "border-white/20 text-gray-400 hover:border-white/40 hover:text-white"
                }`}
              >
                <span className="text-lg">{getTokenIcon(token)}</span>
                <span>{token}</span>
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-400 mt-2">
            Selected: {selectedToken} - Polygon Network
          </p>
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Invoice</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Transaction</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">NFT Receipt</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {mockPayments.map((payment) => {
                const statusInfo = getStatusInfo(payment.status);
                const StatusIcon = statusInfo.icon;

                return (
                  <tr key={payment.id} className="hover:bg-white/5 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-white">{payment.id}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(payment.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-white">{payment.invoiceId}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getTokenIcon(payment.token)}</span>
                        <p className="text-sm font-medium text-white">
                          {payment.amount.toLocaleString()} {payment.token}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusInfo.bgColor} ${statusInfo.color} ${statusInfo.borderColor}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-400">Hash:</p>
                        <p className="text-xs text-blue-400 font-mono">{payment.txnHash}</p>
                        <p className="text-xs text-gray-400">
                          Gas: {payment.gasUsed} @ {payment.gasPrice}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {payment.nftReceiptId ? (
                        <div className="flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-green-400">{payment.nftReceiptId}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded transition-all duration-200">
                          <Eye className="w-4 h-4" />
                        </button>
                        {payment.nftReceiptId && (
                          <button className="p-1 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded transition-all duration-200">
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Smart Contract Info */}
      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-3">Smart Contract Integration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400 mb-2">Contract Address:</p>
            <p className="text-blue-400 font-mono break-all">
              0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6
            </p>
          </div>
          <div>
            <p className="text-gray-400 mb-2">Network:</p>
            <p className="text-white">Polygon Mainnet</p>
          </div>
          <div>
            <p className="text-gray-400 mb-2">Supported Tokens:</p>
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                💙 USDC
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                💚 USDT
              </span>
            </div>
          </div>
          <div>
            <p className="text-gray-400 mb-2">Features:</p>
            <ul className="text-white space-y-1">
              <li>• Gas-optimized payments</li>
              <li>• NFT receipt generation</li>
              <li>• Batch payment support</li>
              <li>• Reentrancy protection</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Payment Processing Demo */}
      <div className="text-center py-8">
        <p className="text-gray-400 text-sm">
          This UI demonstrates the payment processing system. In the real application, users can:
        </p>
        <ul className="text-gray-300 text-sm mt-2 space-y-1">
          <li>• Connect their wallet to process payments</li>
          <li>• Pay invoices with USDC or USDT</li>
          <li>• Receive NFT receipts as proof of payment</li>
          <li>• Track payment status on-chain</li>
        </ul>
      </div>
    </div>
  );
}
