# VPay Recurring Invoice & Email Features

## 🎯 What's New

The VPay system now includes comprehensive recurring invoice functionality with automatic email notifications for:

- ✅ **Recurring Invoice Generation**: Automatic creation of next invoices
- ✅ **Recurring Invoice Emails**: Professional notifications to clients
- ✅ **Overdue Reminder Emails**: Urgent payment reminders
- ✅ **Bulk Operations**: Process multiple invoices at once
- ✅ **Smart Scheduling**: Intelligent timing for invoice generation

## 🚀 New Controller Functions

### 1. `generateRecurringInvoices`
Automatically generates and sends recurring invoices for all active subscriptions.

**Endpoint**: `POST /api/invoices/generate-recurring`
**Query Parameters**:
- `creatorId` (optional): Filter by specific creator wallet

**Response**:
```json
{
  "success": true,
  "message": "Recurring invoice generation completed",
  "count": 5,
  "results": [
    {
      "originalInvoiceId": "invoice123",
      "originalInvoiceNumber": "INV-001",
      "newInvoiceId": "invoice456",
      "newInvoiceNumber": "INV-002",
      "status": "generated"
    }
  ]
}
```

### 2. `sendOverdueReminders`
Sends overdue reminder emails to all clients with overdue invoices.

**Endpoint**: `POST /api/invoices/send-overdue-reminders`
**Query Parameters**:
- `creatorId` (optional): Filter by specific creator wallet

**Response**:
```json
{
  "success": true,
  "message": "Overdue reminder emails processed",
  "count": 3,
  "results": [
    {
      "invoiceId": "invoice123",
      "invoiceNumber": "INV-001",
      "clientEmail": "client@email.com",
      "status": "sent"
    }
  ]
}
```

## 🔄 How Recurring Invoices Work

### Automatic Generation
When an invoice with `recurring.isRecurring: true` is marked as "Paid":

1. **Check Conditions**: Verify if recurring should continue
2. **Calculate Next Date**: Based on frequency (weekly, monthly, yearly, custom)
3. **Generate Invoice**: Create new invoice with incremented count
4. **Send Email**: Automatically notify client about new recurring invoice
5. **Link Chain**: Maintain parent-child relationship between invoices

### Frequency Types
- **Weekly**: Every 7 days
- **Monthly**: Every 30 days (approximate)
- **Yearly**: Every 365 days (approximate)
- **Custom**: User-defined number of days

### End Conditions
- **Invoice Count**: Stop after X invoices
- **End Date**: Stop after specific date

## 📧 Email Templates

### 1. Recurring Invoice Email (`recurring-invoice.ejs`)
- **Purpose**: Notify clients about automatically generated recurring invoices
- **Content**: 
  - Recurring subscription information
  - Invoice details and payment options
  - Subscription management notes
  - Professional branding and styling

### 2. Overdue Reminder Email (`overdue-reminder.ejs`)
- **Purpose**: Urgent reminders for overdue payments
- **Content**:
  - Overdue notice with days overdue
  - Payment consequences and urgency
  - Multiple payment options
  - Support contact information

## 🧪 Testing

### Test Commands
```bash
# Test basic email system
npm run test:email

# Test recurring invoice emails
npm run test:recurring

# Test both systems
npm run test:email && npm run test:recurring
```

### Test Scenarios
1. **Recurring Invoice Email**: Monthly subscription notification
2. **Overdue Reminder**: 15-day overdue payment reminder
3. **Missing Email Handling**: Graceful fallback when no client email
4. **Template Rendering**: Professional email appearance

## 🔧 Integration Points

### 1. Invoice Creation
```javascript
// When creating an invoice with recurring settings
const invoice = await Invoice.create({
  // ... other fields
  recurring: {
    isRecurring: true,
    frequency: { type: "monthly" },
    currentCount: 1,
    endCondition: { type: "invoiceCount", value: 12 }
  }
});

// Email is automatically sent to client
await sendInvoiceMail(invoice, creatorInfo);
```

### 2. Payment Processing
```javascript
// When payment is received
if (invoice.invoiceStatus === "Paid" && invoice.recurring?.isRecurring) {
  // Automatically generate next recurring invoice
  const nextInvoice = await generateNextRecurringInvoice(invoice);
  
  // Email is automatically sent to client
  // (handled within generateNextRecurringInvoice)
}
```

### 3. Bulk Operations
```javascript
// Generate all due recurring invoices
const result = await generateRecurringInvoices(req, res);

// Send all overdue reminders
const reminders = await sendOverdueReminders(req, res);
```

## 📊 Data Flow

```
Invoice Created → Client Email Sent
       ↓
Payment Received → Status Updated
       ↓
If Recurring & Paid → Next Invoice Generated
       ↓
Recurring Email Sent → Client Notified
       ↓
Due Date Passed → Overdue Reminder Sent
```

## 🎨 Email Features

### Professional Design
- **Responsive Layout**: Works on all devices
- **VPay Branding**: Consistent company appearance
- **Clear Information**: Easy to read and understand
- **Action Buttons**: Direct links to view and pay

### Dynamic Content
- **Invoice Details**: All information automatically populated
- **Payment Status**: Real-time status updates
- **Recurring Info**: Subscription details and cycles
- **Personalization**: Client name and specific amounts

### Smart Handling
- **Missing Emails**: Graceful fallback when no email available
- **Error Recovery**: System continues working even if emails fail
- **Logging**: Comprehensive tracking of email operations
- **Rate Limiting**: Prevents email spam

## 🚀 Usage Examples

### 1. Manual Recurring Generation
```javascript
// Generate recurring invoices for specific creator
const response = await fetch('/api/invoices/generate-recurring?creatorId=0x123...', {
  method: 'POST'
});
```

### 2. Send Overdue Reminders
```javascript
// Send overdue reminders for all invoices
const response = await fetch('/api/invoices/send-overdue-reminders', {
  method: 'POST'
});
```

### 3. Monitor Results
```javascript
// Check generation results
const { results } = await response.json();
results.forEach(result => {
  if (result.status === 'generated') {
    console.log(`Generated: ${result.newInvoiceNumber}`);
  }
});
```

## 🔒 Security & Reliability

### Error Handling
- **Email Failures**: Don't break invoice operations
- **Missing Data**: Graceful fallbacks for incomplete information
- **Network Issues**: Retry logic for email delivery
- **Validation**: Verify all data before processing

### Data Protection
- **No Sensitive Data**: Payment details not logged in emails
- **Environment Variables**: Secure credential management
- **Rate Limiting**: Prevent email abuse
- **Audit Trail**: Track all email operations

## 📈 Performance

### Optimization
- **Bulk Processing**: Handle multiple invoices efficiently
- **Async Operations**: Non-blocking email sending
- **Smart Queries**: Only process relevant invoices
- **Caching**: Template compilation optimization

### Monitoring
- **Success Rates**: Track email delivery success
- **Processing Time**: Monitor generation performance
- **Error Rates**: Identify and fix issues quickly
- **Resource Usage**: Optimize system resources

## 🔮 Future Enhancements

### Planned Features
- **Email Scheduling**: Send emails at optimal times
- **Template Customization**: User-defined email templates
- **Advanced Analytics**: Detailed email performance metrics
- **Multi-language Support**: Internationalization
- **A/B Testing**: Optimize email effectiveness

### Integration Opportunities
- **CRM Systems**: Customer relationship management
- **Marketing Tools**: Email campaign integration
- **Analytics Platforms**: Business intelligence
- **Automation Tools**: Workflow automation

## 📚 API Documentation

### Endpoints Summary
| Endpoint | Method | Purpose | Parameters |
|----------|--------|---------|------------|
| `/generate-recurring` | POST | Generate recurring invoices | `creatorId` (optional) |
| `/send-overdue-reminders` | POST | Send overdue reminders | `creatorId` (optional) |

### Response Codes
- **200**: Success with results
- **400**: Invalid parameters
- **404**: No invoices found
- **500**: Internal server error

## 🎉 Benefits

### For Businesses
- **Automated Revenue**: Recurring invoices generated automatically
- **Professional Communication**: Branded, professional emails
- **Reduced Overdue**: Timely payment reminders
- **Better Cash Flow**: Consistent payment collection

### For Clients
- **Clear Information**: Professional, easy-to-read invoices
- **Payment Options**: Multiple ways to pay
- **Timely Reminders**: Never miss payment deadlines
- **Professional Service**: Builds trust and credibility

### For Developers
- **Easy Integration**: Simple API endpoints
- **Flexible Configuration**: Customizable email templates
- **Robust Error Handling**: Reliable system operation
- **Comprehensive Testing**: Built-in test scripts

## 🚀 Getting Started

### 1. Setup Environment
```bash
# Install dependencies
npm install

# Configure email settings in .env
EMAIL=your-email@gmail.com
PASSWORD=your-app-password
FRONTEND_URL=http://localhost:3000
```

### 2. Test the System
```bash
# Test basic emails
npm run test:email

# Test recurring functionality
npm run test:recurring
```

### 3. Use in Production
```javascript
// Generate recurring invoices
await generateRecurringInvoices(req, res);

// Send overdue reminders
await sendOverdueReminders(req, res);
```

The VPay system now provides a complete, professional recurring invoice solution with automatic email notifications, making it easy to manage subscriptions and maintain consistent client communication! 