# Email Template Preview Tool

## Overview
The notification service includes a built-in email template preview tool that enables developers and administrators to preview email templates with tenant-specific branding and appointment details. This tool is already implemented and ready to use.

## Authentication Required
The Email Preview Tool now requires authentication:
- Access is restricted to authenticated users only
- System admins can view templates for all tenants
- Salon admins can only view templates for their own tenant
- See [Email Preview Authentication](./email-preview-auth.md) for detailed documentation

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
  - `GET /api/preview/user-info`: Returns authenticated user information
  - `GET /api/preview/verify-token`: Validates authentication token

## Multi-Tenancy Support
The preview tool fully supports the multi-tenant architecture by allowing:
- Testing with different tenant IDs
- Customizing tenant-specific branding elements
- Validating that tenant information is properly displayed in emails
- Restricting access based on tenant permissions

## How to Access
Access the tool through your browser at:
```
http://localhost:5003/email-preview.html
```
You will be redirected to the login page if not authenticated.

## Login Credentials
For demonstration purposes, two users are pre-configured:
- **System Admin**: admin@aesthenda.com / Admin123! (access to all tenants)
- **Salon Admin**: salon@example.com / Salon123! (access to tenant123 only)

## Usage Instructions
1. Login with your credentials
2. Select a template type from the dropdown menu
3. Configure tenant branding settings (name, colors, logo, contact info)
4. Enter appointment details (client name, stylist, date, services, etc.)
5. For some templates, additional fields will appear based on the template type:
   - Cancellation: Reason field
   - Update: List of changes made
   - Reminder: Special instructions
6. Click "Generate Preview" to see the rendered email
7. Use the responsive controls (Mobile, Tablet, Desktop) to test different viewport sizes

## Security Considerations
- The tool is now secured with JWT-based authentication
- Tenant isolation ensures users can only access their authorized tenants
- In production environments, consider implementing HTTPS
- The authentication is isolated to the preview tool and doesn't affect other services 