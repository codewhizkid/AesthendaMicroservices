const { ForbiddenError, UserInputError } = require('apollo-server-express');
const analyticsService = require('../services/analyticsService');
const { CustomReport } = require('../models');

const resolvers = {
  Query: {
    async getRevenueMetrics(_, { filter }, { tenant, user }) {
      if (!tenant || !user) throw new ForbiddenError('Authentication required');
      
      try {
        return await analyticsService.getRevenueMetrics(tenant.id, filter);
      } catch (error) {
        throw new UserInputError(error.message);
      }
    },

    async getBookingMetrics(_, { filter }, { tenant, user }) {
      if (!tenant || !user) throw new ForbiddenError('Authentication required');
      
      try {
        return await analyticsService.getBookingMetrics(tenant.id, filter);
      } catch (error) {
        throw new UserInputError(error.message);
      }
    },

    async getCustomerMetrics(_, { filter }, { tenant, user }) {
      if (!tenant || !user) throw new ForbiddenError('Authentication required');
      
      try {
        return await analyticsService.getCustomerMetrics(tenant.id, filter);
      } catch (error) {
        throw new UserInputError(error.message);
      }
    },

    async getStaffPerformance(_, { filter }, { tenant, user }) {
      if (!tenant || !user) throw new ForbiddenError('Authentication required');
      
      try {
        return await analyticsService.getStaffPerformance(tenant.id, filter);
      } catch (error) {
        throw new UserInputError(error.message);
      }
    },

    async getUtilizationMetrics(_, { filter }, { tenant, user }) {
      if (!tenant || !user) throw new ForbiddenError('Authentication required');
      
      try {
        return await analyticsService.getUtilizationMetrics(tenant.id, filter);
      } catch (error) {
        throw new UserInputError(error.message);
      }
    },

    async getCustomReports(_, __, { tenant, user }) {
      if (!tenant || !user) throw new ForbiddenError('Authentication required');
      
      try {
        return await CustomReport.find({ tenantId: tenant.id });
      } catch (error) {
        throw new UserInputError(error.message);
      }
    },

    async getCustomReport(_, { reportId }, { tenant, user }) {
      if (!tenant || !user) throw new ForbiddenError('Authentication required');
      
      try {
        const report = await CustomReport.findOne({
          _id: reportId,
          tenantId: tenant.id
        });
        
        if (!report) throw new Error('Report not found');
        return report;
      } catch (error) {
        throw new UserInputError(error.message);
      }
    },

    async generateCustomReport(_, { reportId, filter, format }, { tenant, user }) {
      if (!tenant || !user) throw new ForbiddenError('Authentication required');
      
      try {
        return await analyticsService.generateCustomReport(reportId, filter, format);
      } catch (error) {
        throw new UserInputError(error.message);
      }
    },

    async getDashboardMetrics(_, __, { tenant, user }) {
      if (!tenant || !user) throw new ForbiddenError('Authentication required');
      
      try {
        const metrics = [];
        
        // Revenue metrics
        const revenueMetrics = await analyticsService.getRevenueMetrics(
          tenant.id,
          { dateRange: { startDate: new Date(Date.now() - 24*60*60*1000), endDate: new Date() } }
        );
        metrics.push({
          id: 'revenue_today',
          name: 'Today\'s Revenue',
          type: 'REVENUE',
          value: { total: revenueMetrics.total },
          trend: 0 // Calculate trend
        });

        // Booking metrics
        const bookingMetrics = await analyticsService.getBookingMetrics(
          tenant.id,
          { dateRange: { startDate: new Date(Date.now() - 24*60*60*1000), endDate: new Date() } }
        );
        metrics.push({
          id: 'bookings_today',
          name: 'Today\'s Bookings',
          type: 'BOOKINGS',
          value: { total: bookingMetrics.total },
          trend: 0 // Calculate trend
        });

        // Customer metrics
        const customerMetrics = await analyticsService.getCustomerMetrics(
          tenant.id,
          { dateRange: { startDate: new Date(Date.now() - 24*60*60*1000), endDate: new Date() } }
        );
        metrics.push({
          id: 'new_customers_today',
          name: 'New Customers Today',
          type: 'CUSTOMERS',
          value: { total: customerMetrics.newCustomers },
          trend: 0 // Calculate trend
        });

        // Utilization metrics
        const utilizationMetrics = await analyticsService.getUtilizationMetrics(
          tenant.id,
          { dateRange: { startDate: new Date(Date.now() - 24*60*60*1000), endDate: new Date() } }
        );
        metrics.push({
          id: 'utilization_today',
          name: 'Today\'s Utilization',
          type: 'UTILIZATION',
          value: { percentage: utilizationMetrics.overallUtilization },
          trend: 0 // Calculate trend
        });

        return metrics;
      } catch (error) {
        throw new UserInputError(error.message);
      }
    }
  },

  Mutation: {
    async createCustomReport(_, { name, description, filters, columns }, { tenant, user }) {
      if (!tenant || !user) throw new ForbiddenError('Authentication required');
      if (!user.role === 'ADMIN') throw new ForbiddenError('Admin access required');

      try {
        const report = new CustomReport({
          tenantId: tenant.id,
          name,
          description,
          filters,
          columns,
          createdBy: user.id,
          createdAt: new Date()
        });

        await report.save();
        return report;
      } catch (error) {
        throw new UserInputError(error.message);
      }
    },

    async updateCustomReport(_, { reportId, name, description, filters, columns }, { tenant, user }) {
      if (!tenant || !user) throw new ForbiddenError('Authentication required');
      if (!user.role === 'ADMIN') throw new ForbiddenError('Admin access required');

      try {
        const report = await CustomReport.findOne({
          _id: reportId,
          tenantId: tenant.id
        });

        if (!report) throw new Error('Report not found');

        if (name) report.name = name;
        if (description !== undefined) report.description = description;
        if (filters) report.filters = filters;
        if (columns) report.columns = columns;
        report.updatedAt = new Date();
        report.updatedBy = user.id;

        await report.save();
        return report;
      } catch (error) {
        throw new UserInputError(error.message);
      }
    },

    async deleteCustomReport(_, { reportId }, { tenant, user }) {
      if (!tenant || !user) throw new ForbiddenError('Authentication required');
      if (!user.role === 'ADMIN') throw new ForbiddenError('Admin access required');

      try {
        const result = await CustomReport.deleteOne({
          _id: reportId,
          tenantId: tenant.id
        });

        return result.deletedCount > 0;
      } catch (error) {
        throw new UserInputError(error.message);
      }
    },

    async configureDashboard(_, { metrics }, { tenant, user }) {
      if (!tenant || !user) throw new ForbiddenError('Authentication required');
      if (!user.role === 'ADMIN') throw new ForbiddenError('Admin access required');

      try {
        tenant.dashboardConfig = tenant.dashboardConfig || {};
        tenant.dashboardConfig.metrics = metrics;
        tenant.dashboardConfig.updatedAt = new Date();
        tenant.dashboardConfig.updatedBy = user.id;

        await tenant.save();
        return true;
      } catch (error) {
        throw new UserInputError(error.message);
      }
    },

    async exportAnalytics(_, { filter, format }, { tenant, user }) {
      if (!tenant || !user) throw new ForbiddenError('Authentication required');
      
      try {
        // Fetch all relevant metrics
        const [revenue, bookings, customers, staff, utilization] = await Promise.all([
          analyticsService.getRevenueMetrics(tenant.id, filter),
          analyticsService.getBookingMetrics(tenant.id, filter),
          analyticsService.getCustomerMetrics(tenant.id, filter),
          analyticsService.getStaffPerformance(tenant.id, filter),
          analyticsService.getUtilizationMetrics(tenant.id, filter)
        ]);

        // Combine data into a comprehensive report
        const data = {
          revenue,
          bookings,
          customers,
          staff,
          utilization
        };

        // Generate report in requested format
        switch (format) {
          case 'CSV':
            return analyticsService.generateCSV(data, Object.keys(data));
          case 'EXCEL':
            return analyticsService.generateExcel(data, Object.keys(data));
          case 'PDF':
            return analyticsService.generatePDF(data, Object.keys(data));
          default:
            throw new Error('Unsupported format');
        }
      } catch (error) {
        throw new UserInputError(error.message);
      }
    }
  }
};

module.exports = resolvers;