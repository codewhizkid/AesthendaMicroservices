# HTML Email Templates with Tenant Branding

This document describes the HTML email templates feature in the Notification Service, which provides visually appealing, on-brand notifications to customers.

## Overview

The notification service uses Handlebars templates to render HTML emails with:
- Tenant-specific branding (colors, logos)
- Responsive design that works on all devices
- Consistent layout across all notification types
- Dynamic content based on appointment details

## Template Structure

### Base Template

All emails extend a common base template (`base.hbs`) that provides:
- Consistent header and footer layout
- Tenant branding elements (logo, colors)
- Copyright and contact information
- Responsive styling

### Specialized Templates

There are templates for different notification types:
- `appointment-confirmation.hbs`: Sent when appointments are created
- `appointment-reminder.hbs`: Sent before scheduled appointments
- `appointment-updated.hbs`: Sent when appointments are modified
- `appointment-cancelled.hbs`: Sent when appointments are cancelled

## Tenant Branding

Templates support the following branding elements:

| Variable | Description | Default |
|----------|-------------|---------|
| `tenantName` | Business name | "Aesthenda Salon & Spa" |
| `logoUrl` | URL to tenant logo | empty (falls back to text) |
| `primaryColor` | Main brand color (HEX) | #4A90E2 (blue) |

All colors, buttons, and accents use the primary color to maintain consistent branding.

## Template Engine

The template system uses Handlebars and provides several helpers:
- `currentYear`: Inserts the current year for copyright notices
- `formatDate`: Formats dates in various styles
- `formatPrice`: Ensures consistent price formatting

## Integration

### Using in Code

```javascript
// Import the template engine
const templateEngine = require('./templates/template-engine');

// Render a template with data
const html = templateEngine.renderAppointmentConfirmation({
  clientName: 'Jane Smith',
  stylistName: 'Michael Johnson',
  // ...other appointment data
  tenantName: 'Luxe Hair Studio',
  primaryColor: '#8A2BE2',
  logoUrl: 'https://example.com/logo.png'
});

// Send the email
await emailProvider.send({
  to: 'client@example.com',
  subject: 'Your Appointment Confirmation',
  html
});
```

### Adding New Templates

1. Create a new `.hbs` file in the `templates/email` directory
2. Extend the base template with the `{{#> base}}` syntax
3. Add the template to the `loadEmailTemplates()` method in `template-engine.js`
4. Create a convenience method in the TemplateEngine class

## Testing

Use the `sample-email-test.js` script to generate and view sample emails:

```bash
node sample-email-test.js
```

This will create rendered HTML files in the `test-output` directory that you can open in a browser to preview.

## Backward Compatibility

The system maintains backward compatibility with the previous inline-HTML approach:

1. If template files are not found, it falls back to the legacy methods
2. The NotificationTemplate class maintains the old method signatures
3. SMS and push notification formats are preserved

## Future Enhancements

Planned improvements:
- Add more localization options
- Support for dark mode in emails
- More tenant branding options (fonts, layouts)
- A/B testing capabilities 