# VPay Email System Setup Guide

## Overview
The VPay system includes a comprehensive email notification system that sends professional, branded emails for various invoice-related events. **Important**: This system is designed to work with your dApp architecture where only wallet addresses are stored, not email addresses.

## Current System Architecture

### Data Storage
- **Invoice Creators**: Only wallet addresses are stored (`creatorId`)
- **Clients**: Email addresses are stored in the `client` object (if provided)
- **No User Profiles**: The system doesn't maintain user email databases

### Email Capabilities
- ✅ **Client Emails**: Can send emails to invoice clients (when email is provided)
- ❌ **Creator Emails**: Cannot send emails to invoice creators (no email stored)
- ✅ **Custom Emails**: Can send emails when email addresses are explicitly provided

## Email Templates Available

### 1. Invoice Email (`invoice-email.ejs`)
- **Purpose**: Sent to clients when a new invoice is created
- **Content**: Complete invoice details, payment methods, items, and payment links
- **Recipients**: Invoice clients (when `invoice.client.email` exists)
- **Status**: ✅ **Fully Functional**

### 2. Payment Notification (`payment-notification.ejs`)
- **Purpose**: Sent to invoice creators when payments are received
- **Content**: Payment details, updated invoice status, and transaction information
- **Recipients**: Invoice creators (requires email address parameter)
- **Status**: ⚠️ **Requires Email Parameter**

### 3. Payment Verification (`payment-verification.ejs`)
- **Purpose**: Sent when bank payments are verified or rejected
- **Content**: Verification status, payment details, and next steps
- **Recipients**: Invoice creators (requires email address parameter)
- **Status**: ⚠️ **Requires Email Parameter**

### 4. Recurring Invoice (`recurring-invoice.ejs`)
- **Purpose**: Sent when recurring invoices are automatically generated
- **Content**: Recurring invoice details and subscription information
- **Recipients**: Invoice clients (when `invoice.client.email` exists)
- **Status**: ✅ **Fully Functional**

### 5. Overdue Reminder (`overdue-reminder.ejs`)
- **Purpose**: Sent when invoices become overdue
- **Content**: Overdue notice, consequences, and urgent payment requests
- **Recipients**: Invoice clients (when `invoice.client.email` exists)
- **Status**: ✅ **Fully Functional**

## How to Use the Email System

### 1. Client Emails (Automatic)
Client emails are sent automatically when:
- Creating invoices (if client email exists)
- Generating recurring invoices (if client email exists)
- Sending overdue reminders (if client email exists)

```javascript
// These work automatically when client.email exists
await sendInvoiceMail(invoice, creatorInfo);
await sendRecurringInvoiceMail(invoice, creatorInfo);
await sendOverdueReminderMail(invoice, creatorInfo);
```

### 2. Creator Emails (Manual)
Creator emails require explicit email addresses:

```javascript
// For payment notifications
await sendPaymentNotificationMail(invoice, paymentDetails, "creator@email.com");

// For payment verification
await sendPaymentVerificationMail(invoice, paymentDetails, "verified", "creator@email.com");
```

### 3. Custom Emails
Send emails to any address when you have it:

```javascript
const { sendCustomEmail } = require("../utils/sendMail");

await sendCustomEmail(
  "user@email.com",
  "Custom Subject",
  "custom-template.ejs",
  { customData: "value" }
);
```

## Environment Configuration

Create a `.env` file in your backend directory:

```env
# Email Configuration (Gmail)
EMAIL=your-email@gmail.com
PASSWORD=your-app-password

# Frontend URL for email links
FRONTEND_URL=http://localhost:3000

# Other configurations...
MONGODB_URI=mongodb://localhost:27017/vpay
PORT=5000
NODE_ENV=development
```

## Gmail Setup

### 1. Enable 2-Factor Authentication
- Go to your Google Account settings
- Enable 2-Factor Authentication

### 2. Generate App Password
- Go to Security settings
- Generate an App Password for "Mail"
- Use this password in your `.env` file

## Alternative Solutions for Creator Notifications

Since you can't send emails to creators (no email addresses stored), consider these alternatives:

### 1. Blockchain Notifications
- Implement event listeners for payment events
- Send notifications through your dApp interface
- Use blockchain events for real-time updates

### 2. WebSocket/Real-time Updates
- Implement WebSocket connections
- Send real-time notifications to connected wallets
- Update UI immediately when payments are received

### 3. Optional Email Collection
- Add an optional email field for creators
- Make it voluntary for those who want email notifications
- Store it separately from the main invoice data

### 4. Push Notifications
- Implement browser push notifications
- Send notifications when the dApp is open
- Use service workers for background notifications

## Testing the Email System

### 1. Test Client Emails
```bash
# Create an invoice with client email
# The system will automatically send emails to clients
```

### 2. Test Creator Emails
```javascript
// Test with explicit email addresses
await sendPaymentNotificationMail(invoice, paymentDetails, "test@email.com");
```

### 3. Test Custom Emails
```javascript
await sendCustomEmail("test@email.com", "Test Subject", "invoice-email.ejs", { invoice });
```

## Current Limitations

### What Works
- ✅ Sending emails to invoice clients
- ✅ Professional email templates
- ✅ Responsive design
- ✅ Dynamic content population

### What Doesn't Work
- ❌ Sending emails to invoice creators (no email addresses)
- ❌ Automatic creator notifications
- ❌ User email database

### Workarounds
- 🔧 Manual email sending when addresses are available
- 🔧 Custom email function for specific use cases
- 🔧 Blockchain-based notification system (recommended)

## Future Enhancements

### 1. Email Integration Options
- Add optional email field for creators
- Implement email preferences system
- Create user profile management

### 2. Alternative Notification Systems
- Blockchain event notifications
- WebSocket real-time updates
- Push notifications
- SMS notifications

### 3. Hybrid Approach
- Use emails for clients (when available)
- Use blockchain notifications for creators
- Implement in-app notification center

## Recommendations for Your dApp

### 1. Keep Current Email System
- Use it for client communications
- Maintain professional appearance
- Keep templates for future use

### 2. Implement Blockchain Notifications
- Listen for payment events
- Update UI in real-time
- Provide immediate feedback

### 3. Consider Optional Email Collection
- Make it voluntary for creators
- Store separately from core data
- Respect user privacy preferences

### 4. Focus on In-App Experience
- Real-time payment updates
- Immediate status changes
- Seamless user experience

## Support

For questions about the email system:
- Check console logs for error messages
- Verify your email configuration
- Remember: creator emails require explicit addresses
- Consider blockchain notifications as primary method 