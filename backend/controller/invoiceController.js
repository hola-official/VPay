const Invoice = require("../model/invoiceModel");
const {
  sendInvoiceMail,
  sendRecurringInvoiceMail,
  sendOverdueReminderMail,
} = require("../utils/sendMail");

// Helper function to generate next recurring invoice
const generateNextRecurringInvoice = async (paidInvoice) => {
  const { recurring } = paidInvoice;

  if (!recurring || !recurring.isRecurring) return;

  // Check if we should stop recurring
  if (recurring.endCondition.type === "invoiceCount") {
    if (recurring.currentCount >= recurring.endCondition.value) {
      return; // Stop recurring
    }
  } else if (recurring.endCondition.type === "endDate") {
    if (new Date() >= new Date(recurring.endCondition.value)) {
      return; // Stop recurring
    }
  }

  // Calculate next invoice date
  let nextDate = new Date(paidInvoice.issueDate);

  switch (recurring.frequency.type) {
    case "weekly":
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case "monthly":
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case "yearly":
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    case "custom":
      nextDate.setDate(nextDate.getDate() + recurring.frequency.customDays);
      break;
  }

  // Calculate due date (maintain the same gap as original)
  const originalGap =
    new Date(paidInvoice.dueDate) - new Date(paidInvoice.issueDate);
  const nextDueDate = new Date(nextDate.getTime() + originalGap);

  // Generate new invoice number
  const lastInvoice = await Invoice.findOne({
    creatorId: paidInvoice.creatorId,
  }).sort({ invoiceNumber: -1 });
  const newInvoiceNumber = (lastInvoice?.invoiceNumber || 0) + 1;

  // Create new recurring invoice
  const newRecurringData = {
    ...recurring,
    currentCount: recurring.currentCount + 1,
  };

  const newInvoice = await Invoice.create({
    invoiceNumber: newInvoiceNumber,
    creatorId: paidInvoice.creatorId,
    client: paidInvoice.client,
    paymentDetails: paidInvoice.paymentDetails,
    items: paidInvoice.items,
    issueDate: nextDate,
    dueDate: nextDueDate,
    subTotalBeforeDiscount: paidInvoice.subTotalBeforeDiscount,
    totalDiscountValue: paidInvoice.totalDiscountValue,
    vatPercent: paidInvoice.vatPercent,
    vatValue: paidInvoice.vatValue,
    grandTotal: paidInvoice.grandTotal,
    notes: paidInvoice.notes,
    paymentMethod: paidInvoice.paymentMethod,
    currency: paidInvoice.currency,
    remainingAmount: paidInvoice.grandTotal, // Reset remaining amount
    recurring: newRecurringData,
    parentInvoiceId: paidInvoice._id, // Link to parent invoice
  });

  console.log(`Generated next recurring invoice: ${newInvoice.invoiceNumber}`);

  // Send recurring invoice email to client
  try {
    if (sendRecurringInvoiceMail) {
      await sendRecurringInvoiceMail(newInvoice, {
        name: paidInvoice.creatorId,
        walletAddress: paidInvoice.creatorId,
      });
    }
  } catch (emailError) {
    console.error("Recurring invoice email failed:", emailError);
    // Don't fail the recurring generation if email fails
  }

  return newInvoice;
};

// Create a new invoice
const createInvoice = async (req, res) => {
  try {
    const {
      invoiceNumber,
      creatorId, // wallet address
      client,
      payerWalletAddr,
      paymentDetails,
      items,
      issueDate,
      dueDate,
      subTotalBeforeDiscount,
      totalDiscountValue,
      vatPercent,
      vatValue,
      grandTotal,
      notes,
      paymentMethod,
      currency,
      remainingAmount,
      recurring,
    } = req.body;

    // Validate required fields
    if (!invoiceNumber || !creatorId || !client?.email || !grandTotal) {
      return res.status(400).json({
        success: false,
        message:
          "Invoice number, creator wallet address, client email, and grand total are required",
      });
    }

    // Validate wallet address format for creator
    if (!creatorId.startsWith("0x") || creatorId.length !== 42) {
      return res.status(400).json({
        success: false,
        message: "Invalid creator wallet address format",
      });
    }

    // Validate payer wallet address if provided
    if (
      payerWalletAddr &&
      (!payerWalletAddr.startsWith("0x") || payerWalletAddr.length !== 42)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payer wallet address format",
      });
    }

    // Validate payment method and related details
    if (paymentMethod && !["crypto", "bank"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Payment method must be either 'crypto' or 'bank'",
      });
    }

    // If bank payment, validate bank details
    if (paymentMethod === "bank" && paymentDetails) {
      if (
        !paymentDetails.bankName ||
        !paymentDetails.accountName ||
        !paymentDetails.accountNumber
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Bank name, account name, and account number are required for bank payments",
        });
      }
    }

    // Validate recurring data if provided
    if (recurring && recurring.isRecurring) {
      if (!recurring.frequency || !recurring.frequency.type) {
        return res.status(400).json({
          success: false,
          message:
            "Recurring frequency is required when creating recurring invoice",
        });
      }

      if (
        recurring.frequency.type === "custom" &&
        !recurring.frequency.customDays
      ) {
        return res.status(400).json({
          success: false,
          message: "Custom days are required for custom frequency",
        });
      }

      if (!recurring.endCondition || !recurring.endCondition.type) {
        return res.status(400).json({
          success: false,
          message: "End condition is required for recurring invoice",
        });
      }

      // Initialize current count
      if (!recurring.currentCount) {
        recurring.currentCount = 1;
      }
    }

    // Check if invoice number already exists for this creator
    const existingInvoice = await Invoice.findOne({
      invoiceNumber,
      creatorId,
    });
    if (existingInvoice) {
      return res.status(409).json({
        success: false,
        message: "Invoice with this number already exists for this creator",
      });
    }

    const newInvoice = await Invoice.create({
      invoiceNumber,
      creatorId,
      client,
      payerWalletAddr,
      paymentDetails,
      items,
      issueDate,
      dueDate,
      subTotalBeforeDiscount,
      totalDiscountValue,
      vatPercent,
      vatValue,
      grandTotal,
      notes,
      paymentMethod: paymentMethod || "crypto", // Default to crypto
      currency,
      remainingAmount: remainingAmount || grandTotal, // Default to grand total
      recurring, // Include recurring data
    });

    // Send invoice email if email utility is available
    try {
      if (sendInvoiceMail) {
        await sendInvoiceMail(newInvoice, {
          name: creatorId,
          walletAddress: creatorId,
        });
      }
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // Don't fail the invoice creation if email fails
    }

    res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: newInvoice,
    });
  } catch (error) {
    console.error("Error creating invoice:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Pay invoice with crypto support
const payInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      amountPaid,
      note,
      payerWalletAddr,
      paymentType, // "crypto" or "bank"
      txnHash,
      nftReceiptId,
      cryptoToken, // "USDC" or "USDT"
    } = req.body;

    if (!amountPaid || amountPaid <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount paid is required",
      });
    }

    if (!paymentType || !["crypto", "bank"].includes(paymentType)) {
      return res.status(400).json({
        success: false,
        message: "Payment type must be either 'crypto' or 'bank'",
      });
    }

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Create payment record
    const paymentDetails = {
      amountPaid: Number(amountPaid),
      note,
      paymentDate: new Date(),
      paymentType,
    };

    // Handle crypto payment
    if (paymentType === "crypto") {
      if (!payerWalletAddr) {
        return res.status(400).json({
          success: false,
          message: "Payer wallet address is required for crypto payments",
        });
      }

      // Validate payer wallet address
      if (!payerWalletAddr.startsWith("0x") || payerWalletAddr.length !== 42) {
        return res.status(400).json({
          success: false,
          message: "Invalid payer wallet address format",
        });
      }

      if (!txnHash) {
        return res.status(400).json({
          success: false,
          message: "Transaction hash is required for crypto payments",
        });
      }

      if (!cryptoToken || !["USDC", "USDT"].includes(cryptoToken)) {
        return res.status(400).json({
          success: false,
          message: "Crypto token must be either 'USDC' or 'USDT'",
        });
      }

      // Check if transaction hash already exists
      const existingTxn = await Invoice.findOne({
        "paymentRecords.txnHash": txnHash,
      });

      if (existingTxn) {
        return res.status(409).json({
          success: false,
          message: "Transaction hash already exists",
        });
      }

      paymentDetails.payerWalletAddr = payerWalletAddr;
      paymentDetails.txnHash = txnHash;
      paymentDetails.nftReceiptId = nftReceiptId;
      paymentDetails.cryptoToken = cryptoToken;
    } else if (paymentType === "bank") {
      // For bank payments, we might not have wallet address initially
      if (payerWalletAddr) {
        // Validate if provided
        if (
          !payerWalletAddr.startsWith("0x") ||
          payerWalletAddr.length !== 42
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid payer wallet address format",
          });
        }
        paymentDetails.payerWalletAddr = payerWalletAddr;
      }

      // Set initial verification status for bank payments
      paymentDetails.bankVerificationStatus = "pending";
    }

    // Update invoice
    invoice.paymentRecords.push(paymentDetails);
    invoice.totalAmountReceived += Number(amountPaid);
    invoice.remainingAmount = Math.max(
      invoice.remainingAmount - Number(amountPaid),
      0
    );

    // Set the payer wallet address if provided
    if (payerWalletAddr) {
      invoice.payerWalletAddr = payerWalletAddr;
    }

    // Update status based on remaining amount
    if (invoice.remainingAmount === 0) {
      invoice.invoiceStatus = "Paid";
    } else if (paymentType === "crypto") {
      // Crypto payments are instant
      invoice.invoiceStatus = "Partially Paid";
    } else {
      // Bank payments need verification
      invoice.invoiceStatus = "Payment Pending Verification";
    }

    await invoice.save();

    // Send payment notification email to invoice creator (if email is available)
    // Note: Since we only store wallet addresses, emails are only sent when email addresses are provided
    // In a dApp context, you might want to implement a notification system on the blockchain instead
    try {
      // For now, we'll skip sending emails since we don't have creator emails
      // You can implement this later when you have a way to get creator email addresses
      console.log(
        "Payment notification: Email not sent - no creator email available"
      );
    } catch (emailError) {
      console.error("Payment notification email failed:", emailError);
      // Don't fail the payment if email fails
    }

    // If this is a recurring invoice and it's fully paid, generate next invoice
    if (
      invoice.invoiceStatus === "Paid" &&
      invoice.recurring &&
      invoice.recurring.isRecurring
    ) {
      try {
        await generateNextRecurringInvoice(invoice);
      } catch (recurringError) {
        console.error(
          "Error generating next recurring invoice:",
          recurringError
        );
        // Don't fail the payment if recurring generation fails
      }
    }

    res.status(200).json({
      success: true,
      message: "Invoice payment recorded successfully",
      data: invoice,
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Verify bank payment
const verifyBankPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentRecordId, status, note } = req.body;

    if (!paymentRecordId || !status) {
      return res.status(400).json({
        success: false,
        message: "Payment record ID and status are required",
      });
    }

    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'verified' or 'rejected'",
      });
    }

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Find the payment record
    const paymentRecord = invoice.paymentRecords.id(paymentRecordId);
    if (!paymentRecord) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    if (paymentRecord.paymentType !== "bank") {
      return res.status(400).json({
        success: false,
        message: "Only bank payments can be verified",
      });
    }

    // Update payment record
    paymentRecord.bankVerificationStatus = status;
    paymentRecord.bankVerificationNote = note;

    // Update invoice status if payment is rejected
    if (status === "rejected") {
      // Remove the payment amount from totals
      invoice.totalAmountReceived -= paymentRecord.amountPaid;
      invoice.remainingAmount += paymentRecord.amountPaid;

      // Update invoice status
      if (invoice.totalAmountReceived === 0) {
        invoice.invoiceStatus = "Awaiting Payment";
      } else {
        invoice.invoiceStatus = "Partially Paid";
      }
    } else if (status === "verified") {
      // Update invoice status for verified payment
      if (invoice.remainingAmount === 0) {
        invoice.invoiceStatus = "Paid";
      } else {
        invoice.invoiceStatus = "Partially Paid";
      }
    }

    await invoice.save();

    res.status(200).json({
      success: true,
      message: `Bank payment ${status} successfully`,
      data: invoice,
    });
  } catch (error) {
    console.error("Error verifying bank payment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get transaction details by hash
const getTransactionByHash = async (req, res) => {
  try {
    const { txnHash } = req.params;

    if (!txnHash) {
      return res.status(400).json({
        success: false,
        message: "Transaction hash is required",
      });
    }

    const invoice = await Invoice.findOne({
      "paymentRecords.txnHash": txnHash,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    const paymentRecord = invoice.paymentRecords.find(
      (record) => record.txnHash === txnHash
    );

    res.status(200).json({
      success: true,
      message: "Transaction details retrieved successfully",
      data: {
        invoice: invoice,
        paymentRecord: paymentRecord,
      },
    });
  } catch (error) {
    console.error("Error getting transaction details:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get NFT receipt details
const getNFTReceiptById = async (req, res) => {
  try {
    const { nftReceiptId } = req.params;

    if (!nftReceiptId) {
      return res.status(400).json({
        success: false,
        message: "NFT receipt ID is required",
      });
    }

    const invoice = await Invoice.findOne({
      "paymentRecords.nftReceiptId": nftReceiptId,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "NFT receipt not found",
      });
    }

    const paymentRecord = invoice.paymentRecords.find(
      (record) => record.nftReceiptId === nftReceiptId
    );

    res.status(200).json({
      success: true,
      message: "NFT receipt details retrieved successfully",
      data: {
        invoice: invoice,
        paymentRecord: paymentRecord,
      },
    });
  } catch (error) {
    console.error("Error getting NFT receipt details:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Rest of the existing functions remain the same...
const getAllSentInvoices = async (req, res) => {
  try {
    const { creatorId, invoiceStatus } = req.query;

    if (!creatorId) {
      return res.status(400).json({
        success: false,
        message: "Creator wallet address is required",
      });
    }

    // Validate wallet address format
    if (!creatorId.startsWith("0x") || creatorId.length !== 42) {
      return res.status(400).json({
        success: false,
        message: "Invalid creator wallet address format",
      });
    }

    let query = { creatorId };

    // Filter by invoice status if provided
    if (invoiceStatus) {
      query.invoiceStatus = invoiceStatus;
    }

    const invoices = await Invoice.find(query).sort({ createdAt: -1 });

    // Update overdue status
    const currentDate = new Date();
    const updatePromises = invoices.map(async (invoice) => {
      if (
        invoice.invoiceStatus !== "Paid" &&
        invoice.invoiceStatus !== "Rejected" &&
        invoice.dueDate < currentDate
      ) {
        invoice.invoiceStatus = "Overdue";
        return invoice.save();
      }
      return invoice;
    });

    const updatedInvoices = await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: "Sent invoices retrieved successfully",
      count: updatedInvoices.length,
      data: updatedInvoices,
    });
  } catch (error) {
    console.error("Error getting sent invoices:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all received invoices (invoices where user is the client or payer)
const getAllReceivedInvoices = async (req, res) => {
  try {
    const { clientEmail, payerWalletAddr, invoiceStatus } = req.query;

    if (!clientEmail && !payerWalletAddr) {
      return res.status(400).json({
        success: false,
        message: "Either client email or payer wallet address is required",
      });
    }

    let query = {};

    // Build query based on provided parameters
    if (clientEmail && payerWalletAddr) {
      query.$or = [
        { "client.email": clientEmail },
        { payerWalletAddr: payerWalletAddr },
      ];
    } else if (clientEmail) {
      query["client.email"] = clientEmail;
    } else if (payerWalletAddr) {
      query.payerWalletAddr = payerWalletAddr;
    }

    // Filter by invoice status if provided
    if (invoiceStatus) {
      query.invoiceStatus = invoiceStatus;
    }

    const invoices = await Invoice.find(query).sort({ createdAt: -1 });

    // Update overdue status
    const currentDate = new Date();
    const updatePromises = invoices.map(async (invoice) => {
      if (
        invoice.invoiceStatus !== "Paid" &&
        invoice.invoiceStatus !== "Rejected" &&
        invoice.dueDate < currentDate
      ) {
        invoice.invoiceStatus = "Overdue";
        return invoice.save();
      }
      return invoice;
    });

    const updatedInvoices = await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: "Received invoices retrieved successfully",
      count: updatedInvoices.length,
      data: updatedInvoices,
    });
  } catch (error) {
    console.error("Error getting received invoices:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get invoice by ID
const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findById(id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Update overdue status if needed
    if (
      invoice.invoiceStatus !== "Paid" &&
      invoice.invoiceStatus !== "Rejected" &&
      invoice.dueDate < new Date()
    ) {
      invoice.invoiceStatus = "Overdue";
      await invoice.save();
    }

    res.status(200).json({
      success: true,
      message: "Invoice retrieved successfully",
      data: invoice,
    });
  } catch (error) {
    console.error("Error getting invoice:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update invoice by ID
const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if invoice exists
    const existingInvoice = await Invoice.findById(id);
    if (!existingInvoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Validate wallet addresses if being updated
    if (
      updateData.creatorId &&
      (!updateData.creatorId.startsWith("0x") ||
        updateData.creatorId.length !== 42)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid creator wallet address format",
      });
    }

    if (
      updateData.payerWalletAddr &&
      (!updateData.payerWalletAddr.startsWith("0x") ||
        updateData.payerWalletAddr.length !== 42)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payer wallet address format",
      });
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Invoice updated successfully",
      data: updatedInvoice,
    });
  } catch (error) {
    console.error("Error updating invoice:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Reject invoice
const rejectInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectReason } = req.body;

    if (!rejectReason) {
      return res.status(400).json({
        success: false,
        message: "Reject reason is required",
      });
    }

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    invoice.invoiceStatus = "Rejected";
    invoice.rejectReason = rejectReason;

    const rejectedInvoice = await invoice.save();

    res.status(200).json({
      success: true,
      message: "Invoice rejected successfully",
      data: rejectedInvoice,
    });
  } catch (error) {
    console.error("Error rejecting invoice:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete invoice by ID
const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findByIdAndDelete(id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Invoice deleted successfully",
      data: invoice,
    });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Search invoices
const searchInvoices = async (req, res) => {
  try {
    const { q, creatorId, invoiceStatus, paymentMethod } = req.query;

    let query = {};

    // Add search query if provided
    if (q) {
      query.$or = [
        { invoiceNumber: { $regex: q, $options: "i" } },
        { "client.name": { $regex: q, $options: "i" } },
        { "client.email": { $regex: q, $options: "i" } },
        { notes: { $regex: q, $options: "i" } },
        { currency: { $regex: q, $options: "i" } },
      ];
    }

    // Add filters
    if (creatorId) query.creatorId = creatorId;
    if (invoiceStatus) query.invoiceStatus = invoiceStatus;
    if (paymentMethod) query.paymentMethod = paymentMethod;

    const invoices = await Invoice.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Search completed successfully",
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    console.error("Error searching invoices:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get invoices by creator wallet address
const getInvoicesByWallet = async (req, res) => {
  try {
    const { creatorId } = req.params;

    if (!creatorId) {
      return res.status(400).json({
        success: false,
        message: "Creator wallet address is required",
      });
    }

    // Validate wallet address format
    if (!creatorId.startsWith("0x") || creatorId.length !== 42) {
      return res.status(400).json({
        success: false,
        message: "Invalid wallet address format",
      });
    }

    const invoices = await Invoice.find({ creatorId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: `Invoices created by wallet ${creatorId} retrieved successfully`,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    console.error("Error getting invoices by wallet:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get invoice statistics by wallet
const getInvoiceStats = async (req, res) => {
  try {
    const { creatorId } = req.params;

    if (!creatorId) {
      return res.status(400).json({
        success: false,
        message: "Creator wallet address is required",
      });
    }

    const totalInvoices = await Invoice.countDocuments({ creatorId });
    const paidInvoices = await Invoice.countDocuments({
      creatorId,
      invoiceStatus: "Paid",
    });
    const pendingInvoices = await Invoice.countDocuments({
      creatorId,
      invoiceStatus: "Awaiting Payment",
    });
    const overdueInvoices = await Invoice.countDocuments({
      creatorId,
      invoiceStatus: "Overdue",
    });

    // Calculate total amounts
    const pipeline = [
      { $match: { creatorId } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$grandTotal" },
          totalReceived: { $sum: "$totalAmountReceived" },
          totalRemaining: { $sum: "$remainingAmount" },
        },
      },
    ];

    const amountStats = await Invoice.aggregate(pipeline);
    const amounts = amountStats[0] || {
      totalAmount: 0,
      totalReceived: 0,
      totalRemaining: 0,
    };

    res.status(200).json({
      success: true,
      message: "Invoice statistics retrieved successfully",
      data: {
        totalInvoices,
        paidInvoices,
        pendingInvoices,
        overdueInvoices,
        ...amounts,
        walletAddress: creatorId,
      },
    });
  } catch (error) {
    console.error("Error getting invoice statistics:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Stop recurring invoice
const stopRecurringInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    if (!invoice.recurring || !invoice.recurring.isRecurring) {
      return res.status(400).json({
        success: false,
        message: "Invoice is not a recurring invoice",
      });
    }

    // Stop the recurring by setting isRecurring to false
    invoice.recurring.isRecurring = false;
    invoice.recurring.stoppedAt = new Date();

    await invoice.save();

    res.status(200).json({
      success: true,
      message: "Recurring invoice stopped successfully",
      data: invoice,
    });
  } catch (error) {
    console.error("Error stopping recurring invoice:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Generate and send recurring invoices for all active subscriptions
const generateRecurringInvoices = async (req, res) => {
  try {
    const { creatorId } = req.query;

    let query = {
      "recurring.isRecurring": true,
      invoiceStatus: "Paid",
    };

    // Filter by creator if provided
    if (creatorId) {
      query.creatorId = creatorId;
    }

    const paidRecurringInvoices = await Invoice.find(query);

    if (paidRecurringInvoices.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No paid recurring invoices found",
        count: 0,
      });
    }

    const generationResults = [];

    for (const invoice of paidRecurringInvoices) {
      try {
        // Check if it's time to generate the next invoice
        const shouldGenerate = await shouldGenerateNextRecurring(invoice);

        if (shouldGenerate) {
          const newInvoice = await generateNextRecurringInvoice(invoice);
          if (newInvoice) {
            generationResults.push({
              originalInvoiceId: invoice._id,
              originalInvoiceNumber: invoice.invoiceNumber,
              newInvoiceId: newInvoice._id,
              newInvoiceNumber: newInvoice.invoiceNumber,
              status: "generated",
            });
          }
        } else {
          generationResults.push({
            originalInvoiceId: invoice._id,
            originalInvoiceNumber: invoice.invoiceNumber,
            status: "not yet due",
          });
        }
      } catch (error) {
        generationResults.push({
          originalInvoiceId: invoice._id,
          originalInvoiceNumber: invoice.invoiceNumber,
          status: "failed",
          error: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Recurring invoice generation completed",
      count: paidRecurringInvoices.length,
      results: generationResults,
    });
  } catch (error) {
    console.error("Error generating recurring invoices:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Helper function to check if it's time to generate next recurring invoice
const shouldGenerateNextRecurring = async (invoice) => {
  const { recurring } = invoice;

  if (!recurring || !recurring.isRecurring) return false;

  // Check if we should stop recurring
  if (recurring.endCondition.type === "invoiceCount") {
    if (recurring.currentCount >= recurring.endCondition.value) {
      return false; // Stop recurring
    }
  } else if (recurring.endCondition.type === "endDate") {
    if (new Date() >= new Date(recurring.endCondition.value)) {
      return false; // Stop recurring
    }
  }

  // Calculate when the next invoice should be generated
  let nextInvoiceDate = new Date(invoice.issueDate);

  switch (recurring.frequency.type) {
    case "weekly":
      nextInvoiceDate.setDate(nextInvoiceDate.getDate() + 7);
      break;
    case "monthly":
      nextInvoiceDate.setMonth(nextInvoiceDate.getMonth() + 1);
      break;
    case "yearly":
      nextInvoiceDate.setFullYear(nextInvoiceDate.getFullYear() + 1);
      break;
    case "custom":
      nextInvoiceDate.setDate(
        nextInvoiceDate.getDate() + recurring.frequency.customDays
      );
      break;
  }

  // Check if it's time to generate the next invoice
  return new Date() >= nextInvoiceDate;
};

// Get all recurring invoices
const getAllRecurringInvoices = async (req, res) => {
  try {
    const { creatorId, isActive } = req.query;

    if (!creatorId) {
      return res.status(400).json({
        success: false,
        message: "Creator wallet address is required",
      });
    }

    let query = {
      creatorId,
      "recurring.isRecurring": isActive !== "false", // Default to true unless explicitly false
    };

    const invoices = await Invoice.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Recurring invoices retrieved successfully",
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    console.error("Error getting recurring invoices:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Send overdue reminder emails for all overdue invoices
const sendOverdueReminders = async (req, res) => {
  try {
    const { creatorId } = req.query;

    let query = {
      invoiceStatus: { $nin: ["Paid", "Rejected"] },
      dueDate: { $lt: new Date() },
    };

    // Filter by creator if provided
    if (creatorId) {
      query.creatorId = creatorId;
    }

    const overdueInvoices = await Invoice.find(query);

    if (overdueInvoices.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No overdue invoices found",
        count: 0,
      });
    }

    const emailResults = [];

    for (const invoice of overdueInvoices) {
      try {
        if (invoice.client && invoice.client.email) {
          await sendOverdueReminderMail(invoice, {
            name: invoice.creatorId,
            walletAddress: invoice.creatorId,
          });
          emailResults.push({
            invoiceId: invoice._id,
            invoiceNumber: invoice.invoiceNumber,
            clientEmail: invoice.client.email,
            status: "sent",
          });
        } else {
          emailResults.push({
            invoiceId: invoice._id,
            invoiceNumber: invoice.invoiceNumber,
            clientEmail: null,
            status: "skipped - no email",
          });
        }
      } catch (error) {
        emailResults.push({
          invoiceId: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          clientEmail: invoice.client?.email,
          status: "failed",
          error: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Overdue reminder emails processed",
      count: overdueInvoices.length,
      results: emailResults,
    });
  } catch (error) {
    console.error("Error sending overdue reminders:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get invoice chain (all invoices in a recurring series)
const getInvoiceChain = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    let chainInvoices = [];

    // If this invoice has a parent, find the root
    let rootInvoice = invoice;
    if (invoice.parentInvoiceId) {
      rootInvoice = await Invoice.findById(invoice.parentInvoiceId);
      while (rootInvoice && rootInvoice.parentInvoiceId) {
        rootInvoice = await Invoice.findById(rootInvoice.parentInvoiceId);
      }
    }

    // Get all invoices in the chain
    if (rootInvoice) {
      chainInvoices.push(rootInvoice);

      // Find all child invoices recursively
      const findChildren = async (parentId) => {
        const children = await Invoice.find({ parentInvoiceId: parentId }).sort(
          { createdAt: 1 }
        );

        for (const child of children) {
          chainInvoices.push(child);
          await findChildren(child._id);
        }
      };

      await findChildren(rootInvoice._id);
    } else {
      // If no parent found, this might be the root
      chainInvoices.push(invoice);

      const findChildren = async (parentId) => {
        const children = await Invoice.find({ parentInvoiceId: parentId }).sort(
          { createdAt: 1 }
        );

        for (const child of children) {
          chainInvoices.push(child);
          await findChildren(child._id);
        }
      };

      await findChildren(invoice._id);
    }

    res.status(200).json({
      success: true,
      message: "Invoice chain retrieved successfully",
      count: chainInvoices.length,
      data: chainInvoices,
    });
  } catch (error) {
    console.error("Error getting invoice chain:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  createInvoice,
  getAllSentInvoices,
  getAllReceivedInvoices,
  getInvoiceById,
  updateInvoice,
  rejectInvoice,
  payInvoice,
  deleteInvoice,
  searchInvoices,
  getInvoicesByWallet,
  getInvoiceStats,
  stopRecurringInvoice,
  getAllRecurringInvoices,
  getInvoiceChain,
  sendOverdueReminders,
  generateRecurringInvoices,
};
