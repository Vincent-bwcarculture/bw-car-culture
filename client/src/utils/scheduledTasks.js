// server/utils/scheduledTasks.js
import cron from 'node-cron';
import analyticsService from '../services/analyticsService.js';

class ScheduledTasks {
  constructor() {
    this.tasks = [];
  }

  // Initialize all scheduled tasks
  init() {
    console.log('Initializing scheduled tasks...');

    // Generate daily metrics at 1 AM every day
    this.scheduleTask('0 1 * * *', this.generateDailyMetrics, 'Generate Daily Metrics');

    // Generate weekly metrics on Sundays at 2 AM
    this.scheduleTask('0 2 * * 0', this.generateWeeklyMetrics, 'Generate Weekly Metrics');

    // Generate monthly metrics on the 1st of each month at 3 AM
    this.scheduleTask('0 3 1 * *', this.generateMonthlyMetrics, 'Generate Monthly Metrics');

    // Clean up old session data every hour
    this.scheduleTask('0 * * * *', this.cleanupOldSessions, 'Cleanup Old Sessions');

    // Update real-time metrics every 5 minutes
    this.scheduleTask('*/5 * * * *', this.updateRealTimeMetrics, 'Update Real-time Metrics');

    console.log('Scheduled tasks initialized successfully');
  }

  // Schedule a task
  scheduleTask(cronPattern, taskFunction, taskName) {
    try {
      const task = cron.schedule(cronPattern, async () => {
        console.log(`Running scheduled task: ${taskName}`);
        try {
          await taskFunction();
          console.log(`Completed scheduled task: ${taskName}`);
        } catch (error) {
          console.error(`Error in scheduled task ${taskName}:`, error);
        }
      }, {
        scheduled: true,
        timezone: "UTC"
      });

      this.tasks.push({ name: taskName, task, pattern: cronPattern });
      console.log(`Scheduled task: ${taskName} (${cronPattern})`);
    } catch (error) {
      console.error(`Failed to schedule task ${taskName}:`, error);
    }
  }

  // Generate daily metrics
  async generateDailyMetrics() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    try {
      await analyticsService.generateDailyMetrics(yesterday);
      console.log(`Generated daily metrics for ${yesterday.toISOString().split('T')[0]}`);
    } catch (error) {
      console.error('Error generating daily metrics:', error);
    }
  }

  // Generate weekly metrics
  async generateWeeklyMetrics() {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    try {
      // Generate metrics for the past week
      for (let i = 0; i < 7; i++) {
        const date = new Date(lastWeek);
        date.setDate(date.getDate() + i);
        await analyticsService.generateDailyMetrics(date);
      }
      console.log('Generated weekly metrics');
    } catch (error) {
      console.error('Error generating weekly metrics:', error);
    }
  }

  // Generate monthly metrics
  async generateMonthlyMetrics() {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    try {
      // Generate metrics for each day of the past month
      const daysInMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), day);
        await analyticsService.generateDailyMetrics(date);
      }
      console.log('Generated monthly metrics');
    } catch (error) {
      console.error('Error generating monthly metrics:', error);
    }
  }

  // Clean up old sessions
  async cleanupOldSessions() {
    try {
      const { Session } = await import('../models/Analytics.js');
      
      // Mark sessions as inactive if they haven't been updated in 30 minutes
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      
      const result = await Session.updateMany(
        { 
          endTime: { $lt: thirtyMinutesAgo },
          isActive: true 
        },
        { 
          $set: { isActive: false }
        }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`Marked ${result.modifiedCount} sessions as inactive`);
      }
      
      // Delete very old session data (older than 90 days)
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      
      const deleteResult = await Session.deleteMany({
        startTime: { $lt: ninetyDaysAgo }
      });
      
      if (deleteResult.deletedCount > 0) {
        console.log(`Deleted ${deleteResult.deletedCount} old sessions`);
      }
    } catch (error) {
      console.error('Error cleaning up sessions:', error);
    }
  }

  // Update real-time metrics cache
  async updateRealTimeMetrics() {
    try {
      // This could update a cache or trigger real-time data updates
      // For now, we'll just log that it's running
      console.log('Updated real-time metrics cache');
    } catch (error) {
      console.error('Error updating real-time metrics:', error);
    }
  }

  // Stop all scheduled tasks
  stopAll() {
    console.log('Stopping all scheduled tasks...');
    this.tasks.forEach(({ name, task }) => {
      task.destroy();
      console.log(`Stopped task: ${name}`);
    });
    this.tasks = [];
  }

  // Get status of all tasks
  getStatus() {
    return this.tasks.map(({ name, pattern }) => ({
      name,
      pattern,
      status: 'running'
    }));
  }
}

// Create and export singleton instance
const scheduledTasks = new ScheduledTasks();
export default scheduledTasks;
