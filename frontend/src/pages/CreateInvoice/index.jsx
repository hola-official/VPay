import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Wallet,
  Building2,
  User,
  CreditCard,
} from "lucide-react";

export default function CreateInvoicePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextInvoiceNumber] = useState(1001);

  const [formData, setFormData] = useState({
    invoiceNumber: "",
    creatorId: "", // Wallet address of creator
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

  // Auto-generate invoice number on component mount
  useEffect(() => {
    // In a real app, you'd fetch this from your backend
    setFormData((prev) => ({ ...prev, invoiceNumber: nextInvoiceNumber }));
  }, [nextInvoiceNumber]);

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

  const validateWalletAddress = (address) => {
    return address.startsWith("0x") && address.length === 42;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.creatorId || !validateWalletAddress(formData.creatorId)) {
      alert("Please enter a valid creator wallet address (0x... format)");
      return;
    }

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

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      navigate("/invoices");
    }, 2000);
  };

  const totals = calculateTotals();

  // Update remaining amount when grand total changes
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      subTotalBeforeDiscount: totals.subTotal,
      totalDiscountValue: totals.totalDiscount,
      vatValue: totals.vatValue,
      grandTotal: totals.grandTotal,
      remainingAmount: totals.grandTotal,
    }));
  }, [totals]);

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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Invoice Number
              </label>
              <input
                type="number"
                value={formData.invoiceNumber}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    invoiceNumber: Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                placeholder="Auto-generated"
                required
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">
                Auto-generated for your convenience
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, currency: e.target.value }))
                }
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
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
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    dueDate: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                required
              />
            </div>
          </div>
        </div>

        {/* Client Information */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Client Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Client Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.client.name}
                  required
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      client: { ...prev.client, name: e.target.value },
                    }))
                  }
                  className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                  placeholder="Client company or name"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Client Email <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.client.email}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      client: { ...prev.client, email: e.target.value },
                    }))
                  }
                  className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                  placeholder="client@example.com"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payer Wallet Address (Optional) */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Payer Information (Optional)
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Payer Wallet Address
            </label>
            <div className="relative">
              <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.payerWalletAddr}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    payerWalletAddr: e.target.value,
                  }))
                }
                className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                placeholder="0x... (optional)"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Leave empty if unknown at creation time
            </p>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Invoice Items</h3>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>

          {/* Items Header */}
          <div className="grid grid-cols-12 gap-3 px-4 py-2 bg-white/10 rounded-lg text-sm font-medium text-gray-300 mb-4">
            <div className="col-span-4">Item Name</div>
            <div className="col-span-1">Qty</div>
            <div className="col-span-2">Price</div>
            <div className="col-span-2">Discount %</div>
            <div className="col-span-2">Total</div>
            <div className="col-span-1"></div>
          </div>

          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-3 p-4 bg-white/5 rounded-lg"
              >
                <div className="col-span-4">
                  <input
                    type="text"
                    value={item.itemName}
                    onChange={(e) =>
                      updateItem(index, "itemName", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                    placeholder="Item name"
                    required
                  />
                </div>
                <div className="col-span-1">
                  <input
                    type="number"
                    value={item.qty}
                    onChange={(e) =>
                      updateItem(index, "qty", Number(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                    min="1"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) =>
                      updateItem(index, "price", Number(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    value={item.discPercent}
                    onChange={(e) =>
                      updateItem(index, "discPercent", Number(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="0%"
                  />
                </div>
                <div className="col-span-2">
                  <div className="px-3 py-2 text-white font-medium">
                    ${item.amtAfterDiscount.toLocaleString()}
                  </div>
                </div>
                <div className="col-span-1">
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Settings */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Payment Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Payment Method
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePaymentMethod}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                    formData.paymentMethod === "crypto"
                      ? "bg-blue-500"
                      : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.paymentMethod === "crypto"
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
                <div className="flex items-center gap-2">
                  {formData.paymentMethod === "crypto" ? (
                    <>
                      <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <span className="text-blue-400 text-sm">💙</span>
                      </div>
                      <span className="text-white font-medium">
                        Crypto (USDC/USDT)
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-6 h-6 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <span className="text-green-400 text-sm">🏦</span>
                      </div>
                      <span className="text-white font-medium">
                        Bank Transfer
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                VAT Percentage
              </label>
              <input
                type="number"
                value={formData.vatPercent}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    vatPercent: Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                min="0"
                max="100"
                step="0.01"
                placeholder="0%"
              />
            </div>
          </div>
        </div>

        {/* Bank Payment Details */}
        {formData.paymentMethod === "bank" && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Bank Payment Details <span className="text-red-400">*</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Bank Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                    className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                    placeholder="e.g., Chase Bank"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Account Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                    className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                    placeholder="Account holder name"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Account Number
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                    className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                    placeholder="Account number"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recurring Settings */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Recurring Invoice
            </h3>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
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
                className="w-4 h-4 text-blue-500 bg-white/5 border-white/10 focus:ring-blue-500/50 focus:ring-2"
              />
              <span className="text-white">Enable recurring</span>
            </label>
          </div>

          {formData.recurring.isRecurring && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
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
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                {formData.recurring.frequency.type === "custom" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
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
                              customDays: Number(e.target.value),
                            },
                          },
                        }))
                      }
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                      min="1"
                      placeholder="30"
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
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
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                  >
                    <option value="invoiceCount">After X invoices</option>
                    <option value="endDate">Until specific date</option>
                    <option value="never">Never</option>
                  </select>
                </div>
                {formData.recurring.endCondition.type === "invoiceCount" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Invoice Count
                    </label>
                    <input
                      type="number"
                      value={formData.recurring.endCondition.value}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          recurring: {
                            ...prev.recurring,
                            endCondition: {
                              ...prev.recurring.endCondition,
                              value: Number(e.target.value),
                            },
                          },
                        }))
                      }
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                      min="1"
                      placeholder="12"
                      required
                    />
                  </div>
                )}
                {formData.recurring.endCondition.type === "endDate" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.recurring.endCondition.value}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          recurring: {
                            ...prev.recurring,
                            endCondition: {
                              ...prev.recurring.endCondition,
                              value: e.target.value,
                            },
                          },
                        }))
                      }
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                      required
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Additional Notes
          </h3>
          <textarea
            value={formData.notes}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, notes: e.target.value }))
            }
            rows="3"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
            placeholder="Add any additional notes or terms for this invoice..."
          />
        </div>

        {/* Summary */}
        <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Invoice Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Subtotal</span>
                <span className="text-white">
                  ${totals.subTotal.toLocaleString()}
                </span>
              </div>
              {totals.totalDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Discount</span>
                  <span className="text-green-400">
                    -${totals.totalDiscount.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">
                  VAT ({formData.vatPercent}%)
                </span>
                <span className="text-white">
                  ${totals.vatValue.toLocaleString()}
                </span>
              </div>
              <div className="border-t border-white/10 pt-3">
                <div className="flex justify-between">
                  <span className="text-xl font-semibold text-white">
                    Grand Total
                  </span>
                  <span className="text-2xl font-bold text-white">
                    ${totals.grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm text-gray-400">
                <p>
                  <strong>Creator:</strong>{" "}
                  {formData.creatorId
                    ? `${formData.creatorId.slice(0, 6)}...${formData.creatorId.slice(-4)}`
                    : "Not specified"}
                </p>
                <p>
                  <strong>Client:</strong>{" "}
                  {formData.client.name || "Not specified"}
                </p>
                <p>
                  <strong>Due Date:</strong>{" "}
                  {new Date(formData.dueDate).toLocaleDateString()}
                </p>
                <p>
                  <strong>Payment Method:</strong>{" "}
                  {formData.paymentMethod === "crypto" ? "Crypto" : "Bank"}
                </p>
                <p>
                  <strong>Items:</strong> {formData.items.length}
                </p>
                {formData.recurring.isRecurring && (
                  <p>
                    <strong>Recurring:</strong>{" "}
                    {formData.recurring.frequency.type}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-white/10 text-white border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Creating Invoice...
              </div>
            ) : (
              <>
                <Save className="w-4 h-4 inline mr-2" />
                Create Invoice
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
