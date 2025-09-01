import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Download,
  Share2,
  Eye,
  Receipt,
  CreditCard,
  Calendar,
  Hash,
  Wallet,
} from "lucide-react";

export default function NFTViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // Mock NFT data - in real app, fetch from API
  const mockNFT = {
    id: "NFT-001",
    receiptId: 1001,
    invoiceId: "INV-001",
    amount: 2500.0,
    token: "USDC",
    status: "verified",
    txnHash:
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    payer: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    creator: "0x8ba1f109551bD432803012645Hac136c772c3c",
    timestamp: "2024-01-15T10:30:00Z",
    metadataURI:
      "ipfs://QmX1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    imageURL:
      "https://via.placeholder.com/600x400/1e40af/ffffff?text=Payment+Receipt+NFT",
    gasUsed: "45,000",
    gasPrice: "20 Gwei",
    network: "Polygon Mainnet",
    contractAddress: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    blockNumber: 12345678,
    confirmations: 12,
    invoiceDetails: {
      clientName: "TechCorp Inc.",
      clientEmail: "billing@techcorp.com",
      issueDate: "2024-01-15",
      dueDate: "2024-02-15",
      description: "Web Development Services",
    },
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const getTokenIcon = (token) => {
    return token === "USDC" ? "💙" : "💚";
  };

  const shortenAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            NFT Receipt #{mockNFT.receiptId}
          </h1>
          <p className="text-gray-400 mt-1">
            Payment receipt for Invoice {mockNFT.invoiceId}
          </p>
        </div>
      </div>

      {/* NFT Image Banner */}
      <div className="relative">
        <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl overflow-hidden">
          <img
            src={mockNFT.imageURL}
            alt={`NFT Receipt ${mockNFT.id}`}
            className="w-full h-64 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center border border-green-500/30">
                  <Receipt className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Payment Receipt
                  </h2>
                  <p className="text-gray-300">Verified on {mockNFT.network}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-white">
                  <span className="text-2xl">
                    {getTokenIcon(mockNFT.token)}
                  </span>
                  <div>
                    <p className="text-2xl font-bold">
                      {mockNFT.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-300">{mockNFT.token}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
        {["overview", "details", "blockchain", "invoice"].map((tab) => (
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

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* NFT Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Receipt Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400 mb-2">Receipt ID</p>
                  <p className="text-white font-medium">#{mockNFT.receiptId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-2">Invoice ID</p>
                  <p className="text-white font-medium">{mockNFT.invoiceId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-2">Payment Date</p>
                  <p className="text-white font-medium">
                    {formatTimestamp(mockNFT.timestamp)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-2">Status</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                    Verified
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Payment Details
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Amount Paid</p>
                      <p className="text-sm text-gray-400">
                        {mockNFT.token} Payment
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-white">
                      {mockNFT.amount.toLocaleString()} {mockNFT.token}
                    </p>
                    <p className="text-sm text-gray-400">
                      ≈ ${mockNFT.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-3 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-all duration-200">
                  <Download className="w-4 h-4 inline mr-2" />
                  Download Receipt
                </button>
                <button className="w-full px-4 py-3 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-all duration-200">
                  <Share2 className="w-4 h-4 inline mr-2" />
                  Share Receipt
                </button>
                <button className="w-full px-4 py-3 bg-white/10 text-white border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-200">
                  <Eye className="w-4 h-4 inline mr-2" />
                  View on IPFS
                </button>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Network Info
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Network:</span>
                  <span className="text-white">{mockNFT.network}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Block:</span>
                  <span className="text-white">
                    {mockNFT.blockNumber.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Confirmations:</span>
                  <span className="text-white">{mockNFT.confirmations}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "details" && (
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Transaction Details
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Transaction Hash
                </label>
                <div className="flex items-center gap-2">
                  <p className="text-blue-400 font-mono break-all text-sm">
                    {mockNFT.txnHash}
                  </p>
                  <button
                    onClick={() => copyToClipboard(mockNFT.txnHash)}
                    className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-all duration-200"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Payer Address
                  </label>
                  <div className="flex items-center gap-2">
                    <p className="text-blue-400 font-mono text-sm">
                      {shortenAddress(mockNFT.payer)}
                    </p>
                    <button
                      onClick={() => copyToClipboard(mockNFT.payer)}
                      className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-all duration-200"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Creator Address
                  </label>
                  <div className="flex items-center gap-2">
                    <p className="text-blue-400 font-mono text-sm">
                      {shortenAddress(mockNFT.creator)}
                    </p>
                    <button
                      onClick={() => copyToClipboard(mockNFT.creator)}
                      className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-all duration-200"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Gas Used
                  </label>
                  <p className="text-white">{mockNFT.gasUsed}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Gas Price
                  </label>
                  <p className="text-white">{mockNFT.gasPrice}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Metadata</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  IPFS URI
                </label>
                <div className="flex items-center gap-2">
                  <p className="text-blue-400 font-mono break-all text-sm">
                    {mockNFT.metadataURI}
                  </p>
                  <button
                    onClick={() => copyToClipboard(mockNFT.metadataURI)}
                    className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-all duration-200"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "blockchain" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Blockchain Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400 mb-2">Smart Contract:</p>
                <div className="flex items-center gap-2">
                  <p className="text-blue-400 font-mono break-all">
                    {mockNFT.contractAddress}
                  </p>
                  <button
                    onClick={() => copyToClipboard(mockNFT.contractAddress)}
                    className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-all duration-200"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div>
                <p className="text-gray-400 mb-2">Network:</p>
                <p className="text-white">{mockNFT.network}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-2">Block Number:</p>
                <p className="text-white">
                  {mockNFT.blockNumber.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-400 mb-2">Confirmations:</p>
                <p className="text-white">{mockNFT.confirmations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              External Links
            </h3>
            <div className="space-y-3">
              <button className="w-full px-4 py-3 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-all duration-200 text-left">
                <ExternalLink className="w-4 h-4 inline mr-2" />
                View on PolygonScan
              </button>
              <button className="w-full px-4 py-3 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-all duration-200 text-left">
                <ExternalLink className="w-4 h-4 inline mr-2" />
                View on IPFS Gateway
              </button>
              <button className="w-full px-4 py-3 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-all duration-200 text-left">
                <ExternalLink className="w-4 h-4 inline mr-2" />
                View on OpenSea
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "invoice" && (
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Invoice Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">Client Name</p>
                <p className="text-white font-medium">
                  {mockNFT.invoiceDetails.clientName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">Client Email</p>
                <p className="text-white font-medium">
                  {mockNFT.invoiceDetails.clientEmail}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">Issue Date</p>
                <p className="text-white font-medium">
                  {new Date(
                    mockNFT.invoiceDetails.issueDate
                  ).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">Due Date</p>
                <p className="text-white font-medium">
                  {new Date(
                    mockNFT.invoiceDetails.dueDate
                  ).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-400 mb-2">Description</p>
              <p className="text-white">{mockNFT.invoiceDetails.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
