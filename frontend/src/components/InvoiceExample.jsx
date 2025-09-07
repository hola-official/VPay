import React from "react";
import { useInvoices } from "@/hooks/useInvoices";

// Example component showing how to use the useInvoices hook
export default function InvoiceExample() {
  const {
    // State
    invoices,
    sentInvoices,
    receivedInvoices,
    recurringInvoices,
    isLoading,
    error,
    stats,

    // Actions
    loadSentInvoices,
    loadReceivedInvoices,
    loadRecurringInvoices,
    loadInvoiceStats,
    createInvoice,
    getInvoiceById,
    updateInvoice,
    payInvoice,
    rejectInvoice,
    stopRecurringInvoice,
    deleteInvoice,
    searchInvoices,
    getInvoiceChain,
    getTransactionByHash,
    getNFTReceiptById,
    generateRecurringInvoices,
    sendOverdueReminders,
    getInvoicesByWallet,
  } = useInvoices();

  // Example: Create a new invoice
  const handleCreateInvoice = async () => {
    try {
      const newInvoice = await createInvoice({
        invoiceNumber: 1001,
        client: {
          name: "Example Client",
          email: "client@example.com",
        },
        items: [
          {
            itemName: "Web Development",
            qty: 1,
            price: 1000,
            discPercent: 0,
            amtAfterDiscount: 1000,
            discValue: 0,
            amtBeforeDiscount: 1000,
          },
        ],
        issueDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        subTotalBeforeDiscount: 1000,
        totalDiscountValue: 0,
        vatPercent: 10,
        vatValue: 100,
        grandTotal: 1100,
        remainingAmount: 1100,
        currency: "USD",
        paymentMethod: "crypto",
        notes: "Example invoice",
      });
      console.log("Invoice created:", newInvoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
    }
  };

  // Example: Load invoices with status filter
  const handleLoadPaidInvoices = async () => {
    try {
      const paidInvoices = await loadSentInvoices("Paid");
      console.log("Paid invoices:", paidInvoices);
    } catch (error) {
      console.error("Error loading paid invoices:", error);
    }
  };

  // Example: Search invoices
  const handleSearchInvoices = async () => {
    try {
      const searchResults = await searchInvoices("web development", {
        invoiceStatus: "Awaiting Payment",
      });
      console.log("Search results:", searchResults);
    } catch (error) {
      console.error("Error searching invoices:", error);
    }
  };

  // Example: Pay an invoice
  const handlePayInvoice = async (invoiceId) => {
    try {
      const paymentData = {
        amountPaid: 1100,
        note: "Payment via crypto",
        paymentType: "crypto",
        txnHash: "0x1234567890abcdef...",
        cryptoToken: "USDC",
      };

      const updatedInvoice = await payInvoice(invoiceId, paymentData);
      console.log("Invoice paid:", updatedInvoice);
    } catch (error) {
      console.error("Error paying invoice:", error);
    }
  };

  // Example: Get invoice statistics
  const handleLoadStats = async () => {
    try {
      const invoiceStats = await loadInvoiceStats();
      console.log("Invoice statistics:", invoiceStats);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Invoice Hook Examples</h1>

      {/* Display current state */}
      <div className="bg-white/5 rounded-lg p-4 space-y-2">
        <h2 className="text-lg font-semibold text-white">Current State</h2>
        <p className="text-gray-300">Loading: {isLoading ? "Yes" : "No"}</p>
        <p className="text-gray-300">Error: {error || "None"}</p>
        <p className="text-gray-300">Sent Invoices: {sentInvoices.length}</p>
        <p className="text-gray-300">
          Received Invoices: {receivedInvoices.length}
        </p>
        <p className="text-gray-300">
          Recurring Invoices: {recurringInvoices.length}
        </p>
        {stats && (
          <div className="text-gray-300">
            <p>Total Invoices: {stats.totalInvoices}</p>
            <p>Paid Invoices: {stats.paidInvoices}</p>
            <p>Pending Invoices: {stats.pendingInvoices}</p>
            <p>Overdue Invoices: {stats.overdueInvoices}</p>
          </div>
        )}
      </div>

      {/* Example actions */}
      <div className="bg-white/5 rounded-lg p-4 space-y-4">
        <h2 className="text-lg font-semibold text-white">Example Actions</h2>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleCreateInvoice}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create Invoice
          </button>

          <button
            onClick={handleLoadPaidInvoices}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Load Paid Invoices
          </button>

          <button
            onClick={handleSearchInvoices}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Search Invoices
          </button>

          <button
            onClick={handleLoadStats}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Load Stats
          </button>
        </div>
      </div>

      {/* Display invoices */}
      {sentInvoices.length > 0 && (
        <div className="bg-white/5 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-white mb-4">
            Sent Invoices
          </h2>
          <div className="space-y-2">
            {sentInvoices.slice(0, 3).map((invoice) => (
              <div
                key={invoice._id}
                className="border border-white/10 rounded p-3"
              >
                <p className="text-white font-medium">
                  #{invoice.invoiceNumber}
                </p>
                <p className="text-gray-300 text-sm">{invoice.client?.name}</p>
                <p className="text-gray-300 text-sm">
                  {invoice.currency} {invoice.grandTotal} -{" "}
                  {invoice.invoiceStatus}
                </p>
                <button
                  onClick={() => handlePayInvoice(invoice._id)}
                  className="mt-2 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                >
                  Pay Invoice
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
