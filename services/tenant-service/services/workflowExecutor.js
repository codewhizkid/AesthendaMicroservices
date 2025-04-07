const { publishEvent, subscribeToEvent } = require('../utils/eventBus');
const logger = require('../utils/logger');

class WorkflowExecutor {
  constructor() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Subscribe to all relevant events that can trigger workflows
    const events = [
      'appointment.created',
      'appointment.updated',
      'appointment.cancelled',
      'client.created',
      'client.updated',
      'payment.received'
    ];

    events.forEach(eventType => {
      subscribeToEvent(eventType, async (data) => {
        await this.handleEvent(eventType, data);
      });
    });
  }

  async handleEvent(eventType, eventData) {
    try {
      const { tenantId } = eventData;
      const tenant = await getTenantById(tenantId);
      
      if (!tenant || !tenant.customWorkflows) return;

      // Find workflows triggered by this event
      const relevantWorkflows = tenant.customWorkflows.filter(workflow => 
        workflow.isEnabled && 
        workflow.trigger === this.mapEventToTrigger(eventType)
      );

      // Execute each relevant workflow
      for (const workflow of relevantWorkflows) {
        await this.executeWorkflow(workflow, eventData, tenant);
      }
    } catch (error) {
      logger.error('Error handling event in workflow executor', {
        eventType,
        error: error.message,
        stack: error.stack
      });
    }
  }

  mapEventToTrigger(eventType) {
    const mappings = {
      'appointment.created': 'APPOINTMENT_CREATED',
      'appointment.updated': 'APPOINTMENT_UPDATED',
      'appointment.cancelled': 'APPOINTMENT_CANCELLED',
      'client.created': 'CLIENT_CREATED',
      'client.updated': 'CLIENT_UPDATED',
      'payment.received': 'PAYMENT_RECEIVED'
    };
    return mappings[eventType] || 'CUSTOM_EVENT';
  }

  async executeWorkflow(workflow, triggerData, tenant) {
    try {
      logger.info('Starting workflow execution', {
        workflowId: workflow.id,
        workflowName: workflow.name,
        tenantId: tenant.id
      });

      // Execute steps in order
      for (const step of workflow.steps.sort((a, b) => a.order - b.order)) {
        const shouldExecute = await this.evaluateConditions(step.conditions, triggerData);
        
        if (shouldExecute) {
          await this.executeStep(step, triggerData, tenant);
        }
      }

      logger.info('Workflow execution completed', {
        workflowId: workflow.id,
        workflowName: workflow.name,
        tenantId: tenant.id
      });
    } catch (error) {
      logger.error('Error executing workflow', {
        workflowId: workflow.id,
        workflowName: workflow.name,
        error: error.message,
        stack: error.stack
      });

      // Notify about workflow execution failure
      await publishEvent('workflow.execution.failed', {
        workflowId: workflow.id,
        tenantId: tenant.id,
        error: error.message
      });
    }
  }

  async evaluateConditions(conditions, data) {
    if (!conditions || conditions.length === 0) return true;

    for (const condition of conditions) {
      const { field, operator, value } = condition;
      const fieldValue = this.getNestedValue(data, field);

      switch (operator) {
        case 'EQUALS':
          if (fieldValue !== value) return false;
          break;
        case 'NOT_EQUALS':
          if (fieldValue === value) return false;
          break;
        case 'CONTAINS':
          if (!fieldValue?.includes(value)) return false;
          break;
        case 'NOT_CONTAINS':
          if (fieldValue?.includes(value)) return false;
          break;
        case 'GREATER_THAN':
          if (!(fieldValue > value)) return false;
          break;
        case 'LESS_THAN':
          if (!(fieldValue < value)) return false;
          break;
      }
    }

    return true;
  }

  async executeStep(step, triggerData, tenant) {
    logger.info('Executing workflow step', {
      stepName: step.name,
      stepType: step.type
    });

    switch (step.type) {
      case 'NOTIFICATION':
        await this.handleNotification(step.config, triggerData, tenant);
        break;
      case 'INTEGRATION':
        await this.handleIntegration(step.config, triggerData, tenant);
        break;
      case 'DELAY':
        await this.handleDelay(step.config);
        break;
      case 'ACTION':
        await this.handleAction(step.config, triggerData, tenant);
        break;
      case 'CUSTOM':
        await this.handleCustomAction(step.config, triggerData, tenant);
        break;
    }
  }

  async handleNotification(config, data, tenant) {
    const { type, template, recipients } = config;
    
    // Resolve recipient information
    const resolvedRecipients = await this.resolveRecipients(recipients, data, tenant);
    
    // Send notification based on type
    await publishEvent('notification.send', {
      tenantId: tenant.id,
      type,
      template,
      recipients: resolvedRecipients,
      data
    });
  }

  async handleIntegration(config, data, tenant) {
    const { integrationType, action, params } = config;
    
    // Find the integration configuration
    const integration = tenant.integrations.find(i => i.type === integrationType);
    if (!integration || !integration.isEnabled) {
      throw new Error(`Integration ${integrationType} not configured or disabled`);
    }

    // Execute integration action
    await publishEvent('integration.execute', {
      tenantId: tenant.id,
      integrationType,
      action,
      params: {
        ...params,
        triggerData: data
      }
    });
  }

  async handleDelay(config) {
    const { duration } = config;
    await new Promise(resolve => setTimeout(resolve, duration));
  }

  async handleAction(config, data, tenant) {
    const { actionType, params } = config;

    await publishEvent('action.execute', {
      tenantId: tenant.id,
      actionType,
      params: {
        ...params,
        triggerData: data
      }
    });
  }

  async handleCustomAction(config, data, tenant) {
    const { script } = config;
    
    // Execute custom script in a sandboxed environment
    // Implementation depends on your security requirements
    logger.warn('Custom action execution requested', {
      tenantId: tenant.id,
      scriptLength: script.length
    });
  }

  async resolveRecipients(recipients, data, tenant) {
    // Implement recipient resolution logic based on your needs
    return recipients;
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

// Singleton instance
const workflowExecutor = new WorkflowExecutor();
module.exports = workflowExecutor;