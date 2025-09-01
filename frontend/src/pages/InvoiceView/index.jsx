import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  CreditCard,
  Wallet,
  Receipt,
  CheckCircle,
  Clock,
  AlertCircle,
  Copy,
  ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";

export default function InvoiceViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("details");
  const [selectedToken, setSelectedToken] = useState("USDC");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock invoice data - in real app, fetch from API
  const mockInvoice = {
    id: "INV-001",
    invoiceNumber: 1001,
    creatorId: "0x8ba1f109551bD432803012645Hac136c772c3c",
    client: {
      name: "TechCorp Inc.",
      email: "billing@techcorp.com",
      address: "123 Business St, Tech City, TC 12345",
    },
    items: [
      {
        itemName: "Web Development Services",
        qty: 1,
        price: 2000.0,
        discPercent: 0,
        amtAfterDiscount: 2000.0,
        discValue: 0,
        amtBeforeDiscount: 2000.0,
      },
      {
        itemName: "UI/UX Design",
        qty: 1,
        price: 500.0,
        discPercent: 0,
        amtAfterDiscount: 500.0,
        discValue: 0,
        amtBeforeDiscount: 500.0,
      },
    ],
    issueDate: "2024-01-15",
    dueDate: "2024-02-15",
    subTotalBeforeDiscount: 2500.0,
    totalDiscountValue: 0,
    vatPercent: 10,
    vatValue: 250.0,
    grandTotal: 2750.0,
    notes: "Payment due within 30 days. Late fees may apply.",
    paymentMethod: "crypto",
    currency: "USD",
    remainingAmount: 2750.0,
    invoiceStatus: "Awaiting Payment",
    paymentRecords: [],
  };

  useEffect(() => {
    setPaymentAmount(mockInvoice.remainingAmount);
  }, []);

  const getStatusInfo = (status) => {
    switch (status) {
      case "Paid":
        return {
          icon: CheckCircle,
          color: "text-green-400",
          bgColor: "bg-green-500/20",
          borderColor: "border-green-500/30",
          label: "Paid",
        };
      case "Awaiting Payment":
        return {
          icon: Clock,
          color: "text-yellow-400",
          bgColor: "bg-yellow-500/20",
          borderColor: "border-yellow-500/30",
          label: "Awaiting Payment",
        };
      case "Overdue":
        return {
          icon: AlertCircle,
          color: "text-red-400",
          bgColor: "bg-red-500/20",
          borderColor: "border-red-500/30",
          label: "Overdue",
        };
      default:
        return {
          icon: Clock,
          color: "text-gray-400",
          bgColor: "bg-gray-500/20",
          borderColor: "border-gray-500/30",
          label: status,
        };
    }
  };

  const getTokenIcon = (token) => {
    return token === "USDC" ? "💙" : "💚";
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      // Navigate to payment success or show success message
    }, 2000);
  };

  const StatusIcon = getStatusInfo(mockInvoice.invoiceStatus).icon;

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
            Invoice #{mockInvoice.invoiceNumber}
          </h1>
          <p className="text-gray-400 mt-1">
            {mockInvoice.client.name} • {mockInvoice.invoiceStatus}
          </p>
        </div>
      </div>

      {/* Status Banner */}
      <div
        className={`bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-6`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${getStatusInfo(mockInvoice.invoiceStatus).bgColor}`}
            >
              <StatusIcon
                className={`w-6 h-6 ${getStatusInfo(mockInvoice.invoiceStatus).color}`}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {getStatusInfo(mockInvoice.invoiceStatus).label}
              </h3>
              <p className="text-gray-400">
                Due: {new Date(mockInvoice.dueDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">
              ${mockInvoice.remainingAmount.toLocaleString()}
            </p>
            <p className="text-gray-400">Remaining</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
        {["details", "payment", "history"].map((tab) => (
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
      {activeTab === "details" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Invoice Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Info */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Invoice Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Invoice Number</p>
                  <p className="text-white font-medium">
                    #{mockInvoice.invoiceNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Issue Date</p>
                  <p className="text-white font-medium">
                    {new Date(mockInvoice.issueDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Due Date</p>
                  <p className="text-white font-medium">
                    {new Date(mockInvoice.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Currency</p>
                  <p className="text-white font-medium">
                    {mockInvoice.currency}
                  </p>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Items</h3>
              <div className="space-y-4">
                {mockInvoice.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <div>
                      <p className="text-white font-medium">{item.itemName}</p>
                      <p className="text-sm text-gray-400">Qty: {item.qty}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">
                        ${item.amtAfterDiscount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-400">
                        ${item.price.toLocaleString()} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {mockInvoice.notes && (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Notes</h3>
                <p className="text-gray-300">{mockInvoice.notes}</p>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white">
                    ${mockInvoice.subTotalBeforeDiscount.toLocaleString()}
                  </span>
                </div>
                {mockInvoice.totalDiscountValue > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Discount</span>
                    <span className="text-green-400">
                      -${mockInvoice.totalDiscountValue.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">
                    VAT ({mockInvoice.vatPercent}%)
                  </span>
                  <span className="text-white">
                    ${mockInvoice.vatValue.toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-white/10 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-white">
                      Total
                    </span>
                    <span className="text-lg font-bold text-white">
                      ${mockInvoice.grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg shadow-blue-500/25">
                <Download className="w-4 h-4 inline mr-2" />
                Download PDF
              </button>
              <button className="w-full px-4 py-3 bg-white/10 text-white border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-200">
                <Receipt className="w-4 h-4 inline mr-2" />
                View Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "payment" && (
        <div className="space-y-6">
          {/* Payment Methods */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Payment Methods
            </h3>

            {/* Crypto Payment */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  id="crypto"
                  name="paymentMethod"
                  value="crypto"
                  defaultChecked
                  className="w-4 h-4 text-blue-500 bg-white/5 border-white/10 focus:ring-blue-500/50 focus:ring-2"
                />
                <label htmlFor="crypto" className="text-white font-medium">
                  Crypto Payment
                </label>
              </div>

              <div className="ml-7 space-y-4">
                {/* Token Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Select Token
                  </label>
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
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Payment Amount
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      min="0"
                      max={mockInvoice.remainingAmount}
                      step="0.01"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                      placeholder="Enter amount"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      {selectedToken}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    Remaining: ${mockInvoice.remainingAmount.toLocaleString()}
                  </p>
                </div>

                {/* Payment Button */}
                <button
                  onClick={handlePayment}
                  disabled={
                    isProcessing ||
                    paymentAmount <= 0 ||
                    paymentAmount > mockInvoice.remainingAmount
                  }
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 inline mr-2" />
                      Pay with {selectedToken}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Bank Payment Option */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  id="bank"
                  name="paymentMethod"
                  value="bank"
                  className="w-4 h-4 text-blue-500 bg-white/5 border-white/10 focus:ring-blue-500/50 focus:ring-2"
                />
                <label htmlFor="bank" className="text-white font-medium">
                  Bank Transfer
                </label>
              </div>
              <p className="text-sm text-gray-400 ml-7 mt-2">
                Contact the invoice creator for bank transfer details
              </p>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              Payment Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400 mb-2">Creator Wallet:</p>
                <div className="flex items-center gap-2">
                  <p className="text-blue-400 font-mono break-all">
                    {mockInvoice.creatorId}
                  </p>
                  <button
                    onClick={() => copyToClipboard(mockInvoice.creatorId)}
                    className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-all duration-200"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
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
                <p className="text-gray-400 mb-2">Smart Contract:</p>
                <button className="text-blue-400 hover:text-blue-300 text-xs">
                  View on PolygonScan{" "}
                  <ExternalLink className="w-3 h-3 inline ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Payment History
          </h3>
          {mockInvoice.paymentRecords.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-400">No payments recorded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mockInvoice.paymentRecords.map((payment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        Payment #{index + 1}
                      </p>
                      <p className="text-sm text-gray-400">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">
                      ${payment.amountPaid.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-400">
                      {payment.paymentType}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
