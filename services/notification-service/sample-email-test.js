/**
 * Test script for email templates
 * Run with: node sample-email-test.js
 */

const fs = require('fs');
const path = require('path');
const templateEngine = require('./templates/template-engine');

// Create a sample data object with tenant branding
const sampleData = {
  clientName: 'Jane Smith',
  stylistName: 'Michael Johnson',
  date: '2023-08-15T10:00:00Z',
  time: '10:00',
  formattedDate: 'Tuesday, August 15, 2023',
  formattedTime: '10:00 AM',
  services: 'Haircut, Color, Blowout',
  totalPrice: '120.00',
  tenantId: 'salon123',
  tenantName: 'Luxe Hair Studio',
  logoUrl: 'https://example.com/logo.png',
  primaryColor: '#8A2BE2', // Violet color for branding
  appointmentUrl: 'https://app.aesthenda.com/appointments/123456',
  tenantAddress: '123 Main Street, Anytown, CA 12345',
  tenantPhone: '(555) 123-4567',
  tenantEmail: 'appointments@luxehairstudio.com',
  reason: 'Stylist unavailable',
  changes: [
    'Time changed from 9:00 AM to 10:00 AM',
    'Added Blowout service'
  ],
  specialInstructions: 'Please arrive 10 minutes early to complete paperwork.'
};

async function testTemplates() {
  console.log('Testing email templates...');

  // Test all templates
  const templates = [
    'appointment-confirmation',
    'appointment-reminder',
    'appointment-cancelled',
    'appointment-updated'
  ];

  // Create output directory if it doesn't exist
  const outputDir = path.join(__dirname, 'test-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  for (const template of templates) {
    try {
      console.log(`Rendering ${template} template...`);
      const html = templateEngine.renderTemplate(template, sampleData);
      
      // Write the rendered template to a file for inspection
      const outputPath = path.join(outputDir, `${template}.html`);
      fs.writeFileSync(outputPath, html);
      
      console.log(`Template ${template} rendered successfully and saved to ${outputPath}`);
    } catch (error) {
      console.error(`Error rendering ${template} template:`, error);
    }
  }
}

testTemplates().catch(console.error); 