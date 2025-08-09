const cron = require("node-cron");
const jobService = require("./jobService");

class SchedulerService {
  constructor() {
    this.jobs = new Map();
  }

  // Schedule scraping job to run every day at 9 AM
  scheduleDailyScraping() {
    const task = cron.schedule(
      "0 9 * * *",
      async () => {
        console.log("Starting scheduled daily scraping job...");
        try {
          const jobId = await jobService.startScrapingJob();
          console.log(`Scheduled scraping job started: ${jobId}`);

          // Listen for completion to start chart download
          jobService.once("jobCompleted", async (data) => {
            if (data.type === "scraping") {
              console.log(
                "Scheduled scraping completed, starting chart download..."
              );
              try {
                const chartJobId = await jobService.startChartDownloadJob();
                console.log(
                  `Scheduled chart download job started: ${chartJobId}`
                );
              } catch (error) {
                console.error(
                  "Failed to start scheduled chart download:",
                  error
                );
              }
            }
          });
        } catch (error) {
          console.error("Failed to start scheduled scraping job:", error);
        }
      },
      {
        scheduled: false, // Don't start immediately
        timezone: "Asia/Kolkata", // Adjust to your timezone
      }
    );

    this.jobs.set("daily_scraping", task);
    return task;
  }

  // Schedule chart updates every 4 hours during market hours
  scheduleMarketHoursChartUpdate() {
    // Run at 10 AM, 2 PM, and 6 PM on weekdays
    const task = cron.schedule(
      "0 10,14,18 * * 1-5",
      async () => {
        console.log("Starting scheduled chart update job...");
        try {
          const jobId = await jobService.startChartDownloadJob();
          console.log(`Scheduled chart update job started: ${jobId}`);
        } catch (error) {
          console.error("Failed to start scheduled chart update:", error);
        }
      },
      {
        scheduled: false,
        timezone: "Asia/Kolkata",
      }
    );

    this.jobs.set("market_hours_charts", task);
    return task;
  }

  // Schedule cleanup of old jobs daily at midnight
  scheduleJobCleanup() {
    const task = cron.schedule(
      "0 0 * * *",
      async () => {
        console.log("Running scheduled job cleanup...");
        try {
          const cleanedCount = await jobService.cleanupOldJobs(
            24 * 60 * 60 * 1000
          ); // 24 hours
          console.log(`Cleaned up ${cleanedCount} old jobs`);
        } catch (error) {
          console.error("Failed during job cleanup:", error);
        }
      },
      {
        scheduled: false,
        timezone: "Asia/Kolkata",
      }
    );

    this.jobs.set("job_cleanup", task);
    return task;
  }

  // Schedule weekend full update (scraping + charts)
  scheduleWeekendUpdate() {
    // Run on Saturday at 8 AM
    const task = cron.schedule(
      "0 8 * * 6",
      async () => {
        console.log("Starting scheduled weekend full update...");
        try {
          const jobId = await jobService.startScrapingJob();
          console.log(`Weekend scraping job started: ${jobId}`);

          jobService.once("jobCompleted", async (data) => {
            if (data.type === "scraping") {
              console.log(
                "Weekend scraping completed, starting chart download..."
              );
              try {
                const chartJobId = await jobService.startChartDownloadJob();
                console.log(
                  `Weekend chart download job started: ${chartJobId}`
                );
              } catch (error) {
                console.error("Failed to start weekend chart download:", error);
              }
            }
          });
        } catch (error) {
          console.error("Failed to start weekend update:", error);
        }
      },
      {
        scheduled: false,
        timezone: "Asia/Kolkata",
      }
    );

    this.jobs.set("weekend_update", task);
    return task;
  }

  // Start all scheduled jobs
  startAll() {
    console.log("Starting all scheduled jobs...");

    // Create all scheduled jobs
    this.scheduleDailyScraping();
    this.scheduleMarketHoursChartUpdate();
    this.scheduleJobCleanup();
    this.scheduleWeekendUpdate();

    // Start them
    this.jobs.forEach((task, name) => {
      task.start();
      console.log(`✓ Started scheduled job: ${name}`);
    });

    console.log(`Started ${this.jobs.size} scheduled jobs`);
  }

  // Stop all scheduled jobs
  stopAll() {
    console.log("Stopping all scheduled jobs...");
    this.jobs.forEach((task, name) => {
      task.stop();
      console.log(`✓ Stopped scheduled job: ${name}`);
    });
    console.log(`Stopped ${this.jobs.size} scheduled jobs`);
  }

  // Start specific job
  start(jobName) {
    const task = this.jobs.get(jobName);
    if (task) {
      task.start();
      console.log(`✓ Started scheduled job: ${jobName}`);
      return true;
    }
    console.log(`✗ Scheduled job not found: ${jobName}`);
    return false;
  }

  // Stop specific job
  stop(jobName) {
    const task = this.jobs.get(jobName);
    if (task) {
      task.stop();
      console.log(`✓ Stopped scheduled job: ${jobName}`);
      return true;
    }
    console.log(`✗ Scheduled job not found: ${jobName}`);
    return false;
  }

  // Get status of all scheduled jobs
  getStatus() {
    const status = {};
    this.jobs.forEach((task, name) => {
      status[name] = {
        running: task.running,
        scheduled: true,
      };
    });
    return status;
  }

  // Manual trigger of any scheduled job
  async trigger(jobName) {
    switch (jobName) {
      case "daily_scraping":
      case "weekend_update":
        return await this.triggerFullUpdate();
      case "market_hours_charts":
        return await this.triggerChartUpdate();
      case "job_cleanup":
        return await this.triggerCleanup();
      default:
        console.log(`Unknown job: ${jobName}`);
        return false;
    }
  }

  async triggerFullUpdate() {
    console.log("Manually triggering full update...");
    try {
      const jobId = await jobService.startScrapingJob();
      console.log(`Manual scraping job started: ${jobId}`);

      jobService.once("jobCompleted", async (data) => {
        if (data.type === "scraping") {
          try {
            const chartJobId = await jobService.startChartDownloadJob();
            console.log(`Manual chart download job started: ${chartJobId}`);
          } catch (error) {
            console.error("Failed to start manual chart download:", error);
          }
        }
      });

      return jobId;
    } catch (error) {
      console.error("Failed to trigger full update:", error);
      return false;
    }
  }

  async triggerChartUpdate() {
    console.log("Manually triggering chart update...");
    try {
      const jobId = await jobService.startChartDownloadJob();
      console.log(`Manual chart update job started: ${jobId}`);
      return jobId;
    } catch (error) {
      console.error("Failed to trigger chart update:", error);
      return false;
    }
  }

  async triggerCleanup() {
    console.log("Manually triggering job cleanup...");
    try {
      const cleanedCount = await jobService.cleanupOldJobs(24 * 60 * 60 * 1000);
      console.log(`Cleaned up ${cleanedCount} old jobs`);
      return cleanedCount;
    } catch (error) {
      console.error("Failed during cleanup:", error);
      return 0;
    }
  }
}

// Singleton instance
const schedulerService = new SchedulerService();

module.exports = schedulerService;
