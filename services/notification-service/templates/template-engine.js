const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

class TemplateEngine {
  constructor() {
    this.templates = {};
    this.loadTemplates();
  }

  loadTemplates() {
    // Register partials and helpers
    this.registerPartials();
    this.registerHelpers();

    // Cache all templates for performance
    this.loadEmailTemplates();
  }

  registerPartials() {
    // Register the base template as a partial
    const baseTemplatePath = path.join(__dirname, 'email', 'base.hbs');
    if (fs.existsSync(baseTemplatePath)) {
      const baseTemplate = fs.readFileSync(baseTemplatePath, 'utf8');
      Handlebars.registerPartial('base', baseTemplate);
    } else {
      console.warn('Base template not found:', baseTemplatePath);
    }
  }

  registerHelpers() {
    // Current year helper for copyright footers
    Handlebars.registerHelper('currentYear', () => new Date().getFullYear());

    // Format date helper
    Handlebars.registerHelper('formatDate', (date, format) => {
      if (!date) return '';
      
      const dateObj = new Date(date);
      switch (format) {
        case 'short':
          return dateObj.toLocaleDateString('en-US');
        case 'long':
          return dateObj.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        case 'time':
          return dateObj.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
          });
        default:
          return dateObj.toLocaleDateString('en-US');
      }
    });

    // Format price helper
    Handlebars.registerHelper('formatPrice', (price) => {
      if (typeof price !== 'number') {
        price = parseFloat(price);
      }
      return isNaN(price) ? '0.00' : price.toFixed(2);
    });
  }

  loadEmailTemplates() {
    const templateTypes = [
      'appointment-confirmation',
      'appointment-reminder',
      'appointment-cancelled',
      'appointment-updated'
    ];

    templateTypes.forEach(type => {
      const templatePath = path.join(__dirname, 'email', `${type}.hbs`);
      if (fs.existsSync(templatePath)) {
        const templateSource = fs.readFileSync(templatePath, 'utf8');
        this.templates[type] = Handlebars.compile(templateSource);
      } else {
        console.warn(`Template not found: ${type}`);
      }
    });
  }

  renderTemplate(templateName, data) {
    if (!this.templates[templateName]) {
      throw new Error(`Template not found: ${templateName}`);
    }

    try {
      return this.templates[templateName](data);
    } catch (error) {
      console.error(`Error rendering template ${templateName}:`, error);
      throw error;
    }
  }

  // Convenience methods for specific templates
  renderAppointmentConfirmation(data) {
    return this.renderTemplate('appointment-confirmation', data);
  }

  renderAppointmentReminder(data) {
    return this.renderTemplate('appointment-reminder', data);
  }

  renderAppointmentCancelled(data) {
    return this.renderTemplate('appointment-cancelled', data);
  }

  renderAppointmentUpdated(data) {
    return this.renderTemplate('appointment-updated', data);
  }
}

module.exports = new TemplateEngine(); 