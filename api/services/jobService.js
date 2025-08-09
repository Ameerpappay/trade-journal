const EventEmitter = require("events");
const { v4: uuidv4 } = require("uuid");
const { Op } = require("sequelize");
const stockScrapingService = require("./stockScrapingService");
const { Screener, Stock, User, StockScreenerResult } = require("../models");

class JobService extends EventEmitter {
  constructor() {
    super();
    this.jobs = new Map();
    this.jobCounter = 0;
  }

  // Check if a job of the same type is already running
  isJobTypeRunning(jobType) {
    for (const job of this.jobs.values()) {
      if (job.type === jobType && job.status === "running") {
        return job;
      }
    }
    return null;
  }

  // Get job status by type
  getJobStatusByType(jobType) {
    const job = this.isJobTypeRunning(jobType);
    if (job) {
      const duration = Math.round((Date.now() - job.startTime) / 1000);
      return {
        isRunning: true,
        jobId: job.id,
        duration,
        progress: job.progress,
      };
    }
    return { isRunning: false };
  }

  // Start a background scraping job
  async startScrapingJob(userId = null) {
    // Check if scraping job is already running
    const existingJob = this.isJobTypeRunning("scraping");
    if (existingJob) {
      throw new Error(`Scraping job is already running: ${existingJob.id}`);
    }

    const jobId = `scraping_${++this.jobCounter}_${Date.now()}`;

    const job = {
      id: jobId,
      type: "scraping",
      status: "running",
      startTime: Date.now(),
      progress: [],
      error: null,
      userId: userId,
    };

    this.jobs.set(jobId, job);

    console.log(`Started background scraping job: ${jobId}`);
    this.emit("jobStarted", { jobId, type: "scraping" });

    // Start the scraping process in background
    this.performScrapingProcess(jobId, userId).catch((error) => {
      console.error(`Scraping job ${jobId} failed:`, error);
      this.handleJobError(jobId, error);
    });

    return jobId;
  }

  // Start a background chart download job
  async startChartDownloadJob(userId = null) {
    // Check if chart download job is already running
    const existingJob = this.isJobTypeRunning("chart_download");
    if (existingJob) {
      throw new Error(
        `Chart download job is already running: ${existingJob.id}`
      );
    }

    const jobId = `charts_${++this.jobCounter}_${Date.now()}`;

    const job = {
      id: jobId,
      type: "chart_download",
      status: "running",
      startTime: Date.now(),
      progress: [],
      error: null,
      userId: userId,
    };

    this.jobs.set(jobId, job);

    console.log(`Started background chart download job: ${jobId}`);
    this.emit("jobStarted", { jobId, type: "chart_download" });

    // Start the chart download process in background
    this.performChartDownload(jobId).catch((error) => {
      console.error(`Chart download job ${jobId} failed:`, error);
      this.handleJobError(jobId, error);
    });

    return jobId;
  }

  async performScrapingProcess(jobId, userId) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      this.addJobProgress(jobId, "Getting active screeners from database...");

      // Get actual screeners from the database
      const screeners = await Screener.findAll({
        where: { isActive: true },
        order: [["scanName", "ASC"]],
        attributes: [
          "id",
          "scanName",
          "description",
          "sourceName",
          "sourceUrl",
        ],
      });

      if (screeners.length === 0) {
        this.addJobProgress(jobId, "No active screeners found in database");
        this.completeJob(jobId, {
          stockCount: 0,
          updatedCount: 0,
          screeners: 0,
          message: "No active screeners configured",
        });
        return;
      }

      this.addJobProgress(
        jobId,
        `Found ${screeners.length} active screener(s). Processing sequentially to avoid rate limiting...`
      );

      // Convert screeners to format expected by stockScrapingService
      const screenerConfigs = screeners.map((screener) => ({
        id: screener.id,
        scanName: screener.scanName,
        description: screener.description,
        sourceName: screener.sourceName,
        sourceUrl: screener.sourceUrl,
        stocksSourceName: screener.sourceName, // legacy field for compatibility
        stocksSourceUrl: screener.sourceUrl, // legacy field for compatibility
      }));

      this.addJobProgress(jobId, "Starting real stock scraping process...");

      // Create a progress callback that will forward messages to the job
      const progressCallback = (message) => {
        this.addJobProgress(jobId, message);
      };

      // Use the actual stock scraping service with progress reporting
      const screenersData = await stockScrapingService.processMultipleScreeners(
        screenerConfigs,
        progressCallback
      );

      let totalStocksFound = 0;
      if (screenersData && screenersData.length > 0) {
        totalStocksFound = screenersData.reduce(
          (total, screenerData) =>
            total + (screenerData.result ? screenerData.result.length : 0),
          0
        );

        this.addJobProgress(
          jobId,
          `Scraped ${totalStocksFound} total stocks from ${screenersData.length} screeners`
        );

        this.addJobProgress(
          jobId,
          "Updating database with screener results..."
        );

        // Save the scraped results to database
        const updatedCount =
          await stockScrapingService.updateStockScreenerResults(
            screenersData,
            userId
          );

        this.addJobProgress(
          jobId,
          `Successfully updated ${updatedCount} stock screener results in database`
        );

        this.completeJob(jobId, {
          stockCount: totalStocksFound,
          updatedCount: updatedCount,
          screeners: screenersData.length,
          screenerNames: screenersData.map((s) => s.screenerConfig.scanName),
        });
      } else {
        this.addJobProgress(jobId, "No data returned from screeners");
        this.completeJob(jobId, {
          stockCount: 0,
          updatedCount: 0,
          screeners: 0,
          message: "No valid screener data returned",
        });
      }
    } catch (error) {
      this.handleJobError(jobId, error);
    }
  }

  async performChartDownload(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      this.addJobProgress(jobId, "Starting chart download...");

      this.addJobProgress(
        jobId,
        "Getting stocks eligible for chart download from database..."
      );

      // Get stocks that are eligible for chart download using the real service
      const eligibleStocks =
        await stockScrapingService.getStocksEligibleForChartDownload();

      if (eligibleStocks.length === 0) {
        this.completeJob(jobId, {
          chartCount: 0,
          message:
            "No stocks found for chart download (no stocks meet criteria: non-debt + screener results)",
        });
        return;
      }

      this.addJobProgress(
        jobId,
        `Found ${eligibleStocks.length} stocks eligible for chart download...`
      );

      // Use the real chart download service
      this.addJobProgress(jobId, "Starting batch chart download process...");

      // Create a progress callback for chart downloads
      const chartProgressCallback = (message) => {
        this.addJobProgress(jobId, message);
      };

      const maxConcurrentProcesses = 4; // Reduced from 8 to be more conservative
      const chartResults =
        await stockScrapingService.downloadChartsForMultipleStocks(
          eligibleStocks,
          maxConcurrentProcesses,
          chartProgressCallback
        );

      // Count successful downloads
      const successfulDownloads = chartResults.filter(
        (result) =>
          result &&
          result.downloadedPaths &&
          result.downloadedPaths.trim().length > 0
      );

      const totalChartsDownloaded = chartResults.reduce((total, result) => {
        if (result && result.downloadedPaths) {
          const paths = Array.isArray(result.downloadedPaths)
            ? result.downloadedPaths
            : result.downloadedPaths.split(",");
          return (
            total +
            paths.filter((path) => path && path.trim().length > 0).length
          );
        }
        return total;
      }, 0);

      this.addJobProgress(jobId, "Updating database with chart information...");

      // Update database with chart information
      const updatedChartCount = await stockScrapingService.updateStockCharts(
        chartResults
      );

      this.completeJob(jobId, {
        chartCount: totalChartsDownloaded,
        updatedChartCount: updatedChartCount,
        eligibleStocks: eligibleStocks.length,
        successfulStocks: successfulDownloads.length,
      });
    } catch (error) {
      this.handleJobError(jobId, error);
    }
  }

  addJobProgress(jobId, message) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    const timestamp = new Date().toISOString();
    job.progress.push({ timestamp, message });

    console.log(`[${jobId}] Progress: ${message}`);
    this.emit("jobProgress", { jobId, message, timestamp });
  }

  completeJob(jobId, result) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = "completed";
    job.endTime = Date.now();
    job.result = result;

    console.log(`[${jobId}] Job completed successfully`);
    this.emit("jobCompleted", { jobId, type: job.type, result });
  }

  handleJobError(jobId, error) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = "failed";
    job.endTime = Date.now();
    job.error = { message: error.message, stack: error.stack };

    console.error(`[${jobId}] Job failed:`, error);
    this.emit("jobError", { jobId, error: error.message, stack: error.stack });
  }

  // Get job status
  getJobStatus(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return null;

    const duration = job.endTime
      ? job.endTime - job.startTime
      : Date.now() - job.startTime;

    return {
      id: job.id,
      type: job.type,
      status: job.status,
      startTime: new Date(job.startTime).toISOString(),
      endTime: job.endTime ? new Date(job.endTime).toISOString() : null,
      duration: duration,
      stocksFound: job.result?.stockCount || 0,
      resultsSaved: job.result?.updatedCount || 0,
      chartsDownloaded: job.result?.chartCount || 0,
      chartsSaved: job.result?.updatedChartCount || 0,
      error: job.error?.message || null,
    };
  }

  // Get all jobs
  getAllJobs() {
    return Array.from(this.jobs.values()).map((job) =>
      this.getJobStatus(job.id)
    );
  }

  // Get running jobs
  getRunningJobs() {
    return this.getAllJobs().filter((job) => job.status === "running");
  }

  // Get job history
  getJobHistory(limit = 50) {
    const allJobs = this.getAllJobs();
    const completedJobs = allJobs.filter((job) => job.status !== "running");
    return completedJobs
      .sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      )
      .slice(0, limit);
  }

  // Cancel a job
  cancelJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    if (job.status === "running") {
      job.status = "cancelled";
      job.endTime = Date.now();

      console.log(`[${jobId}] Job cancelled`);
      this.emit("jobCancelled", { jobId, type: job.type });
      return true;
    }

    return false;
  }

  // Get job statistics
  getJobStats() {
    const allJobs = this.getAllJobs();
    return {
      total: allJobs.length,
      running: allJobs.filter((job) => job.status === "running").length,
      completed: allJobs.filter((job) => job.status === "completed").length,
      failed: allJobs.filter((job) => job.status === "failed").length,
      cancelled: allJobs.filter((job) => job.status === "cancelled").length,
    };
  }

  // Clean up old jobs
  cleanupOldJobs(maxAge = 24 * 60 * 60 * 1000) {
    const now = Date.now();
    const jobsToDelete = [];

    for (const [jobId, job] of this.jobs) {
      if (
        job.status !== "running" &&
        job.endTime &&
        now - job.endTime > maxAge
      ) {
        jobsToDelete.push(jobId);
      }
    }

    jobsToDelete.forEach((jobId) => {
      this.jobs.delete(jobId);
      console.log(`Cleaned up old job: ${jobId}`);
    });

    return jobsToDelete.length;
  }
}

module.exports = new JobService();
