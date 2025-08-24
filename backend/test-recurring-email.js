const {
  sendRecurringInvoiceMail,
  sendOverdueReminderMail,
} = require("./utils/sendMail");

// Test recurring invoice data
const testRecurringInvoice = {
  _id: "recurring-invoice-123",
  invoiceNumber: "INV-REC-001",
  client: {
    name: "Muhammed Musa",
    email: "smallcode578@gmail.com",
  },
  creatorId: "0x1234567890123456789012345678901234567890",
  grandTotal: 200.0,
  currency: "USD",
  issueDate: new Date(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  items: [
    {
      description: "Monthly Subscription Service",
      quantity: 1,
      unitPrice: 200.0,
      total: 200.0,
    },
  ],
  paymentMethod: "crypto",
  subTotalBeforeDiscount: 200.0,
  totalDiscountValue: 0,
  vatPercent: 0,
  vatValue: 0,
  remainingAmount: 200.0,
  totalAmountReceived: 0,
  invoiceStatus: "Awaiting Payment",
  recurring: {
    isRecurring: true,
    frequency: {
      type: "monthly",
    },
    currentCount: 2,
    endCondition: {
      type: "invoiceCount",
      value: 12,
    },
  },
  parentInvoiceId: "parent-invoice-123",
};

// Test overdue invoice data
const testOverdueInvoice = {
  _id: "overdue-invoice-123",
  invoiceNumber: "INV-OVERDUE-001",
  client: {
    name: "Overdue Client",
    email: "smallcode578@gmail.com",
  },
  creatorId: "0x1234567890123456789012345678901234567890",
  grandTotal: 150.0,
  currency: "USD",
  issueDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
  dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
  items: [
    {
      description: "Overdue Service",
      quantity: 1,
      unitPrice: 150.0,
      total: 150.0,
    },
  ],
  paymentMethod: "crypto",
  subTotalBeforeDiscount: 150.0,
  totalDiscountValue: 0,
  vatPercent: 0,
  vatValue: 0,
  remainingAmount: 150.0,
  totalAmountReceived: 0,
  invoiceStatus: "Overdue",
};

async function testRecurringEmailSystem() {
  console.log("🧪 Testing VPay Recurring Email System...");

  try {
    // Test 1: Send recurring invoice email
    console.log("\n📧 Test 1: Sending recurring invoice email...");
    await sendRecurringInvoiceMail(testRecurringInvoice, {
      name: "Test Creator",
      walletAddress: testRecurringInvoice.creatorId,
    });
    console.log("✅ Recurring invoice email sent successfully!");

    // Test 2: Send overdue reminder email
    console.log("\n📧 Test 2: Sending overdue reminder email...");
    await sendOverdueReminderMail(testOverdueInvoice, {
      name: "Test Creator",
      walletAddress: testOverdueInvoice.creatorId,
    });
    console.log("✅ Overdue reminder email sent successfully!");

    // Test 3: Test with missing client email
    console.log("\n📧 Test 3: Testing with missing client email...");
    const invoiceWithoutEmail = {
      ...testRecurringInvoice,
      client: { name: "No Email Client" },
    };
    await sendRecurringInvoiceMail(invoiceWithoutEmail, {
      name: "Test Creator",
      walletAddress: testRecurringInvoice.creatorId,
    });
    console.log("✅ Gracefully handled missing email for recurring invoice!");

    // Test 4: Test overdue with missing client email
    console.log("\n📧 Test 4: Testing overdue with missing client email...");
    const overdueWithoutEmail = {
      ...testOverdueInvoice,
      client: { name: "No Email Overdue Client" },
    };
    await sendOverdueReminderMail(overdueWithoutEmail, {
      name: "Test Creator",
      walletAddress: testOverdueInvoice.creatorId,
    });
    console.log("✅ Gracefully handled missing email for overdue reminder!");

    console.log(
      "\n🎉 All recurring email tests passed! The system is working correctly."
    );
    console.log(
      "\n📝 Note: Check your email inbox (and spam folder) for the test emails."
    );
    console.log("   - Recurring invoice email");
    console.log("   - Overdue reminder email");
  } catch (error) {
    console.error("\n❌ Recurring email test failed:", error.message);
    console.log("\n🔧 Troubleshooting:");
    console.log("1. Check if .env file exists with EMAIL and PASSWORD");
    console.log("2. Verify Gmail credentials and App Password");
    console.log("3. Ensure EJS is installed: npm install ejs");
    console.log("4. Check console for detailed error messages");
  }
}

// Run the test
if (require.main === module) {
  testRecurringEmailSystem();
}

module.exports = { testRecurringEmailSystem };
