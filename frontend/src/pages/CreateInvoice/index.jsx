import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Wallet,
  Building2,
  User,
  CreditCard,
  Loader2,
} from "lucide-react";
import { useInvoices } from "@/hooks/useInvoices";
import ContactSelector from "@/components/ContactSelector";
import currencies from "@/lib/currencies.json";
import { convertCurrency } from "@/lib/currencyConverter";

export default function CreateInvoicePage() {
  const navigate = useNavigate();
  const { address: userAddress } = useAccount();
  const { createInvoice, isLoading, error } = useInvoices();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setNextInvoiceNumber] = useState(1001);
  const [isConvertingCurrency, setIsConvertingCurrency] = useState(false);
  const [convertedAmounts, setConvertedAmounts] = useState({});

  const [formData, setFormData] = useState({
    invoiceNumber: "",
    creatorId: userAddress || "", // Wallet address of creator
    client: {
      name: "",
      email: "",
    },
    payerWalletAddr: "", // Optional payer wallet address
    paymentDetails: {
      bankName: "",
      accountName: "",
      accountNumber: "",
    },
    items: [
      {
        itemName: "",
        qty: 1,
        price: 0,
        discPercent: 0,
        amtAfterDiscount: 0,
        discValue: 0,
        amtBeforeDiscount: 0,
      },
    ],
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    subTotalBeforeDiscount: 0,
    totalDiscountValue: 0,
    vatPercent: 0,
    vatValue: 0,
    grandTotal: 0,
    notes: "",
    paymentMethod: "crypto",
    currency: "USD",
    remainingAmount: 0,
    recurring: {
      isRecurring: false,
      frequency: {
        type: "monthly",
        customDays: 30,
      },
      startDate: new Date().toISOString().split("T")[0],
      endCondition: {
        type: "invoiceCount",
        value: 12,
      },
      currentCount: 1,
    },
  });

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          itemName: "",
          qty: 1,
          price: 0,
          discPercent: 0,
          amtAfterDiscount: 0,
          discValue: 0,
          amtBeforeDiscount: 0,
        },
      ],
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData((prev) => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const updateItem = (index, field, value) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };

      // Calculate item totals
      const item = newItems[index];
      item.amtBeforeDiscount = item.qty * item.price;
      item.discValue = (item.amtBeforeDiscount * item.discPercent) / 100;
      item.amtAfterDiscount = item.amtBeforeDiscount - item.discValue;

      return { ...prev, items: newItems };
    });
  };

  const calculateTotals = () => {
    const subTotal = formData.items.reduce(
      (sum, item) => sum + item.amtAfterDiscount,
      0
    );
    const totalDiscount = formData.items.reduce(
      (sum, item) => sum + item.discValue,
      0
    );
    const vatValue = (subTotal * formData.vatPercent) / 100;
    const grandTotal = subTotal + vatValue;

    return { subTotal, totalDiscount, vatValue, grandTotal };
  };

  const togglePaymentMethod = () => {
    setFormData((prev) => ({
      ...prev,
      paymentMethod: prev.paymentMethod === "crypto" ? "bank" : "crypto",
    }));
  };

  const handleContactSelect = (contact) => {
    setFormData((prev) => ({
      ...prev,
      client: {
        name: contact.fullName,
        email: contact.email || "",
      },
      payerWalletAddr: contact.walletAddress,
    }));
  };

  const handleCurrencyChange = async (newCurrency) => {
    if (newCurrency === formData.currency) return;

    setIsConvertingCurrency(true);
    try {
      const currentTotals = calculateTotals();
      const convertedGrandTotal = await convertCurrency(
        currentTotals.grandTotal,
        formData.currency,
        newCurrency
      );

      setConvertedAmounts({
        grandTotal: convertedGrandTotal,
        subTotal: await convertCurrency(
          currentTotals.subTotal,
          formData.currency,
          newCurrency
        ),
        vatValue: await convertCurrency(
          currentTotals.vatValue,
          formData.currency,
          newCurrency
        ),
        totalDiscount: await convertCurrency(
          currentTotals.totalDiscount,
          formData.currency,
          newCurrency
        ),
      });

      setFormData((prev) => ({
        ...prev,
        currency: newCurrency,
      }));
    } catch (error) {
      console.error("Currency conversion error:", error);
      // Fallback: just change currency without conversion
      setFormData((prev) => ({ ...prev, currency: newCurrency }));
    } finally {
      setIsConvertingCurrency(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userAddress) {
      alert("Please connect your wallet first");
      return;
    }

    // Validation
    if (!formData.client.email) {
      alert("Client email is required");
      return;
    }

    if (formData.paymentMethod === "bank") {
      if (
        !formData.paymentDetails.bankName ||
        !formData.paymentDetails.accountName ||
        !formData.paymentDetails.accountNumber
      ) {
        alert(
          "Bank name, account name, and account number are required for bank payments"
        );
        return;
      }
    }

    if (formData.recurring.isRecurring) {
      if (!formData.recurring.frequency.type) {
        alert("Recurring frequency is required");
        return;
      }
      if (
        formData.recurring.frequency.type === "custom" &&
        !formData.recurring.frequency.customDays
      ) {
        alert("Custom days are required for custom frequency");
        return;
      }
      if (!formData.recurring.endCondition.type) {
        alert("End condition is required for recurring invoice");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Calculate final totals
      const finalTotals = calculateTotals();

      // Prepare invoice data with calculated totals
      const invoiceData = {
        ...formData,
        subTotalBeforeDiscount: finalTotals.subTotal,
        totalDiscountValue: finalTotals.totalDiscount,
        vatValue: finalTotals.vatValue,
        grandTotal: finalTotals.grandTotal,
        remainingAmount: finalTotals.grandTotal,
        creatorId: userAddress, // Set creatorId from userAddress
      };

      // Remove the creatorId from the spread to avoid duplication
      const { creatorId: _, ...finalInvoiceData } = invoiceData;

      await createInvoice(finalInvoiceData);
      navigate("/invoices");
    } catch (error) {
      console.error("Error creating invoice:", error);
      // Error is already handled by the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const totals = calculateTotals();

  // Auto-generate invoice number on component mount
  useEffect(() => {
    const loadInvoiceNumber = async () => {
      if (userAddress) {
        try {
          // Make direct API call to avoid dependency issues
          const response = await fetch(
            `http://localhost:3000/api/invoices/wallet/${userAddress}`
          );
          const data = await response.json();
          const invoices = data.data || [];

          let nextNumber = 1001;
          if (invoices && invoices.length > 0) {
            // Find the highest invoice number
            const maxNumber = Math.max(
              ...invoices.map((invoice) => invoice.invoiceNumber || 0)
            );
            nextNumber = maxNumber + 1;
          }
          setNextInvoiceNumber(nextNumber);
          setFormData((prev) => ({ ...prev, invoiceNumber: nextNumber }));
        } catch (error) {
          console.error("Error generating invoice number:", error);
          setNextInvoiceNumber(1001);
          setFormData((prev) => ({ ...prev, invoiceNumber: 1001 }));
        }
      }
    };

    loadInvoiceNumber();
  }, [userAddress]);

  // Update creatorId when userAddress changes
  useEffect(() => {
    if (userAddress) {
      setFormData((prev) => ({ ...prev, creatorId: userAddress }));
    }
  }, [userAddress]);

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
            Create Invoice
          </h1>
          <p className="text-gray-400 mt-1">
            Create a new invoice for your client
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Invoice Number
              </label>
              <input
                type="number"
                value={formData.invoiceNumber}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    invoiceNumber: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50 transition-all duration-200"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Currency
                {isConvertingCurrency && (
                  <span className="ml-2 text-xs text-blue-400">
                    <Loader2 className="w-3 h-3 inline animate-spin mr-1" />
                    Converting...
                  </span>
                )}
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                disabled={isConvertingCurrency}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50 transition-all duration-200 disabled:opacity-50"
              >
                {currencies.map((currency) => (
                  <option key={currency.value} value={currency.value}>
                    {currency.value} - {currency.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Client Information */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-white">
              Client Information
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-sm text-gray-400">
                Select from contacts:
              </span>
              <ContactSelector
                onSelect={handleContactSelect}
                placeholder="Search contacts..."
                className="w-full sm:w-64"
                showEmail={true}
                showLabel={true}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Client Name
              </label>
              <input
                type="text"
                value={formData.client.name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    client: { ...prev.client, name: e.target.value },
                  }))
                }
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50 transition-all duration-200"
                placeholder="Enter client name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Client Email *
              </label>
              <input
                type="email"
                value={formData.client.email}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    client: { ...prev.client, email: e.target.value },
                  }))
                }
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50 transition-all duration-200"
                placeholder="client@example.com"
                required
              />
            </div>
          </div>
          {formData.payerWalletAddr && (
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-400">
                  Selected Client Wallet:
                </span>
              </div>
              <p className="text-sm text-gray-300 font-mono mt-1">
                {formData.payerWalletAddr}
              </p>
            </div>
          )}
        </div>

        {/* Payment Method */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Payment Method
          </h2>
          <div className="flex gap-4 mb-4">
            <button
              type="button"
              onClick={togglePaymentMethod}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
                formData.paymentMethod === "crypto"
                  ? "bg-blue-500/20 border-blue-500/30 text-blue-400"
                  : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
              }`}
            >
              <Wallet className="w-4 h-4" />
              Crypto
            </button>
            <button
              type="button"
              onClick={togglePaymentMethod}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
                formData.paymentMethod === "bank"
                  ? "bg-blue-500/20 border-blue-500/30 text-blue-400"
                  : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
              }`}
            >
              <Building2 className="w-4 h-4" />
              Bank Transfer
            </button>
          </div>

          {formData.paymentMethod === "bank" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={formData.paymentDetails.bankName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      paymentDetails: {
                        ...prev.paymentDetails,
                        bankName: e.target.value,
                      },
                    }))
                  }
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50 transition-all duration-200"
                  placeholder="Bank name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Account Name
                </label>
                <input
                  type="text"
                  value={formData.paymentDetails.accountName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      paymentDetails: {
                        ...prev.paymentDetails,
                        accountName: e.target.value,
                      },
                    }))
                  }
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50 transition-all duration-200"
                  placeholder="Account holder name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  value={formData.paymentDetails.accountNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      paymentDetails: {
                        ...prev.paymentDetails,
                        accountNumber: e.target.value,
                      },
                    }))
                  }
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50 transition-all duration-200"
                  placeholder="Account number"
                />
              </div>
            </div>
          )}
        </div>

        {/* Invoice Items */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Invoice Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>

          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end"
              >
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Item Name
                  </label>
                  <input
                    type="text"
                    value={item.itemName}
                    onChange={(e) =>
                      updateItem(index, "itemName", e.target.value)
                    }
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50 transition-all duration-200"
                    placeholder="Service or product name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Qty
                  </label>
                  <input
                    type="number"
                    value={item.qty}
                    onChange={(e) =>
                      updateItem(index, "qty", parseInt(e.target.value) || 0)
                    }
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50 transition-all duration-200"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Price
                  </label>
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) =>
                      updateItem(
                        index,
                        "price",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50 transition-all duration-200"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Discount %
                  </label>
                  <input
                    type="number"
                    value={item.discPercent}
                    onChange={(e) =>
                      updateItem(
                        index,
                        "discPercent",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50 transition-all duration-200"
                    step="0.01"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-all duration-200"
                    disabled={formData.items.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dates */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Dates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Issue Date
              </label>
              <input
                type="date"
                value={formData.issueDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    issueDate: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, dueDate: e.target.value }))
                }
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50 transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* Tax and Notes */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Tax & Additional Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                VAT Percentage
              </label>
              <input
                type="number"
                value={formData.vatPercent}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    vatPercent: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50 transition-all duration-200"
                step="0.01"
                min="0"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              rows={3}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50 transition-all duration-200"
              placeholder="Additional notes or terms..."
            />
          </div>
        </div>

        {/* Recurring Invoice */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="recurring"
              checked={formData.recurring.isRecurring}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  recurring: {
                    ...prev.recurring,
                    isRecurring: e.target.checked,
                  },
                }))
              }
              className="w-4 h-4 text-blue-500 bg-white/5 border-white/10 rounded focus:ring-blue-500/50"
            />
            <label
              htmlFor="recurring"
              className="text-lg font-semibold text-white"
            >
              Recurring Invoice
            </label>
          </div>

          {formData.recurring.isRecurring && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Frequency
                </label>
                <select
                  value={formData.recurring.frequency.type}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      recurring: {
                        ...prev.recurring,
                        frequency: {
                          ...prev.recurring.frequency,
                          type: e.target.value,
                        },
                      },
                    }))
                  }
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50 transition-all duration-200"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              {formData.recurring.frequency.type === "custom" && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Custom Days
                  </label>
                  <input
                    type="number"
                    value={formData.recurring.frequency.customDays}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        recurring: {
                          ...prev.recurring,
                          frequency: {
                            ...prev.recurring.frequency,
                            customDays: parseInt(e.target.value) || 0,
                          },
                        },
                      }))
                    }
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50 transition-all duration-200"
                    min="1"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Condition
                </label>
                <select
                  value={formData.recurring.endCondition.type}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      recurring: {
                        ...prev.recurring,
                        endCondition: {
                          ...prev.recurring.endCondition,
                          type: e.target.value,
                        },
                      },
                    }))
                  }
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50 transition-all duration-200"
                >
                  <option value="invoiceCount">Invoice Count</option>
                  <option value="endDate">End Date</option>
                  <option value="never">Never</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Subtotal:</span>
              <span className="text-white">
                {formData.currency}{" "}
                {convertedAmounts.subTotal
                  ? convertedAmounts.subTotal.toLocaleString()
                  : totals.subTotal.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Discount:</span>
              <span className="text-white">
                {formData.currency}{" "}
                {convertedAmounts.totalDiscount
                  ? convertedAmounts.totalDiscount.toLocaleString()
                  : totals.totalDiscount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">
                VAT ({formData.vatPercent}%):
              </span>
              <span className="text-white">
                {formData.currency}{" "}
                {convertedAmounts.vatValue
                  ? convertedAmounts.vatValue.toLocaleString()
                  : totals.vatValue.toLocaleString()}
              </span>
            </div>
            <div className="border-t border-white/10 pt-2">
              <div className="flex justify-between">
                <span className="text-lg font-semibold text-white">Total:</span>
                <span className="text-lg font-semibold text-white">
                  {formData.currency}{" "}
                  {convertedAmounts.grandTotal
                    ? convertedAmounts.grandTotal.toLocaleString()
                    : totals.grandTotal.toLocaleString()}
                </span>
              </div>
            </div>
            {isConvertingCurrency && (
              <div className="text-center text-blue-400 text-sm mt-2">
                <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
                Converting currency...
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting || isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Invoice...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Save className="w-5 h-5" />
                Create Invoice
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
