export interface SyncMetrics {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageLatency: number;
  lastSyncDuration: number;
  errorRate: number;
  retryCount: number;
}

export interface SyncPerformanceData {
  timestamp: Date;
  operation: string;
  duration: number;
  success: boolean;
  error?: string;
  retries: number;
}

export class SyncMetricsService {
  private static instance: SyncMetricsService;
  private performanceData: SyncPerformanceData[] = [];
  private readonly maxDataPoints = 100;

  static getInstance(): SyncMetricsService {
    if (!SyncMetricsService.instance) {
      SyncMetricsService.instance = new SyncMetricsService();
    }
    return SyncMetricsService.instance;
  }

  recordOperation(
    operation: string, 
    duration: number, 
    success: boolean, 
    error?: string, 
    retries: number = 0
  ): void {
    const dataPoint: SyncPerformanceData = {
      timestamp: new Date(),
      operation,
      duration,
      success,
      error,
      retries
    };

    this.performanceData.push(dataPoint);

    // Keep only the most recent data points
    if (this.performanceData.length > this.maxDataPoints) {
      this.performanceData = this.performanceData.slice(-this.maxDataPoints);
    }

    console.log(`SyncMetricsService: Recorded ${operation} - Duration: ${duration}ms, Success: ${success}`);
  }

  getMetrics(): SyncMetrics {
    if (this.performanceData.length === 0) {
      return {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        averageLatency: 0,
        lastSyncDuration: 0,
        errorRate: 0,
        retryCount: 0
      };
    }

    const total = this.performanceData.length;
    const successful = this.performanceData.filter(d => d.success).length;
    const failed = total - successful;
    const averageLatency = this.performanceData.reduce((sum, d) => sum + d.duration, 0) / total;
    const lastSyncDuration = this.performanceData[this.performanceData.length - 1]?.duration || 0;
    const errorRate = (failed / total) * 100;
    const retryCount = this.performanceData.reduce((sum, d) => sum + d.retries, 0);

    return {
      totalOperations: total,
      successfulOperations: successful,
      failedOperations: failed,
      averageLatency: Math.round(averageLatency),
      lastSyncDuration,
      errorRate: Math.round(errorRate * 100) / 100,
      retryCount
    };
  }

  getRecentErrors(limit: number = 10): Array<{ operation: string; error: string; timestamp: Date }> {
    return this.performanceData
      .filter(d => !d.success && d.error)
      .slice(-limit)
      .map(d => ({
        operation: d.operation,
        error: d.error!,
        timestamp: d.timestamp
      }));
  }

  getSlowestOperations(limit: number = 5): Array<{ operation: string; duration: number; timestamp: Date }> {
    return [...this.performanceData]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit)
      .map(d => ({
        operation: d.operation,
        duration: d.duration,
        timestamp: d.timestamp
      }));
  }

  getOperationStats(operation: string): {
    count: number;
    successRate: number;
    averageDuration: number;
    totalRetries: number;
  } {
    const operationData = this.performanceData.filter(d => d.operation === operation);
    
    if (operationData.length === 0) {
      return { count: 0, successRate: 0, averageDuration: 0, totalRetries: 0 };
    }

    const successful = operationData.filter(d => d.success).length;
    const successRate = (successful / operationData.length) * 100;
    const averageDuration = operationData.reduce((sum, d) => sum + d.duration, 0) / operationData.length;
    const totalRetries = operationData.reduce((sum, d) => sum + d.retries, 0);

    return {
      count: operationData.length,
      successRate: Math.round(successRate * 100) / 100,
      averageDuration: Math.round(averageDuration),
      totalRetries
    };
  }

  clearMetrics(): void {
    this.performanceData = [];
    console.log('SyncMetricsService: Metrics cleared');
  }

  exportMetrics(): string {
    const metrics = this.getMetrics();
    const recentErrors = this.getRecentErrors();
    const slowestOps = this.getSlowestOperations();

    const report = {
      summary: metrics,
      recentErrors,
      slowestOperations: slowestOps,
      timestamp: new Date().toISOString()
    };

    return JSON.stringify(report, null, 2);
  }
}

export const syncMetricsService = SyncMetricsService.getInstance();
