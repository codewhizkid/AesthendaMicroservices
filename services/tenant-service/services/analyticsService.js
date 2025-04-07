const { Appointment, Customer, Staff, Service } = require('../models');
const { subscribeToEvent } = require('../utils/eventBus');
const logger = require('../utils/logger');
const { format } = require('date-fns');
const ExcelJS = require('exceljs');
const json2csv = require('json2csv').parse;

class AnalyticsService {
  constructor() {
    this.setupEventListeners();
    this.metricCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  setupEventListeners() {
    const events = [
      'appointment.created',
      'appointment.completed',
      'appointment.cancelled',
      'appointment.noShow',
      'payment.received',
      'customer.created'
    ];

    events.forEach(eventType => {
      subscribeToEvent(eventType, async (data) => {
        await this.handleEvent(eventType, data);
      });
    });
  }

  async handleEvent(eventType, data) {
    try {
      const { tenantId } = data;
      // Clear cached metrics for this tenant
      this.clearTenantCache(tenantId);
      
      // Update real-time metrics
      await this.updateRealTimeMetrics(tenantId, eventType, data);
    } catch (error) {
      logger.error('Error handling analytics event', {
        eventType,
        error: error.message,
        stack: error.stack
      });
    }
  }

  clearTenantCache(tenantId) {
    for (const [key, value] of this.metricCache.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        this.metricCache.delete(key);
      }
    }
  }

  async getRevenueMetrics(tenantId, filter) {
    const cacheKey = `${tenantId}:revenue:${JSON.stringify(filter)}`;
    const cached = this.getCachedMetric(cacheKey);
    if (cached) return cached;

    const { startDate, endDate } = filter.dateRange;
    const query = {
      tenantId,
      status: 'COMPLETED',
      date: { $gte: startDate, $lte: endDate }
    };

    if (filter.serviceIds) {
      query['services.serviceId'] = { $in: filter.serviceIds };
    }
    if (filter.staffIds) {
      query.staffId = { $in: filter.staffIds };
    }

    const appointments = await Appointment.find(query)
      .populate('services.serviceId staffId');

    const metrics = {
      total: 0,
      byService: new Map(),
      byStaff: new Map(),
      trends: new Map()
    };

    appointments.forEach(appointment => {
      const revenue = appointment.totalAmount;
      metrics.total += revenue;

      // By service
      appointment.services.forEach(service => {
        const serviceMetric = metrics.byService.get(service.serviceId._id) || {
          serviceId: service.serviceId._id,
          serviceName: service.serviceId.name,
          revenue: 0,
          appointments: 0,
          averageRevenue: 0
        };
        serviceMetric.revenue += service.price;
        serviceMetric.appointments += 1;
        metrics.byService.set(service.serviceId._id, serviceMetric);
      });

      // By staff
      const staffMetric = metrics.byStaff.get(appointment.staffId._id) || {
        staffId: appointment.staffId._id,
        staffName: appointment.staffId.name,
        revenue: 0,
        appointments: 0,
        averageRevenue: 0
      };
      staffMetric.revenue += revenue;
      staffMetric.appointments += 1;
      metrics.byStaff.set(appointment.staffId._id, staffMetric);

      // Trends
      const date = format(appointment.date, 'yyyy-MM-dd');
      const trend = metrics.trends.get(date) || {
        date: appointment.date,
        revenue: 0,
        appointments: 0
      };
      trend.revenue += revenue;
      trend.appointments += 1;
      metrics.trends.set(date, trend);
    });

    // Calculate averages
    for (const service of metrics.byService.values()) {
      service.averageRevenue = service.revenue / service.appointments;
    }
    for (const staff of metrics.byStaff.values()) {
      staff.averageRevenue = staff.revenue / staff.appointments;
    }

    const result = {
      total: metrics.total,
      byService: Array.from(metrics.byService.values()),
      byStaff: Array.from(metrics.byStaff.values()),
      trends: Array.from(metrics.trends.values()).sort((a, b) => a.date - b.date)
    };

    this.setCachedMetric(cacheKey, result);
    return result;
  }

  async getBookingMetrics(tenantId, filter) {
    const cacheKey = `${tenantId}:bookings:${JSON.stringify(filter)}`;
    const cached = this.getCachedMetric(cacheKey);
    if (cached) return cached;

    const { startDate, endDate } = filter.dateRange;
    const query = {
      tenantId,
      date: { $gte: startDate, $lte: endDate }
    };

    const appointments = await Appointment.find(query);
    const waitlistEntries = await WaitList.find({
      tenantId,
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'CONVERTED'
    });

    const metrics = {
      total: appointments.length,
      completed: appointments.filter(a => a.status === 'COMPLETED').length,
      cancelled: appointments.filter(a => a.status === 'CANCELLED').length,
      noShows: appointments.filter(a => a.status === 'NO_SHOW').length,
      waitlistConversions: waitlistEntries.length,
      conversionRate: 0
    };

    // Calculate conversion rate
    const totalWaitlist = await WaitList.countDocuments({
      tenantId,
      createdAt: { $gte: startDate, $lte: endDate }
    });
    metrics.conversionRate = totalWaitlist > 0 ? 
      (waitlistEntries.length / totalWaitlist) * 100 : 0;

    this.setCachedMetric(cacheKey, metrics);
    return metrics;
  }

  async getCustomerMetrics(tenantId, filter) {
    const cacheKey = `${tenantId}:customers:${JSON.stringify(filter)}`;
    const cached = this.getCachedMetric(cacheKey);
    if (cached) return cached;

    const { startDate, endDate } = filter.dateRange;
    
    // Get all customers with appointments in the date range
    const customers = await Customer.find({
      tenantId,
      createdAt: { $lte: endDate }
    });

    const appointments = await Appointment.find({
      tenantId,
      customerId: { $in: customers.map(c => c._id) },
      date: { $gte: startDate, $lte: endDate },
      status: 'COMPLETED'
    });

    // Calculate metrics
    const newCustomers = customers.filter(c => 
      c.createdAt >= startDate && c.createdAt <= endDate).length;

    const customerVisits = new Map();
    appointments.forEach(appointment => {
      const count = customerVisits.get(appointment.customerId) || 0;
      customerVisits.set(appointment.customerId, count + 1);
    });

    const repeatCustomers = Array.from(customerVisits.values())
      .filter(visits => visits > 1).length;

    const totalVisits = Array.from(customerVisits.values())
      .reduce((sum, visits) => sum + visits, 0);

    const metrics = {
      totalCustomers: customers.length,
      newCustomers,
      repeatCustomers,
      averageVisitsPerCustomer: customerVisits.size > 0 ? 
        totalVisits / customerVisits.size : 0,
      retentionRate: customers.length > 0 ? 
        (repeatCustomers / customers.length) * 100 : 0,
      customerLifetimeValue: customers.length > 0 ?
        (await this.calculateCustomerLifetimeValue(tenantId)) : 0
    };

    this.setCachedMetric(cacheKey, metrics);
    return metrics;
  }

  async getStaffPerformance(tenantId, filter) {
    const cacheKey = `${tenantId}:staff:${JSON.stringify(filter)}`;
    const cached = this.getCachedMetric(cacheKey);
    if (cached) return cached;

    const { startDate, endDate } = filter.dateRange;
    const staffQuery = filter.staffIds ? { _id: { $in: filter.staffIds } } : {};
    
    const staff = await Staff.find({ tenantId, ...staffQuery });
    const metrics = [];

    for (const member of staff) {
      const appointments = await Appointment.find({
        tenantId,
        staffId: member._id,
        date: { $gte: startDate, $lte: endDate }
      });

      const completed = appointments.filter(a => a.status === 'COMPLETED');
      const totalRevenue = completed.reduce((sum, a) => sum + a.totalAmount, 0);
      const totalServiceTime = completed.reduce((sum, a) => sum + a.duration, 0);

      metrics.push({
        staffId: member._id,
        staffName: member.name,
        appointmentsCompleted: completed.length,
        completionRate: appointments.length > 0 ?
          (completed.length / appointments.length) * 100 : 0,
        averageServiceTime: completed.length > 0 ?
          totalServiceTime / completed.length : 0,
        customerSatisfaction: await this.calculateStaffSatisfaction(member._id, filter),
        revenue: totalRevenue
      });
    }

    this.setCachedMetric(cacheKey, metrics);
    return metrics;
  }

  async getUtilizationMetrics(tenantId, filter) {
    const cacheKey = `${tenantId}:utilization:${JSON.stringify(filter)}`;
    const cached = this.getCachedMetric(cacheKey);
    if (cached) return cached;

    const { startDate, endDate } = filter.dateRange;
    const appointments = await Appointment.find({
      tenantId,
      date: { $gte: startDate, $lte: endDate }
    });

    // Calculate peak hours
    const hourlyAppointments = new Map();
    appointments.forEach(appointment => {
      const hour = new Date(appointment.date).getHours();
      const count = hourlyAppointments.get(hour) || 0;
      hourlyAppointments.set(hour, count + 1);
    });

    const peakHours = Array.from(hourlyAppointments.entries())
      .map(([hour, count]) => ({
        hour,
        appointments: count,
        utilization: this.calculateHourlyUtilization(hour, count, tenantId)
      }));

    // Calculate resource utilization
    const resources = await Resource.find({ tenantId });
    const resourceUtilization = await Promise.all(
      resources.map(async resource => {
        const stats = await this.calculateResourceUtilization(
          resource._id,
          startDate,
          endDate
        );
        return {
          resourceId: resource._id,
          resourceName: resource.name,
          ...stats
        };
      })
    );

    const metrics = {
      overallUtilization: this.calculateOverallUtilization(resourceUtilization),
      peakHours: peakHours.sort((a, b) => b.appointments - a.appointments),
      resourceUtilization
    };

    this.setCachedMetric(cacheKey, metrics);
    return metrics;
  }

  async generateCustomReport(reportId, filter, format) {
    const report = await CustomReport.findOne({ _id: reportId });
    if (!report) throw new Error('Report not found');

    // Fetch data based on report configuration
    const data = await this.fetchReportData(report, filter);

    // Format data based on requested format
    switch (format) {
      case 'CSV':
        return this.generateCSV(data, report.columns);
      case 'EXCEL':
        return this.generateExcel(data, report.columns);
      case 'PDF':
        return this.generatePDF(data, report.columns);
      default:
        throw new Error('Unsupported format');
    }
  }

  async updateRealTimeMetrics(tenantId, eventType, data) {
    const metrics = await this.getDashboardMetrics(tenantId);
    
    // Update relevant metrics based on event type
    switch (eventType) {
      case 'appointment.created':
        metrics.find(m => m.type === 'BOOKINGS').value.total++;
        break;
      case 'appointment.completed':
        metrics.find(m => m.type === 'REVENUE').value.total += data.amount;
        break;
      // Add more event handlers as needed
    }

    // Store updated metrics
    await this.storeDashboardMetrics(tenantId, metrics);
  }

  // Helper methods
  getCachedMetric(key) {
    const cached = this.metricCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCachedMetric(key, data) {
    this.metricCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  async calculateCustomerLifetimeValue(tenantId) {
    const totalRevenue = await Appointment.aggregate([
      { $match: { tenantId, status: 'COMPLETED' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const customerCount = await Customer.countDocuments({ tenantId });
    return customerCount > 0 ? totalRevenue[0]?.total / customerCount : 0;
  }

  async calculateStaffSatisfaction(staffId, filter) {
    // Implement satisfaction calculation based on reviews/ratings
    // This is a placeholder implementation
    return 4.5;
  }

  calculateHourlyUtilization(hour, appointments, tenantId) {
    // Implement hourly utilization calculation
    // This is a placeholder implementation
    return (appointments / 10) * 100; // Assuming 10 is max capacity per hour
  }

  async calculateResourceUtilization(resourceId, startDate, endDate) {
    // Implement resource utilization calculation
    // This is a placeholder implementation
    return {
      utilization: 75,
      totalHours: 160,
      bookedHours: 120
    };
  }

  calculateOverallUtilization(resourceUtilization) {
    if (resourceUtilization.length === 0) return 0;
    return resourceUtilization.reduce((sum, r) => sum + r.utilization, 0) / 
      resourceUtilization.length;
  }

  async fetchReportData(report, filter) {
    // Implement data fetching based on report configuration
    // This is a placeholder implementation
    return [];
  }

  generateCSV(data, columns) {
    return json2csv(data, { fields: columns });
  }

  async generateExcel(data, columns) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');
    
    worksheet.columns = columns.map(col => ({ header: col, key: col }));
    worksheet.addRows(data);

    return await workbook.xlsx.writeBuffer();
  }

  async generatePDF(data, columns) {
    // Implement PDF generation
    // This is a placeholder implementation
    return Buffer.from('PDF content');
  }
}

module.exports = new AnalyticsService(); 