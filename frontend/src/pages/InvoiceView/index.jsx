import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import {
  ArrowLeft,
  CreditCard,
  Wallet,
  Receipt,
  CheckCircle,
  Clock,
  AlertCircle,
  Copy,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useInvoices } from "@/hooks/useInvoices";
import { convertCurrency } from "@/lib/currencyConverter";
import { toast } from "react-toastify";
import { erc20Abi } from "viem";

const USDC_ADDRESS = "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B";
const USDT_ADDRESS = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";

export default function InvoiceViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { address: userAddress } = useAccount();
  const { getInvoiceById, payInvoice, rejectInvoice, isLoading, error } =
    useInvoices();

  const [activeTab, setActiveTab] = useState("details");
  const [paymentAmount, setPaymentAmount] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [selectedToken, setSelectedToken] = useState("USDC");
  const [txHash, setTxHash] = useState("");
  const [usdConversions, setUsdConversions] = useState({});
  const [isConverting, setIsConverting] = useState(false);

  // Smart contract integration
  const { writeContractAsync } = useWriteContract();
  const { data: txReceipt, isLoading: isWaitingForReceipt } =
    useWaitForTransactionReceipt({
      hash: txHash,
    });

  // Read contract data - only when needed
  const tokenAddress = selectedToken === "USDC" ? USDC_ADDRESS : USDT_ADDRESS;

  useEffect(() => {
    const loadInvoice = async () => {
      try {
        const invoiceData = await getInvoiceById(id);
        setInvoice(invoiceData);
        setPaymentAmount(invoiceData.remainingAmount || 0);

        console.log("Invoice loaded:", invoiceData);
        console.log("Invoice currency:", invoiceData?.currency);

        // Convert amounts to USD if not already USD
        if (
          invoiceData &&
          invoiceData.currency &&
          invoiceData.currency !== "USD"
        ) {
          console.log("Converting amounts to USD...");
          await convertToUSD(invoiceData.grandTotal, invoiceData.currency);
          await convertToUSD(invoiceData.remainingAmount, invoiceData.currency);
          await convertToUSD(
            invoiceData.totalAmountReceived,
            invoiceData.currency
          );
        } else {
          console.log(
            "No conversion needed - invoice is in USD or no currency data"
          );
        }
      } catch (error) {
        console.error("Error loading invoice:", error);
      }
    };

    if (id) {
      loadInvoice();
    }
  }, [id, userAddress, getInvoiceById]);

  const getStatusInfo = (status) => {
    switch (status) {
      case "Paid":
        return {
          label: "Paid",
          color: "text-green-400",
          bgColor: "bg-green-500/20",
          icon: CheckCircle,
        };
      case "Awaiting Payment":
        return {
          label: "Awaiting Payment",
          color: "text-yellow-400",
          bgColor: "bg-yellow-500/20",
          icon: Clock,
        };
      case "Overdue":
        return {
          label: "Overdue",
          color: "text-red-400",
          bgColor: "bg-red-500/20",
          icon: AlertCircle,
        };
      case "Partially Paid":
        return {
          label: "Partially Paid",
          color: "text-blue-400",
          bgColor: "bg-blue-500/20",
          icon: Clock,
        };
      case "Rejected":
        return {
          label: "Rejected",
          color: "text-gray-400",
          bgColor: "bg-gray-500/20",
          icon: AlertCircle,
        };
      case "Payment Pending Verification":
        return {
          label: "Pending Verification",
          color: "text-purple-400",
          bgColor: "bg-purple-500/20",
          icon: Clock,
        };
      default:
        return {
          label: status,
          color: "text-gray-400",
          bgColor: "bg-gray-500/20",
          icon: Clock,
        };
    }
  };

  // Convert amount to USD
  const convertToUSD = async (amount, currency) => {
    console.log(`Converting ${amount} ${currency} to USD`);

    if (!amount || !currency || currency === "USD") {
      console.log("No conversion needed - already USD or invalid data");
      return amount || 0;
    }

    // Check if we already have the conversion rate cached
    if (usdConversions[currency]) {
      const convertedAmount = amount * usdConversions[currency];
      console.log(
        `Using cached rate: ${usdConversions[currency]}, result: ${convertedAmount}`
      );
      return convertedAmount;
    }

    try {
      setIsConverting(true);
      console.log(`Fetching conversion rate for ${currency} to USD`);
      const convertedAmount = await convertCurrency(amount, currency, "USD");
      console.log(
        `Conversion result: ${amount} ${currency} = ${convertedAmount} USD`
      );

      // Cache the conversion rate for future use
      const rate = convertedAmount / amount;
      setUsdConversions((prev) => ({
        ...prev,
        [currency]: rate,
      }));
      console.log(`Cached rate: ${rate}`);
      return convertedAmount;
    } catch (error) {
      console.error(`Error converting ${currency} to USD:`, error);
      return amount; // Return original amount if conversion fails
    } finally {
      setIsConverting(false);
    }
  };

  // Format currency amount with USD conversion
  const formatCurrencyAmount = (amount, currency, showOriginal = true) => {
    if (!amount) return "$0.00";

    const usdAmount = usdConversions[currency]
      ? amount * usdConversions[currency]
      : amount;

    // Round to 2 decimal places
    const roundedUsdAmount = Math.round(usdAmount * 100) / 100;
    const roundedOriginalAmount = Math.round(amount * 100) / 100;

    if (currency === "USD" || !showOriginal) {
      return `$${roundedUsdAmount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }

    return `${currency} ${roundedOriginalAmount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ($${roundedUsdAmount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })})`;
  };

  const handleCryptoPayment = async () => {
    if (!userAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (userAddress === invoice.creatorId) {
      toast.error("You cannot pay your own invoice");
      return;
    }

    if (paymentAmount <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    if (paymentAmount > invoice.remainingAmount) {
      toast.error(
        `Payment amount cannot exceed remaining amount of ${invoice.currency || "USD"} ${invoice.remainingAmount}`
      );
      return;
    }

    // Check minimum payment requirement (40% of grand total)
    const minimumPayment = invoice.grandTotal * 0.4;
    if (
      paymentAmount < minimumPayment &&
      invoice.remainingAmount > minimumPayment
    ) {
      toast.error(
        `Minimum payment required is ${invoice.currency || "USD"} ${minimumPayment.toFixed(2)} (40% of total amount)`
      );
      return;
    }

    if (!invoice?.creatorId) {
      toast.error("Invalid invoice data");
      return;
    }

    setIsProcessing(true);

    try {
      const amountInWei = BigInt(Math.floor(paymentAmount * 1e6)); // USDC/USDT have 6 decimals

      // Step 1: Check user's token balance using public RPC
      const balanceResponse = await fetch(`https://celo-alfajores.drpc.org`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_call",
          params: [
            {
              to: tokenAddress,
              data: `0x70a08231${userAddress.slice(2).padStart(64, "0")}`, // balanceOf selector + address
            },
            "latest",
          ],
          id: 1,
        }),
      });

      const balanceData = await balanceResponse.json();
      const userBalance = BigInt(balanceData.result || "0x0");

      if (userBalance < amountInWei) {
        toast.error(
          `Insufficient ${selectedToken} balance. You have ${(Number(userBalance) / 1e6).toFixed(2)} ${selectedToken}`
        );
        setIsProcessing(false);
        return;
      }

      // Step 2: Execute the transfer directly (EOA to EOA)
      await executeTransfer(amountInWei);
    } catch (error) {
      console.error("Error processing crypto payment:", error);
      toast.error(
        `Failed to process payment: ${error.message || "Unknown error"}`
      );
      setIsProcessing(false);
    }
  };

  const executeTransfer = useCallback(
    async (amountInWei) => {
      console.log("amountInWei", amountInWei);
      if (amountInWei <= 0) {
        toast.error("Payment amount must be greater than 0");
        return;
      }
      try {
        toast.info(`Transferring ${paymentAmount} ${selectedToken}...`);

        const transferHash = await writeContractAsync({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: "transfer",
          args: [invoice.creatorId, amountInWei],
        });

        setTxHash(transferHash);
        toast.info("Transfer initiated, waiting for confirmation...");
      } catch (error) {
        console.error("Error executing transfer:", error);
        toast.error(`Transfer failed: ${error.message || "Unknown error"}`);
        setIsProcessing(false);
      }
    },
    [
      paymentAmount,
      selectedToken,
      writeContractAsync,
      tokenAddress,
      invoice?.creatorId,
    ]
  );

  const handlePaymentSuccess = useCallback(async () => {
    try {
      // Update backend with payment details
      const paymentData = {
        amountPaid: paymentAmount,
        note: `Crypto payment via ${selectedToken}`,
        payerWalletAddr: userAddress,
        paymentType: "crypto",
        txnHash: txHash,
        cryptoToken: selectedToken,
      };

      await payInvoice(id, paymentData);

      // Reload invoice data
      const updatedInvoice = await getInvoiceById(id);
      setInvoice(updatedInvoice);

      toast.success("Payment processed successfully!");
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Failed to update payment record");
    } finally {
      setIsProcessing(false);
      setTxHash("");
    }
  }, [
    paymentAmount,
    selectedToken,
    userAddress,
    txHash,
    payInvoice,
    id,
    getInvoiceById,
  ]);

  const handleBankPayment = async () => {
    if (!userAddress || userAddress !== invoice.creatorId) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (paymentAmount <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    if (paymentAmount > invoice.remainingAmount) {
      toast.error(
        `Payment amount cannot exceed remaining amount of ${invoice.currency || "USD"} ${invoice.remainingAmount}`
      );
      return;
    }

    // Check minimum payment requirement (40% of grand total)
    const minimumPayment = invoice.grandTotal * 0.4;
    if (
      paymentAmount < minimumPayment &&
      invoice.remainingAmount > minimumPayment
    ) {
      toast.error(
        `Minimum payment required is ${invoice.currency || "USD"} ${minimumPayment.toFixed(2)} (40% of total amount)`
      );
      return;
    }

    setIsProcessing(true);

    try {
      if (paymentAmount <= 0) {
        toast.error("Payment amount must be greater than 0");
        return;
      }
      if (paymentAmount > invoice.remainingAmount) {
        toast.error(
          `Payment amount cannot exceed remaining amount of ${invoice.currency || "USD"} ${invoice.remainingAmount}`
        );
        return;
      }

      if (
        paymentAmount < minimumPayment &&
        invoice.remainingAmount > minimumPayment
      ) {
        toast.error(
          `Minimum payment required is ${invoice.currency || "USD"} ${minimumPayment.toFixed(2)} (40% of total amount)`
        );
        return;
      }

      if (!invoice?.creatorId) {
        toast.error("Invalid invoice data");
        return;
      }

      const paymentData = {
        amountPaid: paymentAmount,
        note: "Bank transfer payment",
        payerWalletAddr: userAddress,
        paymentType: "bank",
      };

      await payInvoice(id, paymentData);

      // Reload invoice data
      const updatedInvoice = await getInvoiceById(id);
      setInvoice(updatedInvoice);

      toast.success(
        "Bank payment recorded successfully! Please complete the transfer and wait for verification."
      );
    } catch (error) {
      console.error("Error processing bank payment:", error);
      toast.error("Failed to record bank payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    const rejectReason = prompt(
      "Please provide a reason for rejecting this invoice:"
    );
    if (!rejectReason) return;

    try {
      await rejectInvoice(id, rejectReason);

      // Reload invoice data
      const updatedInvoice = await getInvoiceById(id);
      setInvoice(updatedInvoice);

      toast.success("Invoice rejected successfully!");
    } catch (error) {
      console.error("Error rejecting invoice:", error);
      toast.error("Failed to reject invoice. Please try again.");
    }
  };

  // Handle successful transfer transaction
  useEffect(() => {
    if (txReceipt && txReceipt.status === "success") {
      handlePaymentSuccess();
    } else if (txReceipt && txReceipt.status === "reverted") {
      toast.error("Transfer transaction failed");
      setIsProcessing(false);
    }
  }, [txReceipt, handlePaymentSuccess]);

  const StatusIcon = getStatusInfo(
    invoice?.invoiceStatus || "Awaiting Payment"
  ).icon;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          <span className="text-gray-400">Loading invoice...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Invoice not found</p>
      </div>
    );
  }

  return (
    <div id="invoice-container" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">
              Invoice #{invoice.invoiceNumber}
            </h1>
            <p className="text-sm sm:text-base text-gray-400 mt-1 truncate">
              {userAddress === invoice.creatorId
                ? `Created for ${invoice.client?.name || "N/A"}`
                : `From ${invoice.creatorId?.slice(0, 6)}...${invoice.creatorId?.slice(-4)}`}{" "}
              • {invoice.invoiceStatus}
            </p>
          </div>
        </div>
        {/* <button
          onClick={downloadPDF}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all duration-200"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button> */}
      </div>

      {/* Status Banner */}
      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${getStatusInfo(invoice.invoiceStatus).bgColor}`}
            >
              <StatusIcon
                className={`w-5 h-5 sm:w-6 sm:h-6 ${getStatusInfo(invoice.invoiceStatus).color}`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-white">
                {getStatusInfo(invoice.invoiceStatus).label}
              </h3>
              <p className="text-sm text-gray-400">
                Due:{" "}
                {invoice.dueDate
                  ? new Date(invoice.dueDate).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xl sm:text-2xl font-bold text-white">
              {isConverting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Converting...
                </div>
              ) : (
                formatCurrencyAmount(
                  invoice.remainingAmount || 0,
                  invoice.currency || "USD",
                  false // Only show USD in status banner
                )
              )}
            </p>
            <p className="text-sm text-gray-400">
              Remaining{" "}
              {invoice.currency &&
                invoice.currency !== "USD" &&
                `(${invoice.currency} ${invoice.remainingAmount?.toLocaleString() || 0})`}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white/5 rounded-lg p-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("details")}
          className={`flex-1 min-w-0 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
            activeTab === "details"
              ? "bg-white/10 text-white shadow-sm"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Details
        </button>
        <button
          onClick={() => setActiveTab("payment")}
          className={`flex-1 min-w-0 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
            activeTab === "payment"
              ? "bg-white/10 text-white shadow-sm"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Payment
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 min-w-0 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
            activeTab === "history"
              ? "bg-white/10 text-white shadow-sm"
              : "text-gray-400 hover:text-white"
          }`}
        >
          History
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "details" && (
        <div className="space-y-6">
          {/* Invoice Information */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-white mb-4">
              Invoice Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Invoice Number</p>
                <p className="text-white font-medium">
                  #{invoice.invoiceNumber}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Issue Date</p>
                <p className="text-white font-medium">
                  {invoice.issueDate
                    ? new Date(invoice.issueDate).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Due Date</p>
                <p className="text-white font-medium">
                  {invoice.dueDate
                    ? new Date(invoice.dueDate).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Payment Method</p>
                <p className="text-white font-medium capitalize">
                  {invoice.paymentMethod}
                </p>
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-white mb-4">
              Client Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Client Name</p>
                <p className="text-white font-medium">
                  {invoice.client?.name || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Client Email</p>
                <p className="text-white font-medium">
                  {invoice.client?.email || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-white mb-4">
              Invoice Items
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 text-sm font-medium text-gray-400">
                      Item
                    </th>
                    <th className="text-left py-2 text-sm font-medium text-gray-400">
                      Qty
                    </th>
                    <th className="text-left py-2 text-sm font-medium text-gray-400">
                      Price
                    </th>
                    <th className="text-left py-2 text-sm font-medium text-gray-400">
                      Discount
                    </th>
                    <th className="text-left py-2 text-sm font-medium text-gray-400">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {invoice.items?.map((item, index) => (
                    <tr key={index}>
                      <td className="py-2 text-white">{item.itemName}</td>
                      <td className="py-2 text-white">{item.qty}</td>
                      <td className="py-2 text-white">
                        {formatCurrencyAmount(
                          item.price || 0,
                          invoice.currency || "USD"
                        )}
                      </td>
                      <td className="py-2 text-white">
                        {item.discPercent || 0}%
                      </td>
                      <td className="py-2 text-white">
                        {formatCurrencyAmount(
                          item.amtAfterDiscount || 0,
                          invoice.currency || "USD"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-white mb-4">
              Summary
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Subtotal:</span>
                <span className="text-white">
                  {formatCurrencyAmount(
                    invoice.subTotalBeforeDiscount || 0,
                    invoice.currency || "USD"
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Discount:</span>
                <span className="text-white">
                  {formatCurrencyAmount(
                    invoice.totalDiscountValue || 0,
                    invoice.currency || "USD"
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">
                  VAT ({invoice.vatPercent || 0}%):
                </span>
                <span className="text-white">
                  {formatCurrencyAmount(
                    invoice.vatValue || 0,
                    invoice.currency || "USD"
                  )}
                </span>
              </div>
              <div className="border-t border-white/10 pt-2">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-white">
                    Total:
                  </span>
                  <span className="text-lg font-semibold text-white">
                    {formatCurrencyAmount(
                      invoice.grandTotal || 0,
                      invoice.currency || "USD"
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-4">
                Notes
              </h2>
              <p className="text-sm sm:text-base text-gray-300">
                {invoice.notes}
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === "payment" && (
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-white mb-4">
              {userAddress === invoice.creatorId
                ? "Payment Information"
                : "Make Payment"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Payment Amount
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  disabled={
                    userAddress === invoice.creatorId ||
                    invoice.invoiceStatus === "Rejected" ||
                    invoice.invoiceStatus === "Paid"
                  }
                  onChange={(e) =>
                    setPaymentAmount(parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  step="0.01"
                  min="0"
                  placeholder={`Max: ${formatCurrencyAmount(invoice.remainingAmount || 0, invoice.currency || "USD")}`}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Remaining amount:{" "}
                  {formatCurrencyAmount(
                    invoice.remainingAmount || 0,
                    invoice.currency || "USD"
                  )}
                </p>
                <p className="text-xs text-yellow-400 mt-1">
                  Minimum payment:{" "}
                  {formatCurrencyAmount(
                    invoice.grandTotal * 0.4,
                    invoice.currency || "USD"
                  )}{" "}
                  (40% of total)
                </p>
                {userAddress === invoice.creatorId && (
                  <p className="text-xs text-blue-400 mt-2">
                    ℹ️ You cannot pay your own invoice. Share this invoice with
                    your client to receive payment.
                  </p>
                )}
              </div>

              {/* Show payment method based on invoice */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Payment Method
                </label>
                <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white">
                  {invoice.paymentMethod === "crypto" ? (
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-blue-400" />
                      <span>Crypto Payment (USDC/USDT)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-green-400" />
                      <span>Bank Transfer</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Crypto payment options */}
              {invoice.paymentMethod === "crypto" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Select Token
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedToken("USDC")}
                        className={`flex-1 px-4 py-2 rounded-lg border transition-all duration-200 flex items-center justify-center gap-2 ${
                          selectedToken === "USDC"
                            ? "border-blue-500 bg-blue-500/20 text-blue-400"
                            : "border-white/20 text-gray-400 hover:border-white/40 hover:text-white"
                        }`}
                      >
                        <img
                          src="/usdc.png"
                          alt="USDC"
                          className="w-5 h-5"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "inline";
                          }}
                        />
                        USDC
                      </button>
                      <button
                        onClick={() => setSelectedToken("USDT")}
                        className={`flex-1 px-4 py-2 rounded-lg border transition-all duration-200 flex items-center justify-center gap-2 ${
                          selectedToken === "USDT"
                            ? "border-green-500 bg-green-500/20 text-green-400"
                            : "border-white/20 text-gray-400 hover:border-white/40 hover:text-white"
                        }`}
                      >
                        <img
                          src="/usdt.png"
                          alt="USDT"
                          className="w-5 h-5"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "inline";
                          }}
                        />
                        USDT
                      </button>
                    </div>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-blue-400 mb-2">
                      Payment Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Creator:</span>
                        <span className="text-white font-mono">
                          {invoice.creatorId?.slice(0, 6)}...
                          {invoice.creatorId?.slice(-4)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Token:</span>
                        <div className="flex items-center gap-2">
                          <img
                            src={`/${selectedToken.toLowerCase()}.png`}
                            alt={selectedToken}
                            className="w-4 h-4"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                          <span className="text-white">{selectedToken}</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Amount:</span>
                        <span className="text-white">
                          {paymentAmount} {selectedToken}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Bank payment details */}
              {invoice.paymentMethod === "bank" && invoice.paymentDetails && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-green-400 mb-2">
                    Bank Transfer Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    {invoice.paymentDetails.bankName && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Bank:</span>
                        <span className="text-white">
                          {invoice.paymentDetails.bankName}
                        </span>
                      </div>
                    )}
                    {invoice.paymentDetails.accountName && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Account Name:</span>
                        <span className="text-white">
                          {invoice.paymentDetails.accountName}
                        </span>
                      </div>
                    )}
                    {invoice.paymentDetails.accountNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Account Number:</span>
                        <span className="text-white">
                          {invoice.paymentDetails.accountNumber}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {userAddress !== invoice.creatorId && (
                <div className="flex flex-col gap-4 pt-4">
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setPaymentAmount(invoice.remainingAmount)}
                      className="px-3 sm:px-4 py-2 bg-gray-500/20 border border-gray-500/30 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-all duration-200 text-xs sm:text-sm"
                    >
                      Pay Full Amount
                    </button>
                    <button
                      onClick={() => setPaymentAmount(invoice.grandTotal * 0.4)}
                      className="px-3 sm:px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-all duration-200 text-xs sm:text-sm"
                    >
                      Pay 40% Minimum
                    </button>
                    <button
                      onClick={() =>
                        setPaymentAmount(invoice.remainingAmount / 2)
                      }
                      className="px-3 sm:px-4 py-2 bg-gray-500/20 border border-gray-500/30 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-all duration-200 text-xs sm:text-sm"
                    >
                      Pay Half
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    {invoice.paymentMethod === "crypto" ? (
                      <button
                        onClick={handleCryptoPayment}
                        disabled={
                          isProcessing ||
                          paymentAmount <= 0 ||
                          isWaitingForReceipt |
                            (invoice.invoiceStatus === "Rejected") ||
                          invoice.invoiceStatus === "Paid"
                        }
                        className="flex-1 px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {isProcessing || isWaitingForReceipt ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {isWaitingForReceipt
                              ? "Confirming..."
                              : "Processing..."}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            {/* <img
                              src={`/${selectedToken.toLowerCase()}.png`}
                              alt={selectedToken}
                              className="w-5 h-5"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            /> */}
                            <Wallet className="w-5 h-5" />
                            Pay {selectedToken}
                          </div>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={handleBankPayment}
                        disabled={isProcessing || paymentAmount <= 0}
                        className="flex-1 px-4 sm:px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Recording...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <CreditCard className="w-5 h-5" />
                            Record Payment
                          </div>
                        )}
                      </button>
                    )}

                    {invoice.invoiceStatus === "Awaiting Payment" &&
                      userAddress !== invoice.creatorId && (
                        <button
                          onClick={handleReject}
                          className="px-4 sm:px-6 py-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-all duration-200"
                        >
                          Reject Invoice
                        </button>
                      )}
                  </div>
                </div>
              )}

              {/* Creator-specific information */}
              {userAddress === invoice.creatorId && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-4">
                  <h3 className="text-sm font-medium text-blue-400 mb-3">
                    📤 Share Invoice with Client
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-300">
                      Share this invoice with your client to receive payment.
                      They can pay using the payment method you specified.
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Invoice URL:</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          toast.success("Invoice URL copied to clipboard!");
                        }}
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        Copy Link
                      </button>
                    </div>
                    {invoice.client?.email && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Client Email:</span>
                        <span className="text-white">
                          {invoice.client.email}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-white mb-4">
              Payment History
            </h2>

            {invoice.paymentRecords && invoice.paymentRecords.length > 0 ? (
              <div className="space-y-4">
                {invoice.paymentRecords.map((payment, index) => (
                  <div
                    key={index}
                    className="border border-white/10 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            payment.paymentType === "crypto"
                              ? "bg-blue-500/20"
                              : "bg-green-500/20"
                          }`}
                        >
                          {payment.paymentType === "crypto" ? (
                            <Wallet className="w-4 h-4 text-blue-400" />
                          ) : (
                            <CreditCard className="w-4 h-4 text-green-400" />
                          )}
                        </div>
                        {payment.paymentType === "crypto" ? (
                          <Link
                            to={`https://celo-alfajores.blockscout.com/token/${
                              payment.cryptoToken === "USDC"
                                ? "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B"
                                : "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"
                            }`}
                            target="_blank"
                            className="text-white font-medium"
                          >
                            {payment.paymentType === "crypto" &&
                              payment.cryptoToken}
                          </Link>
                        ) : (
                          <span>
                            {payment.paymentType === "bank"
                              ? "Bank Transfer"
                              : "N/A"}
                          </span>
                        )}
                      </div>
                      <span className="text-white font-medium">
                        {formatCurrencyAmount(
                          payment.amountPaid || 0,
                          invoice.currency || "USD"
                        )}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-400">Date:</span>
                        <span className="text-white ml-2">
                          {payment.paymentDate
                            ? new Date(payment.paymentDate).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                      {payment.payerWalletAddr && (
                        <Link
                          to={`https://celo-alfajores.blockscout.com/address/${payment.payerWalletAddr}`}
                          target="_blank"
                        >
                          <span className="text-gray-400">Payer:</span>
                          <span className="text-white ml-2">
                            {payment.payerWalletAddr.slice(0, 6)}...
                            {payment.payerWalletAddr.slice(-4)}
                          </span>
                        </Link>
                      )}
                      {payment.txnHash && (
                        <Link
                          to={`https://celo-alfajores.blockscout.com/tx/${payment.txnHash}`}
                          target="_blank"
                        >
                          <span className="text-gray-400">
                            Transaction Hash:
                          </span>
                          <span className="text-white ml-2">
                            {payment.txnHash.slice(0, 6)}...
                            {payment.txnHash.slice(-4)}
                          </span>
                        </Link>
                      )}
                      {payment.bankVerificationStatus && (
                        <div>
                          <span className="text-gray-400">Status:</span>
                          <span
                            className={`ml-2 ${
                              payment.bankVerificationStatus === "verified"
                                ? "text-green-400"
                                : payment.bankVerificationStatus === "rejected"
                                  ? "text-red-400"
                                  : "text-yellow-400"
                            }`}
                          >
                            {payment.bankVerificationStatus}
                          </span>
                        </div>
                      )}
                    </div>

                    {payment.note && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-400">Note:</span>
                        <span className="text-white ml-2">{payment.note}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-400 opacity-50" />
                <p className="text-gray-400">No payment records found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
