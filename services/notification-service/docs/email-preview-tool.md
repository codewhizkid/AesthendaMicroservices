# Email Template Preview Tool

## Overview
The notification service includes a built-in email template preview tool that enables developers and administrators to preview email templates with tenant-specific branding and appointment details. This tool is already implemented and ready to use.

## Features
- **Template Selection**: Preview all available notification templates (confirmation, reminder, cancellation, and update)
- **Tenant Branding**: Customize tenant-specific elements like name, logo, colors, and contact information
- **Appointment Details**: Test with different appointment data configurations
- **Responsive Preview**: View how emails appear on different devices (mobile, tablet, desktop)
- **Dynamic Fields**: Template-specific fields that appear based on template type
- **Real-time Preview**: Instantly generate previews using the notification service's template engine

## Technical Implementation
- **URL Path**: `/email-preview.html` accessible from the notification service
- **API Endpoints**:
  - `GET /api/preview/templates`: Returns list of available templates
  - `POST /api/preview/email`: Generates HTML preview based on template type and data

## Multi-Tenancy Support
The preview tool fully supports the multi-tenant architecture by allowing:
- Testing with different tenant IDs
- Customizing tenant-specific branding elements
- Validating that tenant information is properly displayed in emails

## Usage
1. Access the tool at: `http://[notification-service-host]:[port]/email-preview.html`
2. Select a template type from the dropdown
3. Configure tenant branding and appointment details
4. Click "Generate Preview" to see the rendered email

## Security Considerations
- In production environments, access to this tool should be restricted to authorized personnel
- The tool is intended for development, testing, and administrative purposes only
- No actual emails are sent when using this preview tool

## Future Enhancements
- Adding authentication for accessing the preview tool
- Saving tenant branding presets
- Testing actual email delivery
- Additional notification channel previews (SMS, push) 