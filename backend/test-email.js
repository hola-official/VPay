const { sendCustomEmail } = require("./utils/sendMail");

// Test email data
const testInvoice = {
  _id: "test-invoice-123",
  invoiceNumber: "INV-001",
  client: {
    name: "Muhammed Musa",
    email: "smallcode578@gmail.com",
  },
  creatorId: "0x1234567890123456789012345678901234567890",
  grandTotal: 150.0,
  currency: "USD",
  issueDate: new Date(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  items: [
    {
      description: "Test Service",
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
  invoiceStatus: "Awaiting Payment",
};

async function testEmailSystem() {
  console.log("🧪 Testing VPay Email System...");

  try {
    // Test 1: Send custom email
    console.log("\n📧 Test 1: Sending custom email...");
    await sendCustomEmail(
      "gnailprostar@gmail.com", // Replace with your email to test
      "VPay Email System Test",
      "invoice-email.ejs",
      {
        invoice: testInvoice,
        creatorInfo: {
          name: "Test Creator",
          walletAddress: testInvoice.creatorId,
        },
        invoiceUrl: "http://localhost:3000/invoice/test",
        paymentUrl: "http://localhost:3000/pay/test",
        currentDate: new Date().toLocaleDateString(),
        subject: "VPay Email System Test", // Add subject for base template
      }
    );
    console.log("✅ Custom email sent successfully!");

    // Test 2: Test invoice email function
    console.log("\n📧 Test 2: Testing invoice email function...");
    const { sendInvoiceMail } = require("./utils/sendMail");
    await sendInvoiceMail(testInvoice, {
      name: "Test Creator",
      walletAddress: testInvoice.creatorId,
    });
    console.log("✅ Invoice email function works!");

    // Test 3: Test with missing client email
    console.log("\n📧 Test 3: Testing with missing client email...");
    const invoiceWithoutEmail = {
      ...testInvoice,
      client: { name: "No Email Client" },
    };
    await sendInvoiceMail(invoiceWithoutEmail, {
      name: "Test Creator",
      walletAddress: testInvoice.creatorId,
    });
    console.log("✅ Gracefully handled missing email!");

    console.log(
      "\n🎉 All email tests passed! The system is working correctly."
    );
    console.log(
      "\n📝 Note: Check your email inbox (and spam folder) for the test email."
    );
  } catch (error) {
    console.error("\n❌ Email test failed:", error.message);
    console.log("\n🔧 Troubleshooting:");
    console.log("1. Check if .env file exists with EMAIL and PASSWORD");
    console.log("2. Verify Gmail credentials and App Password");
    console.log("3. Ensure EJS is installed: npm install ejs");
    console.log("4. Check console for detailed error messages");
  }
}

// Run the test
if (require.main === module) {
  testEmailSystem();
}

module.exports = { testEmailSystem };
