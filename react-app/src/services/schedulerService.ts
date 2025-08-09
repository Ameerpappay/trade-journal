import { BaseApiService } from "./api/baseService";

export interface ScheduledJob {
  running: boolean;
  scheduled: boolean;
}

export interface ScheduledJobStatus {
  [jobName: string]: ScheduledJob;
}

class SchedulerService extends BaseApiService {
  // Get status of all scheduled jobs
  async getScheduledJobs(): Promise<ScheduledJobStatus> {
    const response = await this.request<{ scheduledJobs: ScheduledJobStatus }>(
      "/api/scheduled-jobs"
    );
    return response.scheduledJobs;
  }

  // Start specific scheduled job
  async startScheduledJob(jobName: string): Promise<void> {
    await this.request(`/api/scheduled-jobs/${jobName}/start`, {
      method: "POST",
    });
  }

  // Stop specific scheduled job
  async stopScheduledJob(jobName: string): Promise<void> {
    await this.request(`/api/scheduled-jobs/${jobName}/stop`, {
      method: "POST",
    });
  }

  // Trigger specific scheduled job manually
  async triggerScheduledJob(jobName: string): Promise<{ jobId?: string }> {
    const response = await this.request<{ jobId?: string }>(
      `/api/scheduled-jobs/${jobName}/trigger`,
      { method: "POST" }
    );
    return response;
  }

  // Start all scheduled jobs
  async startAllScheduledJobs(): Promise<void> {
    await this.request("/api/scheduled-jobs/start-all", { method: "POST" });
  }

  // Stop all scheduled jobs
  async stopAllScheduledJobs(): Promise<void> {
    await this.request("/api/scheduled-jobs/stop-all", { method: "POST" });
  }
}

export const schedulerService = new SchedulerService();
