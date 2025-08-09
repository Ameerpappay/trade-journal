const express = require("express");
const router = express.Router();
const schedulerService = require("../services/schedulerService");
const { authenticateToken } = require("../middleware/auth");

// Get status of all scheduled jobs
router.get("/", async (req, res) => {
  try {
    // Mock scheduled jobs data for now
    const mockScheduledJobs = [
      {
        name: "daily_scraping",
        schedule: "0 8 * * 1-5", // 8 AM on weekdays
        description: "Daily stock screening from all active screeners",
        isActive: true,
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      },
      {
        name: "market_hours_charts",
        schedule: "0 */2 9-15 * * 1-5", // Every 2 hours during market hours on weekdays
        description: "Download charts during market hours",
        isActive: true,
        nextRun: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // In 2 hours
        lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      },
      {
        name: "weekend_update",
        schedule: "0 10 * * 6", // 10 AM on Saturdays
        description: "Full update of all data on weekends",
        isActive: true,
        nextRun: "This Saturday at 10:00 AM",
        lastRun: "Last Saturday at 10:00 AM",
      },
      {
        name: "job_cleanup",
        schedule: "0 2 * * *", // 2 AM daily
        description: "Clean up old job history and logs",
        isActive: true,
        nextRun: "Tomorrow at 2:00 AM",
        lastRun: "Today at 2:00 AM",
      },
    ];

    res.json({
      success: true,
      jobs: mockScheduledJobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Start specific scheduled job
router.post("/:jobName/start", authenticateToken, (req, res) => {
  try {
    const { jobName } = req.params;
    const started = schedulerService.start(jobName);

    if (started) {
      res.json({
        success: true,
        message: `Scheduled job '${jobName}' started successfully`,
      });
    } else {
      res.status(404).json({
        success: false,
        error: `Scheduled job '${jobName}' not found`,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stop specific scheduled job
router.post("/:jobName/stop", authenticateToken, (req, res) => {
  try {
    const { jobName } = req.params;
    const stopped = schedulerService.stop(jobName);

    if (stopped) {
      res.json({
        success: true,
        message: `Scheduled job '${jobName}' stopped successfully`,
      });
    } else {
      res.status(404).json({
        success: false,
        error: `Scheduled job '${jobName}' not found`,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Trigger specific scheduled job manually
router.post("/:jobName/trigger", authenticateToken, async (req, res) => {
  try {
    const { jobName } = req.params;
    const result = await schedulerService.trigger(jobName);

    if (result) {
      res.json({
        success: true,
        message: `Scheduled job '${jobName}' triggered successfully`,
        jobId: typeof result === "string" ? result : undefined,
      });
    } else {
      res.status(400).json({
        success: false,
        error: `Failed to trigger scheduled job '${jobName}'`,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start all scheduled jobs
router.post("/start-all", authenticateToken, (req, res) => {
  try {
    schedulerService.startAll();
    res.json({
      success: true,
      message: "All scheduled jobs started successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stop all scheduled jobs
router.post("/stop-all", authenticateToken, (req, res) => {
  try {
    schedulerService.stopAll();
    res.json({
      success: true,
      message: "All scheduled jobs stopped successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
