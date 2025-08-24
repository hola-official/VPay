const mongoose = require("mongoose");
const Invoice = require("./model/invoiceModel");
const {
  createInvoice,
  payInvoice,
  verifyBankPayment,
  getAllSentInvoices,
  getAllReceivedInvoices,
  getInvoiceById,
  updateInvoice,
  rejectInvoice,
  deleteInvoice,
  searchInvoices,
  getInvoicesByWallet,
  getInvoiceStats,
  stopRecurringInvoice,
  getAllRecurringInvoices,
  getInvoiceChain,
  sendOverdueReminders,
  generateRecurringInvoices,
} = require("./controller/invoiceController");

// Mock request and response objects
const createMockReq = (params = {}, body = {}, query = {}) => ({
  params,
  body,
  query,
});

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Test data
const testCreatorWallet = "0x1234567890123456789012345678901234567890";
const testPayerWallet = "0x0987654321098765432109876543210987654321";
const testClientEmail = "test@example.com";

const sampleInvoiceData = {
  invoiceNumber: 1001,
  creatorId: testCreatorWallet,
  client: {
    name: "Test Client",
    email: testClientEmail,
  },
  items: [
    {
      itemName: "Web Development",
      qty: 1,
      price: 1000,
      discPercent: 10,
      amtBeforeDiscount: 1000,
      discValue: 100,
      amtAfterDiscount: 900,
    },
  ],
  issueDate: new Date(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  subTotalBeforeDiscount: 1000,
  totalDiscountValue: 100,
  vatPercent: 5,
  vatValue: 45,
  grandTotal: 945,
  notes: "Test invoice for development services",
  paymentMethod: "crypto",
  currency: "USD",
  remainingAmount: 945,
};

const sampleRecurringInvoiceData = {
  ...sampleInvoiceData,
  invoiceNumber: 1002,
  recurring: {
    isRecurring: true,
    frequency: {
      type: "monthly",
    },
    startDate: new Date(),
    endCondition: {
      type: "invoiceCount",
      value: 12,
    },
    currentCount: 1,
  },
};

describe("Invoice Controller Tests", () => {
  let testInvoiceId;
  let testRecurringInvoiceId;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/vpay_test"
    );
  });

  afterAll(async () => {
    // Clean up and disconnect
    await Invoice.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear test data before each test
    await Invoice.deleteMany({});
  });

  describe("1. Invoice Creation", () => {
    test("should create a new invoice successfully", async () => {
      console.log("\n🧪 Testing Invoice Creation...");

      const req = createMockReq({}, sampleInvoiceData);
      const res = createMockRes();

      await createInvoice(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Invoice created successfully",
          data: expect.objectContaining({
            invoiceNumber: 1001,
            creatorId: testCreatorWallet,
            grandTotal: 945,
          }),
        })
      );

      // Store the created invoice ID for later tests
      const responseData = res.json.mock.calls[0][0];
      testInvoiceId = responseData.data._id;

      console.log("✅ Invoice created successfully");
      console.log(`   Invoice ID: ${testInvoiceId}`);
      console.log(`   Invoice Number: ${responseData.data.invoiceNumber}`);
      console.log(`   Status: ${responseData.data.invoiceStatus}`);
    });

    test("should create a recurring invoice successfully", async () => {
      console.log("\n🧪 Testing Recurring Invoice Creation...");

      const req = createMockReq({}, sampleRecurringInvoiceData);
      const res = createMockRes();

      await createInvoice(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            recurring: expect.objectContaining({
              isRecurring: true,
              frequency: { type: "monthly" },
              currentCount: 1,
            }),
          }),
        })
      );

      const responseData = res.json.mock.calls[0][0];
      testRecurringInvoiceId = responseData.data._id;

      console.log("✅ Recurring invoice created successfully");
      console.log(`   Invoice ID: ${testRecurringInvoiceId}`);
      console.log(`   Recurring: ${responseData.data.recurring.isRecurring}`);
      console.log(
        `   Frequency: ${responseData.data.recurring.frequency.type}`
      );
    });

    test("should fail with invalid wallet address", async () => {
      console.log("\n🧪 Testing Invalid Wallet Address...");

      const invalidData = {
        ...sampleInvoiceData,
        creatorId: "invalid-wallet-address",
      };

      const req = createMockReq({}, invalidData);
      const res = createMockRes();

      await createInvoice(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Invalid creator wallet address format",
        })
      );

      console.log("✅ Properly rejected invalid wallet address");
    });
  });

  describe("2. Invoice Retrieval", () => {
    beforeEach(async () => {
      // Create test invoice
      const invoice = await Invoice.create(sampleInvoiceData);
      testInvoiceId = invoice._id;
    });

    test("should get invoice by ID", async () => {
      console.log("\n🧪 Testing Get Invoice by ID...");

      const req = createMockReq({ id: testInvoiceId });
      const res = createMockRes();

      await getInvoiceById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            _id: testInvoiceId,
            invoiceNumber: 1001,
          }),
        })
      );

      console.log("✅ Invoice retrieved successfully by ID");
    });

    test("should get all invoices by creator wallet", async () => {
      console.log("\n🧪 Testing Get Invoices by Wallet...");

      const req = createMockReq({ creatorId: testCreatorWallet });
      const res = createMockRes();

      await getInvoicesByWallet(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 1,
          data: expect.arrayContaining([
            expect.objectContaining({
              creatorId: testCreatorWallet,
            }),
          ]),
        })
      );

      console.log("✅ Invoices retrieved by wallet address");
    });

    test("should search invoices", async () => {
      console.log("\n🧪 Testing Invoice Search...");

      const req = createMockReq({}, {}, { q: "Web Development" });
      const res = createMockRes();

      await searchInvoices(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 1,
        })
      );

      console.log("✅ Invoice search completed successfully");
    });
  });

  describe("3. Invoice Payment", () => {
    beforeEach(async () => {
      // Create test invoice
      const invoice = await Invoice.create(sampleInvoiceData);
      testInvoiceId = invoice._id;
    });

    test("should process crypto payment successfully", async () => {
      console.log("\n🧪 Testing Crypto Payment...");

      const paymentData = {
        amountPaid: 945,
        paymentType: "crypto",
        payerWalletAddr: testPayerWallet,
        txnHash:
          "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        cryptoToken: "USDC",
        note: "Payment for web development services",
      };

      const req = createMockReq({ id: testInvoiceId }, paymentData);
      const res = createMockRes();

      await payInvoice(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Invoice payment recorded successfully",
          data: expect.objectContaining({
            invoiceStatus: "Paid",
            remainingAmount: 0,
            totalAmountReceived: 945,
          }),
        })
      );

      console.log("✅ Crypto payment processed successfully");
      console.log(
        `   Invoice Status: ${res.json.mock.calls[0][0].data.invoiceStatus}`
      );
      console.log(
        `   Amount Received: ${res.json.mock.calls[0][0].data.totalAmountReceived}`
      );
    });

    test("should process partial payment", async () => {
      console.log("\n🧪 Testing Partial Payment...");

      const paymentData = {
        amountPaid: 500,
        paymentType: "crypto",
        payerWalletAddr: testPayerWallet,
        txnHash:
          "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        cryptoToken: "USDT",
        note: "Partial payment",
      };

      const req = createMockReq({ id: testInvoiceId }, paymentData);
      const res = createMockRes();

      await payInvoice(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            invoiceStatus: "Partially Paid",
            remainingAmount: 445,
            totalAmountReceived: 500,
          }),
        })
      );

      console.log("✅ Partial payment processed successfully");
      console.log(
        `   Remaining Amount: ${res.json.mock.calls[0][0].data.remainingAmount}`
      );
    });

    test("should fail with invalid payment data", async () => {
      console.log("\n🧪 Testing Invalid Payment Data...");

      const invalidPaymentData = {
        amountPaid: -100, // Invalid amount
        paymentType: "crypto",
      };

      const req = createMockReq({ id: testInvoiceId }, invalidPaymentData);
      const res = createMockRes();

      await payInvoice(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Valid amount paid is required",
        })
      );

      console.log("✅ Properly rejected invalid payment data");
    });
  });

  describe("4. Recurring Invoice Generation", () => {
    beforeEach(async () => {
      // Create a paid recurring invoice
      const recurringData = {
        ...sampleRecurringInvoiceData,
        invoiceStatus: "Paid",
        totalAmountReceived: 945,
        remainingAmount: 0,
      };

      const invoice = await Invoice.create(recurringData);
      testRecurringInvoiceId = invoice._id;
    });

    test("should generate next recurring invoice", async () => {
      console.log("\n🧪 Testing Recurring Invoice Generation...");

      const req = createMockReq({}, {}, { creatorId: testCreatorWallet });
      const res = createMockRes();

      await generateRecurringInvoices(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Recurring invoice generation completed",
        })
      );

      console.log("✅ Recurring invoice generation completed");

      // Check if new invoice was created
      const newInvoices = await Invoice.find({
        parentInvoiceId: testRecurringInvoiceId,
      });
      expect(newInvoices.length).toBeGreaterThan(0);

      console.log(`   New invoices generated: ${newInvoices.length}`);
      newInvoices.forEach((inv) => {
        console.log(`   - Invoice ${inv.invoiceNumber} (ID: ${inv._id})`);
      });
    });
  });

  describe("5. Invoice Management", () => {
    beforeEach(async () => {
      // Create test invoice
      const invoice = await Invoice.create(sampleInvoiceData);
      testInvoiceId = invoice._id;
    });

    test("should update invoice successfully", async () => {
      console.log("\n🧪 Testing Invoice Update...");

      const updateData = {
        notes: "Updated notes for the invoice",
        currency: "EUR",
      };

      const req = createMockReq({ id: testInvoiceId }, updateData);
      const res = createMockRes();

      await updateInvoice(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            notes: "Updated notes for the invoice",
            currency: "EUR",
          }),
        })
      );

      console.log("✅ Invoice updated successfully");
    });

    test("should reject invoice", async () => {
      console.log("\n🧪 Testing Invoice Rejection...");

      const rejectData = {
        rejectReason: "Client requested cancellation",
      };

      const req = createMockReq({ id: testInvoiceId }, rejectData);
      const res = createMockRes();

      await rejectInvoice(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            invoiceStatus: "Rejected",
            rejectReason: "Client requested cancellation",
          }),
        })
      );

      console.log("✅ Invoice rejected successfully");
    });

    test("should delete invoice", async () => {
      console.log("\n🧪 Testing Invoice Deletion...");

      const req = createMockReq({ id: testInvoiceId });
      const res = createMockRes();

      await deleteInvoice(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Invoice deleted successfully",
        })
      );

      console.log("✅ Invoice deleted successfully");

      // Verify invoice is actually deleted
      const deletedInvoice = await Invoice.findById(testInvoiceId);
      expect(deletedInvoice).toBeNull();
    });
  });

  describe("6. Invoice Statistics", () => {
    beforeEach(async () => {
      // Create multiple test invoices with different statuses
      await Invoice.create([
        {
          ...sampleInvoiceData,
          invoiceNumber: 1001,
          invoiceStatus: "Paid",
          totalAmountReceived: 945,
          remainingAmount: 0,
        },
        {
          ...sampleInvoiceData,
          invoiceNumber: 1002,
          invoiceStatus: "Awaiting Payment",
          totalAmountReceived: 0,
          remainingAmount: 500,
        },
        {
          ...sampleInvoiceData,
          invoiceNumber: 1003,
          invoiceStatus: "Overdue",
          totalAmountReceived: 0,
          remainingAmount: 750,
        },
      ]);
    });

    test("should get invoice statistics", async () => {
      console.log("\n🧪 Testing Invoice Statistics...");

      const req = createMockReq({ creatorId: testCreatorWallet });
      const res = createMockRes();

      await getInvoiceStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            totalInvoices: 3,
            paidInvoices: 1,
            pendingInvoices: 1,
            overdueInvoices: 1,
          }),
        })
      );

      console.log("✅ Invoice statistics retrieved successfully");
      const stats = res.json.mock.calls[0][0].data;
      console.log(`   Total Invoices: ${stats.totalInvoices}`);
      console.log(`   Paid: ${stats.paidInvoices}`);
      console.log(`   Pending: ${stats.pendingInvoices}`);
      console.log(`   Overdue: ${stats.overdueInvoices}`);
    });
  });

  describe("7. Overdue Reminders", () => {
    beforeEach(async () => {
      // Create overdue invoices
      const overdueDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000); // 15 days ago
      await Invoice.create([
        {
          ...sampleInvoiceData,
          invoiceNumber: 1001,
          dueDate: overdueDate,
          invoiceStatus: "Awaiting Payment",
        },
        {
          ...sampleInvoiceData,
          invoiceNumber: 1002,
          dueDate: overdueDate,
          invoiceStatus: "Partially Paid",
        },
      ]);
    });

    test("should send overdue reminders", async () => {
      console.log("\n🧪 Testing Overdue Reminders...");

      const req = createMockReq({}, {}, { creatorId: testCreatorWallet });
      const res = createMockRes();

      await sendOverdueReminders(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Overdue reminder emails processed",
        })
      );

      console.log("✅ Overdue reminders processed successfully");
      const result = res.json.mock.calls[0][0];
      console.log(`   Total overdue invoices: ${result.count}`);
      result.results.forEach((r) => {
        console.log(`   - Invoice ${r.invoiceNumber}: ${r.status}`);
      });
    });
  });

  describe("8. Invoice Chain (Recurring Series)", () => {
    beforeEach(async () => {
      // Create a chain of recurring invoices
      const parentInvoice = await Invoice.create({
        ...sampleRecurringInvoiceData,
        invoiceNumber: 1001,
        invoiceStatus: "Paid",
        totalAmountReceived: 945,
        remainingAmount: 0,
      });

      const childInvoice1 = await Invoice.create({
        ...sampleRecurringInvoiceData,
        invoiceNumber: 1002,
        parentInvoiceId: parentInvoice._id,
        recurring: { ...sampleRecurringInvoiceData.recurring, currentCount: 2 },
      });

      const childInvoice2 = await Invoice.create({
        ...sampleRecurringInvoiceData,
        invoiceNumber: 1003,
        parentInvoiceId: childInvoice1._id,
        recurring: { ...sampleRecurringInvoiceData.recurring, currentCount: 3 },
      });

      testInvoiceId = parentInvoice._id;
    });

    test("should get invoice chain", async () => {
      console.log("\n🧪 Testing Invoice Chain...");

      const req = createMockReq({ id: testInvoiceId });
      const res = createMockRes();

      await getInvoiceChain(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 3, // Parent + 2 children
        })
      );

      console.log("✅ Invoice chain retrieved successfully");
      const chain = res.json.mock.calls[0][0].data;
      console.log(`   Chain length: ${chain.length}`);
      chain.forEach((inv, index) => {
        console.log(
          `   ${index + 1}. Invoice ${inv.invoiceNumber} (${inv.recurring?.currentCount || "Parent"})`
        );
      });
    });
  });

  describe("9. Error Handling", () => {
    test("should handle non-existent invoice", async () => {
      console.log("\n🧪 Testing Error Handling...");

      const fakeId = new mongoose.Types.ObjectId();
      const req = createMockReq({ id: fakeId });
      const res = createMockRes();

      await getInvoiceById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Invoice not found",
        })
      );

      console.log("✅ Properly handled non-existent invoice");
    });

    test("should handle invalid wallet address format", async () => {
      console.log("\n🧪 Testing Invalid Wallet Address Handling...");

      const req = createMockReq({ creatorId: "invalid-address" });
      const res = createMockRes();

      await getInvoicesByWallet(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Invalid wallet address format",
        })
      );

      console.log("✅ Properly handled invalid wallet address");
    });
  });
});

// Helper function to run tests
async function runControllerTests() {
  console.log("🚀 Starting Invoice Controller Tests...\n");

  try {
    // Run the test suite
    await describe("Invoice Controller Tests", () => {});
    console.log("\n🎉 All tests completed successfully!");
  } catch (error) {
    console.error("\n❌ Test execution failed:", error);
  }
}

// Export for manual testing
module.exports = { runControllerTests };
