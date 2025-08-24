const express = require("express");
const router = express.Router();

const {
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
} = require("../controller/invoiceController");

// Create a new invoice
// POST /api/invoices
router.post("/", createInvoice);

// Get all sent invoices (invoices created by a wallet address)
// GET /api/invoices/sent?creatorId=0x123...&invoiceStatus=Paid
router.get("/sent", getAllSentInvoices);

// Get all received invoices (invoices where user is client or payer)
// GET /api/invoices/received?clientEmail=user@example.com&payerWalletAddr=0x456...&invoiceStatus=Awaiting Payment
router.get("/received", getAllReceivedInvoices);

// Search invoices
// GET /api/invoices/search?q=invoice&creatorId=0x123...&invoiceStatus=Awaiting Payment&paymentMethod=crypto
router.get("/search", searchInvoices);

// Get all recurring invoices
// GET /api/invoices/recurring?creatorId=0x123...&isActive=true
router.get("/recurring", getAllRecurringInvoices);

// Get invoice statistics by wallet
// GET /api/invoices/stats/0x123...
router.get("/stats/:creatorId", getInvoiceStats);

// Get invoices by creator wallet address
// GET /api/invoices/wallet/0x123...
router.get("/wallet/:creatorId", getInvoicesByWallet);

// Get invoice by ID
// GET /api/invoices/507f1f77bcf86cd799439011
router.get("/:id", getInvoiceById);

// Update invoice by ID
// PUT /api/invoices/507f1f77bcf86cd799439011
router.put("/:id", updateInvoice);

// Reject invoice
// PUT /api/invoices/507f1f77bcf86cd799439011/reject
router.put("/:id/reject", rejectInvoice);

// Pay invoice
// PUT /api/invoices/507f1f77bcf86cd799439011/pay
router.put("/:id/pay", payInvoice);

// Stop recurring invoice
// PUT /api/invoices/507f1f77bcf86cd799439011/stop-recurring
router.put("/:id/stop-recurring", stopRecurringInvoice);

// Get invoice chain (all invoices in a recurring series)
// GET /api/invoices/507f1f77bcf86cd799439011/chain
router.get("/:id/chain", getInvoiceChain);

// Delete invoice by ID
// DELETE /api/invoices/507f1f77bcf86cd799439011
router.delete("/:id", deleteInvoice);

module.exports = router;
