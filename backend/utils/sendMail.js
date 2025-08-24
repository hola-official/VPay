const nodemailer = require("nodemailer");
const path = require("path");
const ejs = require("ejs");
const dotenv = require("dotenv");
dotenv.config();

// Email configuration
let config = {
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
};

// Create transporter
let transporter = nodemailer.createTransport(config);

// Verify transporter connection
transporter.verify(function (error, success) {
  if (error) {
    console.error("SMTP connection error:", error);
  } else {
    console.log("SMTP server is ready to send emails");
  }
});

// Generic send mail function
const sendMail = async (options) => {
  try {
    const { email, subject, template, data } = options;

    if (!email || !subject || !template) {
      throw new Error("Email, subject, and template are required");
    }

    // Get the path to the email template file
    const templatePath = path.join(__dirname, "../mails", template);

    // Render the email template with EJS
    const html = await ejs.renderFile(templatePath, data);

    const mailOptions = {
      from: `"VPay Invoice System" <${process.env.EMAIL}>`,
      to: email,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

// Send invoice email to client (requires client email)
const sendInvoiceMail = async (invoice, creatorInfo) => {
  try {
    // Check if client has email (required for sending)
    if (!invoice.client || !invoice.client.email) {
      console.log("No client email available, skipping invoice email");
      return;
    }

    const emailData = {
      invoice,
      creatorInfo,
      invoiceUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/invoice/${invoice._id}`,
      paymentUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/pay/${invoice._id}`,
      currentDate: new Date().toLocaleDateString(),
    };

    await sendMail({
      email: invoice.client.email,
      subject: `Invoice #${invoice.invoiceNumber} from ${invoice.client.name || "VPay"}`,
      template: "invoice-email.ejs",
      data: emailData,
    });

    console.log(`Invoice email sent to ${invoice.client.email}`);
  } catch (error) {
    console.error("Error sending invoice email:", error);
    // Don't throw error, just log it
  }
};

// Send payment notification email to invoice creator (requires creator email)
const sendPaymentNotificationMail = async (
  invoice,
  paymentDetails,
  creatorEmail
) => {
  try {
    // Check if creator email is provided
    if (!creatorEmail) {
      console.log(
        "No creator email provided, skipping payment notification email"
      );
      return;
    }

    const emailData = {
      invoice,
      paymentDetails,
      invoiceUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/invoice/${invoice._id}`,
      currentDate: new Date().toLocaleDateString(),
    };

    await sendMail({
      email: creatorEmail,
      subject: `Payment Received for Invoice #${invoice.invoiceNumber}`,
      template: "payment-notification.ejs",
      data: emailData,
    });

    console.log(`Payment notification email sent to creator`);
  } catch (error) {
    console.error("Error sending payment notification email:", error);
    // Don't throw error, just log it
  }
};

// Send payment verification email to admin/creator (requires creator email)
const sendPaymentVerificationMail = async (
  invoice,
  paymentDetails,
  verificationStatus,
  creatorEmail
) => {
  try {
    // Check if creator email is provided
    if (!creatorEmail) {
      console.log(
        "No creator email provided, skipping payment verification email"
      );
      return;
    }

    const emailData = {
      invoice,
      paymentDetails,
      verificationStatus,
      invoiceUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/invoice/${invoice._id}`,
      currentDate: new Date().toLocaleDateString(),
    };

    await sendMail({
      email: creatorEmail,
      subject: `Payment Verification ${verificationStatus} for Invoice #${invoice.invoiceNumber}`,
      template: "payment-verification.ejs",
      data: emailData,
    });

    console.log(`Payment verification email sent`);
  } catch (error) {
    console.error("Error sending payment verification email:", error);
    // Don't throw error, just log it
  }
};

// Send recurring invoice notification (requires client email)
const sendRecurringInvoiceMail = async (invoice, creatorInfo) => {
  try {
    // Check if client has email (required for sending)
    if (!invoice.client || !invoice.client.email) {
      console.log(
        "No client email available, skipping recurring invoice email"
      );
      return;
    }

    const emailData = {
      invoice,
      creatorInfo,
      invoiceUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/invoice/${invoice._id}`,
      paymentUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/pay/${invoice._id}`,
      currentDate: new Date().toLocaleDateString(),
    };

    await sendMail({
      email: invoice.client.email,
      subject: `Recurring Invoice #${invoice.invoiceNumber} To ${invoice.client.name || "VPay"}`,
      template: "recurring-invoice.ejs",
      data: emailData,
    });

    console.log(`Recurring invoice email sent to ${invoice.client.email}`);
  } catch (error) {
    console.error("Error sending recurring invoice email:", error);
    // Don't throw error, just log it
  }
};

// Send overdue invoice reminder (requires client email)
const sendOverdueReminderMail = async (invoice, creatorInfo) => {
  try {
    // Check if client has email (required for sending)
    if (!invoice.client || !invoice.client.email) {
      console.log("No client email available, skipping overdue reminder email");
      return;
    }

    const emailData = {
      invoice,
      creatorInfo,
      invoiceUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/invoice/${invoice._id}`,
      paymentUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/pay/${invoice._id}`,
      currentDate: new Date().toLocaleDateString(),
      daysOverdue: Math.ceil(
        (new Date() - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24)
      ),
    };

    await sendMail({
      email: invoice.client.email,
      subject: `Overdue Invoice Reminder - Invoice #${invoice.invoiceNumber}`,
      template: "overdue-reminder.ejs",
      data: emailData,
    });

    console.log(`Overdue reminder email sent to ${invoice.client.email}`);
  } catch (error) {
    console.error("Error sending overdue reminder email:", error);
    // Don't throw error, just log it
  }
};

// Utility function to send custom emails (for when you have email addresses)
const sendCustomEmail = async (toEmail, subject, template, data) => {
  try {
    await sendMail({
      email: toEmail,
      subject,
      template,
      data,
    });
    console.log(`Custom email sent to ${toEmail}`);
  } catch (error) {
    console.error("Error sending custom email:", error);
    throw error;
  }
};

module.exports = {
  sendMail,
  sendInvoiceMail,
  sendPaymentNotificationMail,
  sendPaymentVerificationMail,
  sendRecurringInvoiceMail,
  sendOverdueReminderMail,
  sendCustomEmail,
};
