const { ForbiddenError, UserInputError } = require('apollo-server-express');
const { validateCustomWorkflow, validateIntegrationSettings, validateCalendarIntegration } = require('../validation/integrationSettings');
const { publishEvent } = require('../utils/eventBus');

const resolvers = {
  Query: {
    async getCustomWorkflows(_, __, { tenant, user }) {
      if (!tenant || !user) throw new ForbiddenError('Authentication required');
      
      const workflows = await tenant.customWorkflows || [];
      return workflows.filter(workflow => workflow.isEnabled);
    },

    async getIntegrations(_, __, { tenant, user }) {
      if (!tenant || !user) throw new ForbiddenError('Authentication required');
      
      return tenant.integrations || [];
    },

    async getCalendarIntegration(_, __, { tenant, user }) {
      if (!tenant || !user) throw new ForbiddenError('Authentication required');
      
      const calendarIntegration = tenant.integrations?.find(i => i.type === 'CALENDAR');
      return calendarIntegration;
    }
  },

  Mutation: {
    async createCustomWorkflow(_, { input }, { tenant, user }) {
      if (!tenant || !user) throw new ForbiddenError('Authentication required');
      if (!user.role === 'ADMIN') throw new ForbiddenError('Admin access required');

      const errors = validateCustomWorkflow(input);
      if (errors.length > 0) {
        throw new UserInputError('Invalid workflow configuration', { errors });
      }

      const workflow = {
        ...input,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user.id
      };

      tenant.customWorkflows = tenant.customWorkflows || [];
      tenant.customWorkflows.push(workflow);
      await tenant.save();

      await publishEvent('workflow.created', {
        tenantId: tenant.id,
        workflowId: workflow.id,
        trigger: workflow.trigger
      });

      return workflow;
    },

    async updateCustomWorkflow(_, { id, input }, { tenant, user }) {
      if (!tenant || !user) throw new ForbiddenError('Authentication required');
      if (!user.role === 'ADMIN') throw new ForbiddenError('Admin access required');

      const errors = validateCustomWorkflow(input);
      if (errors.length > 0) {
        throw new UserInputError('Invalid workflow configuration', { errors });
      }

      const workflowIndex = tenant.customWorkflows?.findIndex(w => w.id === id);
      if (workflowIndex === -1) {
        throw new UserInputError('Workflow not found');
      }

      const updatedWorkflow = {
        ...tenant.customWorkflows[workflowIndex],
        ...input,
        updatedAt: new Date()
      };

      tenant.customWorkflows[workflowIndex] = updatedWorkflow;
      await tenant.save();

      await publishEvent('workflow.updated', {
        tenantId: tenant.id,
        workflowId: id,
        trigger: updatedWorkflow.trigger
      });

      return updatedWorkflow;
    },

    async deleteCustomWorkflow(_, { id }, { tenant, user }) {
      if (!tenant || !user) throw new ForbiddenError('Authentication required');
      if (!user.role === 'ADMIN') throw new ForbiddenError('Admin access required');

      const workflowIndex = tenant.customWorkflows?.findIndex(w => w.id === id);
      if (workflowIndex === -1) {
        throw new UserInputError('Workflow not found');
      }

      tenant.customWorkflows.splice(workflowIndex, 1);
      await tenant.save();

      await publishEvent('workflow.deleted', {
        tenantId: tenant.id,
        workflowId: id
      });

      return true;
    },

    async configureIntegration(_, { type, input }, { tenant, user }) {
      if (!tenant || !user) throw new ForbiddenError('Authentication required');
      if (!user.role === 'ADMIN') throw new ForbiddenError('Admin access required');

      let errors = [];
      if (type === 'CALENDAR') {
        errors = validateCalendarIntegration(input);
      } else {
        errors = validateIntegrationSettings(input);
      }

      if (errors.length > 0) {
        throw new UserInputError('Invalid integration configuration', { errors });
      }

      const integration = {
        type,
        ...input,
        id: generateId(),
        updatedAt: new Date()
      };

      tenant.integrations = tenant.integrations || [];
      const existingIndex = tenant.integrations.findIndex(i => i.type === type);
      
      if (existingIndex !== -1) {
        tenant.integrations[existingIndex] = integration;
      } else {
        tenant.integrations.push(integration);
      }

      await tenant.save();

      await publishEvent('integration.configured', {
        tenantId: tenant.id,
        integrationType: type,
        provider: input.provider
      });

      return integration;
    },

    async deleteIntegration(_, { type }, { tenant, user }) {
      if (!tenant || !user) throw new ForbiddenError('Authentication required');
      if (!user.role === 'ADMIN') throw new ForbiddenError('Admin access required');

      const integrationIndex = tenant.integrations?.findIndex(i => i.type === type);
      if (integrationIndex === -1) {
        throw new UserInputError('Integration not found');
      }

      tenant.integrations.splice(integrationIndex, 1);
      await tenant.save();

      await publishEvent('integration.deleted', {
        tenantId: tenant.id,
        integrationType: type
      });

      return true;
    }
  }
};

function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

module.exports = resolvers; 