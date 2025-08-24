const mongoose = require("mongoose");

const invoiceSchema = mongoose.Schema(
  {
    invoiceNumber: Number,
    creatorId: { type: String, required: true }, // connected wallet address who created this invoice
    client: { name: String, email: String },
    payerWalletAddr: String, // connected wallet address who paid this invoice
    paymentDetails: {
      bankName: String,
      accountName: String,
      accountNumber: Number,
    },
    items: [
      {
        itemName: String,
        qty: Number,
        price: Number,
        discPercent: Number,
        amtAfterDiscount: Number,
        discValue: Number,
        amtBeforeDiscount: Number,
      },
    ],
    issueDate: Date,
    dueDate: Date,
    subTotalBeforeDiscount: Number,
    totalDiscountValue: Number,
    vatPercent: Number,
    vatValue: Number,
    grandTotal: Number,
    notes: String,
    rejectReason: String,
    paymentMethod: {
      type: String,
      enum: ["crypto", "bank"],
      default: "crypto", // crypto(usdc/usdt), bank(bank payment details)
    },
    invoiceStatus: {
      type: String,
      default: "Awaiting Payment",
    },
    currency: String,
    totalAmountReceived: {
      type: Number,
      default: 0,
    },
    remainingAmount: Number,
    paymentRecords: [
      {
        amountPaid: Number,
        paymentDate: Date,
        note: String,
        payerWalletAddr: String, // Track who made this specific payment
        // Crypto payment specific fields
        txnHash: String, // Transaction hash for crypto payments
        nftReceiptId: String, // NFT receipt ID for crypto payments
        cryptoToken: {
          type: String,
          enum: ["USDC", "USDT"],
        }, // Which crypto token was used
        paymentType: {
          type: String,
          enum: ["crypto", "bank"],
          required: true,
        },
        // Bank payment verification (optional)
        bankVerificationStatus: {
          type: String,
          enum: ["pending", "verified", "rejected"],
        },
        bankVerificationNote: String,
      },
    ],
    // Recurring invoice fields
    recurring: {
      isRecurring: {
        type: Boolean,
        default: false,
      },
      frequency: {
        type: {
          type: String,
          enum: ["weekly", "monthly", "yearly", "custom"],
        },
        customDays: Number, // Only used when type is "custom"
      },
      startDate: Date, // First invoice issue date
      endCondition: {
        type: {
          type: String,
          enum: ["invoiceCount", "endDate", "never"],
        },
        value: mongoose.Schema.Types.Mixed, // Number for invoiceCount, Date for endDate, null for never
      },
      currentCount: {
        type: Number,
        default: 1,
      },
      stoppedAt: Date, // When recurring was manually stopped
    },
    parentInvoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
    }, // Reference to parent invoice in recurring chain
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
invoiceSchema.index({ creatorId: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ "client.email": 1 });
invoiceSchema.index({ payerWalletAddr: 1 });
invoiceSchema.index({ invoiceStatus: 1 });
invoiceSchema.index({ "recurring.isRecurring": 1 });
invoiceSchema.index({ parentInvoiceId: 1 });
// New indexes for crypto payments
invoiceSchema.index({ "paymentRecords.txnHash": 1 });
invoiceSchema.index({ "paymentRecords.nftReceiptId": 1 });

const Invoice = mongoose.model("Invoice", invoiceSchema);

module.exports = Invoice;
