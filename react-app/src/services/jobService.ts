import { BaseApiService } from "./api/baseService";

export interface Job {
  id: string;
  type: "screener" | "charts";
  userId: number;
  startTime: string;
  endTime?: string;
  status: "running" | "completed" | "failed" | "cancelled";

  // Screener job specific
  screenerId?: number;
  stocksFound?: number;
  resultsSaved?: number;

  // Chart job specific
  stockId?: number;
  chartsDownloaded?: number;
  chartsSaved?: number;

  // Error info
  error?: string;
}

export interface JobStats {
  total: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
}

export interface JobResponse {
  message: string;
  job?: Job;
  jobId?: string;
  success?: boolean;
  stocksFound?: number;
  resultsSaved?: number;
  chartsDownloaded?: number;
  chartsSaved?: number;
}

class JobService extends BaseApiService {
  private baseUrl = "/api/jobs";

  async getRunningJobs() {
    return this.request<Job[]>(`${this.baseUrl}/running`);
  }

  async getJobHistory(limit?: number) {
    const queryParams = new URLSearchParams();
    if (limit !== undefined) {
      queryParams.append("limit", limit.toString());
    }

    const url = queryParams.toString()
      ? `${this.baseUrl}/history?${queryParams}`
      : `${this.baseUrl}/history`;

    return this.request<Job[]>(url);
  }

  async getJobById(jobId: string) {
    return this.request<Job>(`${this.baseUrl}/${jobId}`);
  }

  async startScreenerJob(screenerId: number) {
    return this.request<JobResponse>(`${this.baseUrl}/screener/${screenerId}`, {
      method: "POST",
    });
  }

  async startChartDownloadJob(stockId: number, timeFrames?: string[]) {
    return this.request<JobResponse>(`${this.baseUrl}/charts/${stockId}`, {
      method: "POST",
      body: JSON.stringify({ timeFrames }),
    });
  }

  async cancelJob(jobId: string) {
    return this.request<{ message: string }>(`${this.baseUrl}/${jobId}`, {
      method: "DELETE",
    });
  }

  async getJobStats() {
    return this.request<JobStats>(`${this.baseUrl}/stats/overview`);
  }

  async cleanupJobHistory(maxAgeInDays?: number) {
    return this.request<{ message: string }>(`${this.baseUrl}/cleanup`, {
      method: "POST",
      body: JSON.stringify({ maxAgeInDays }),
    });
  }
}

export const jobService = new JobService();
