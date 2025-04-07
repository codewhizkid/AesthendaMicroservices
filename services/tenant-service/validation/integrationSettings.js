const INTEGRATION_TYPES = ['CALENDAR', 'INVENTORY', 'MARKETING', 'CRM', 'ACCOUNTING'];
const CALENDAR_PROVIDERS = ['GOOGLE', 'APPLE', 'MICROSOFT'];
const SYNC_DIRECTIONS = ['PUSH', 'PULL', 'BIDIRECTIONAL'];

const validateWorkflowStep = (step) => {
  const errors = [];
  const VALID_STEP_TYPES = [
    'CONDITION',
    'ACTION',
    'NOTIFICATION',
    'DELAY',
    'INTEGRATION',
    'CUSTOM'
  ];

  if (!step || typeof step !== 'object') {
    errors.push('Workflow step must be an object');
    return errors;
  }

  // Validate name
  if (!step.name || typeof step.name !== 'string' || step.name.length === 0) {
    errors.push('Step name is required and must be a non-empty string');
  }

  // Validate type
  if (!step.type || !VALID_STEP_TYPES.includes(step.type)) {
    errors.push('Invalid step type');
  }

  // Validate config
  if (!step.config || typeof step.config !== 'object') {
    errors.push('Step configuration is required');
  }

  // Validate order
  if (!Number.isInteger(step.order) || step.order < 0) {
    errors.push('Step order must be a non-negative integer');
  }

  // Validate enabled status
  if (typeof step.isEnabled !== 'boolean') {
    errors.push('Step enabled status must be a boolean');
  }

  // Validate conditions
  if (!Array.isArray(step.conditions)) {
    errors.push('Step conditions must be an array');
  } else {
    step.conditions.forEach((condition, index) => {
      const conditionErrors = validateWorkflowCondition(condition);
      errors.push(...conditionErrors.map(error => `Condition ${index}: ${error}`));
    });
  }

  // Validate actions
  if (!Array.isArray(step.actions)) {
    errors.push('Step actions must be an array');
  } else {
    step.actions.forEach((action, index) => {
      const actionErrors = validateWorkflowAction(action);
      errors.push(...actionErrors.map(error => `Action ${index}: ${error}`));
    });
  }

  return errors;
};

const validateWorkflowCondition = (condition) => {
  const errors = [];
  const VALID_OPERATORS = ['EQUALS', 'NOT_EQUALS', 'CONTAINS', 'NOT_CONTAINS', 'GREATER_THAN', 'LESS_THAN'];

  if (!condition || typeof condition !== 'object') {
    errors.push('Workflow condition must be an object');
    return errors;
  }

  // Validate field
  if (!condition.field || typeof condition.field !== 'string' || condition.field.length === 0) {
    errors.push('Condition field is required and must be a non-empty string');
  }

  // Validate operator
  if (!condition.operator || !VALID_OPERATORS.includes(condition.operator)) {
    errors.push('Invalid condition operator');
  }

  // Validate value
  if (condition.value === undefined || condition.value === null) {
    errors.push('Condition value is required');
  }

  return errors;
};

const validateWorkflowAction = (action) => {
  const errors = [];
  const VALID_ACTION_TYPES = [
    'SEND_EMAIL',
    'SEND_SMS',
    'UPDATE_RECORD',
    'CREATE_RECORD',
    'API_CALL',
    'INTEGRATION_ACTION'
  ];

  if (!action || typeof action !== 'object') {
    errors.push('Workflow action must be an object');
    return errors;
  }

  // Validate type
  if (!action.type || !VALID_ACTION_TYPES.includes(action.type)) {
    errors.push('Invalid action type');
  }

  // Validate config
  if (!action.config || typeof action.config !== 'object') {
    errors.push('Action configuration is required');
  }

  return errors;
};

const validateCustomWorkflow = (workflow) => {
  const errors = [];
  const VALID_TRIGGERS = [
    'APPOINTMENT_CREATED',
    'APPOINTMENT_UPDATED',
    'APPOINTMENT_CANCELLED',
    'CLIENT_CREATED',
    'CLIENT_UPDATED',
    'PAYMENT_RECEIVED',
    'CUSTOM_EVENT'
  ];

  if (!workflow || typeof workflow !== 'object') {
    errors.push('Custom workflow must be an object');
    return errors;
  }

  // Validate name
  if (!workflow.name || typeof workflow.name !== 'string' || workflow.name.length === 0) {
    errors.push('Workflow name is required and must be a non-empty string');
  }

  // Validate description (if present)
  if (workflow.description !== undefined && 
      (typeof workflow.description !== 'string' || workflow.description.length === 0)) {
    errors.push('Workflow description must be a non-empty string if provided');
  }

  // Validate trigger
  if (!workflow.trigger || !VALID_TRIGGERS.includes(workflow.trigger)) {
    errors.push('Invalid workflow trigger');
  }

  // Validate enabled status
  if (typeof workflow.isEnabled !== 'boolean') {
    errors.push('Workflow enabled status must be a boolean');
  }

  // Validate steps
  if (!Array.isArray(workflow.steps) || workflow.steps.length === 0) {
    errors.push('Workflow must have at least one step');
  } else {
    workflow.steps.forEach((step, index) => {
      const stepErrors = validateWorkflowStep(step);
      errors.push(...stepErrors.map(error => `Step ${index}: ${error}`));
    });
  }

  return errors;
};

const validateIntegrationSettings = (settings) => {
  const errors = [];

  if (!settings || typeof settings !== 'object') {
    errors.push('Integration settings must be an object');
    return errors;
  }

  // Validate integration type
  if (!settings.type || !INTEGRATION_TYPES.includes(settings.type)) {
    errors.push('Invalid integration type');
  }

  // Validate provider
  if (!settings.provider || typeof settings.provider !== 'string' || settings.provider.length === 0) {
    errors.push('Provider is required and must be a non-empty string');
  }

  // Validate enabled status
  if (typeof settings.isEnabled !== 'boolean') {
    errors.push('Integration enabled status must be a boolean');
  }

  // Validate credentials (if present)
  if (settings.credentials !== undefined && typeof settings.credentials !== 'object') {
    errors.push('Integration credentials must be an object if provided');
  }

  // Validate sync settings (if present)
  if (settings.syncSettings !== undefined && typeof settings.syncSettings !== 'object') {
    errors.push('Sync settings must be an object if provided');
  }

  // Validate webhook URL (if present)
  if (settings.webhookUrl !== undefined) {
    const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/;
    if (!urlRegex.test(settings.webhookUrl)) {
      errors.push('Invalid webhook URL format');
    }
  }

  return errors;
};

const validateCalendarIntegration = (settings) => {
  const errors = [];

  if (!settings || typeof settings !== 'object') {
    errors.push('Calendar integration settings must be an object');
    return errors;
  }

  // Validate provider
  if (!settings.provider || !CALENDAR_PROVIDERS.includes(settings.provider)) {
    errors.push('Invalid calendar provider');
  }

  // Validate enabled status
  if (typeof settings.isEnabled !== 'boolean') {
    errors.push('Integration enabled status must be a boolean');
  }

  // Validate credentials (if present)
  if (settings.credentials !== undefined && typeof settings.credentials !== 'object') {
    errors.push('Integration credentials must be an object if provided');
  }

  // Validate selected calendars
  if (!Array.isArray(settings.selectedCalendars)) {
    errors.push('Selected calendars must be an array');
  } else {
    settings.selectedCalendars.forEach((calendarId, index) => {
      if (typeof calendarId !== 'string' || calendarId.length === 0) {
        errors.push(`Invalid calendar ID at index ${index}`);
      }
    });
  }

  // Validate sync direction
  if (!settings.syncDirection || !SYNC_DIRECTIONS.includes(settings.syncDirection)) {
    errors.push('Invalid sync direction');
  }

  return errors;
};

module.exports = {
  validateCustomWorkflow,
  validateIntegrationSettings,
  validateCalendarIntegration
}; 