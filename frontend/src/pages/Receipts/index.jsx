import { useState } from "react";
import { Receipt, Download, Eye, ExternalLink, CheckCircle, Clock, AlertCircle, Image, FileText } from "lucide-react";

export default function ReceiptsPage() {
  const [activeTab, setActiveTab] = useState("all");

  // Mock receipt data
  const mockReceipts = [
    {
      id: "NFT-001",
      invoiceId: "INV-001",
      amount: 2500.00,
      token: "USDC",
      status: "verified",
      txnHash: "0x1234...5678",
      payer: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
      creator: "0x8ba1f109551bD432803012645Hac136c772c3c",
      timestamp: "2024-01-15T10:30:00Z",
      metadataURI: "ipfs://QmX...",
      imageURL: "https://via.placeholder.com/300x200/1e40af/ffffff?text=Receipt+NFT",
      gasUsed: "45,000",
      gasPrice: "20 Gwei"
    },
    {
      id: "NFT-002",
      invoiceId: "INV-003",
      amount: 1800.00,
      token: "USDT",
      status: "pending",
      txnHash: "0x8765...4321",
      payer: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
      creator: "0x8ba1f109551bD432803012645Hac136c772c3c",
      timestamp: "2024-01-20T14:15:00Z",
      metadataURI: "ipfs://QmY...",
      imageURL: "https://via.placeholder.com/300x200/059669/ffffff?text=Receipt+NFT",
      gasUsed: "52,000",
      gasPrice: "18 Gwei"
    },
    {
      id: "NFT-003",
      invoiceId: "INV-002",
      amount: 3200.00,
      token: "USDC",
      status: "failed",
      txnHash: "0x9876...5432",
      payer: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
      creator: "0x8ba1f109551bD432803012645Hac136c772c3c",
      timestamp: "2024-01-18T09:45:00Z",
      metadataURI: null,
      imageURL: null,
      gasUsed: "48,000",
      gasPrice: "22 Gwei",
      error: "Transaction failed"
    }
  ];

  const getStatusInfo = (status) => {
    switch (status) {
      case "verified":
        return {
          icon: CheckCircle,
          color: "text-green-400",
          bgColor: "bg-green-500/20",
          borderColor: "border-green-500/30",
          label: "Verified"
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
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Payment Receipts</h1>
          <p className="text-gray-400 mt-1">NFT receipts and payment verification records</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg shadow-blue-500/25">
          <Receipt className="w-4 h-4" />
          View All Receipts
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Verified</p>
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
              <Receipt className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total NFTs</p>
              <p className="text-xl font-bold text-white">23</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
        {["all", "verified", "pending", "failed"].map((tab) => (
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

      {/* Receipts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockReceipts.map((receipt) => {
          const statusInfo = getStatusInfo(receipt.status);
          const StatusIcon = statusInfo.icon;

          return (
            <div key={receipt.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-all duration-200">
              {/* NFT Image */}
              {receipt.imageURL ? (
                <div className="relative h-48 bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                  <img 
                    src={receipt.imageURL} 
                    alt={`Receipt ${receipt.id}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusInfo.bgColor} ${statusInfo.color} ${statusInfo.borderColor}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                  <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-2" />
                    <p className="text-red-400 text-sm">No Image</p>
                  </div>
                </div>
              )}

              {/* Receipt Details */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">{receipt.id}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getTokenIcon(receipt.token)}</span>
                    <span className="text-sm text-gray-300">{receipt.token}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Amount:</span>
                    <span className="text-white font-medium">{receipt.amount.toLocaleString()} {receipt.token}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Invoice:</span>
                    <span className="text-white font-medium">{receipt.invoiceId}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Date:</span>
                    <span className="text-white font-medium">{new Date(receipt.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Transaction Hash */}
                <div className="mb-4">
                  <p className="text-xs text-gray-400 mb-1">Transaction Hash:</p>
                  <p className="text-xs text-blue-400 font-mono break-all">{receipt.txnHash}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-all duration-200 text-sm">
                    <Eye className="w-4 h-4 inline mr-2" />
                    View
                  </button>
                  {receipt.metadataURI && (
                    <button className="px-3 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-all duration-200 text-sm">
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                  <button className="px-3 py-2 bg-white/10 text-gray-300 border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-200 text-sm">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Smart Contract Integration */}
      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-3">NFT Receipt System</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400 mb-2">Smart Contract Features:</p>
            <ul className="text-white space-y-1">
              <li>• ERC-721 NFT standard</li>
              <li>• IPFS metadata storage</li>
              <li>• Gas-optimized minting</li>
              <li>• Batch payment support</li>
            </ul>
          </div>
          <div>
            <p className="text-gray-400 mb-2">Receipt Benefits:</p>
            <ul className="text-white space-y-1">
              <li>• Immutable payment proof</li>
              <li>• Collectible digital assets</li>
              <li>• Easy verification</li>
              <li>• Transferable ownership</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Backend Integration Info */}
      <div className="text-center py-8">
        <p className="text-gray-400 text-sm">
          This UI demonstrates the NFT receipt system. Each payment generates:
        </p>
        <ul className="text-gray-300 text-sm mt-2 space-y-1">
          <li>• Unique NFT receipt with payment details</li>
          <li>• IPFS metadata with invoice information</li>
          <li>• On-chain verification and ownership</li>
          <li>• Transferable and collectible digital assets</li>
        </ul>
      </div>
    </div>
  );
}
