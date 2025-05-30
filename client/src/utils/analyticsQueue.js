// src/utils/analyticsQueue.js
class AnalyticsQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.batchSize = 10;
    this.flushInterval = 30000; // 30 seconds
    
    this.startAutoFlush();
  }

  add(event) {
    this.queue.push({
      ...event,
      timestamp: Date.now()
    });

    if (this.queue.length >= this.batchSize) {
      this.flush();
    }
  }

  async flush() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const batch = this.queue.splice(0, this.batchSize);

    try {
      await fetch('/api/analytics/track/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: batch })
      });
    } catch (error) {
      console.warn('Failed to send analytics batch:', error);
      // Re-add failed events to queue
      this.queue.unshift(...batch);
    } finally {
      this.isProcessing = false;
    }
  }

  startAutoFlush() {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }
}

export const analyticsQueue = new AnalyticsQueue();
