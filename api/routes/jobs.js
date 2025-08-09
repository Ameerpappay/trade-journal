const express = require("express");
const router = express.Router();
const jobService = require("../services/jobService");
const { authenticateToken } = require("../middleware/auth");

// Get all jobs
router.get("/", async (req, res) => {
  try {
    const jobs = jobService.getAllJobs();
    res.json({
      success: true,
      jobs,
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Start scraping job
router.post("/start-scraping", async (req, res) => {
  try {
    const jobId = await jobService.startScrapingJob();
    res.json({
      success: true,
      jobId,
      message: "Scraping job started successfully",
    });
  } catch (error) {
    console.error("Error starting scraping job:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to start scraping job",
    });
  }
});

// Start chart download job
router.post("/start-chart-download", async (req, res) => {
  try {
    const jobId = await jobService.startChartDownloadJob();
    res.json({
      success: true,
      jobId,
      message: "Chart download job started successfully",
    });
  } catch (error) {
    console.error("Error starting chart download job:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to start chart download job",
    });
  }
});

// Cancel job
router.delete("/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;
    const success = jobService.cancelJob(jobId);

    if (success) {
      res.json({
        success: true,
        message: "Job cancelled successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        error: "Job not found or already completed",
      });
    }
  } catch (error) {
    console.error("Error cancelling job:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Get all running jobs
router.get("/running", async (req, res) => {
  try {
    const runningJobs = jobService.getRunningJobs();
    res.json(runningJobs);
  } catch (error) {
    console.error("Error fetching running jobs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get job history
router.get("/history", async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const jobHistory = jobService.getJobHistory(parseInt(limit));
    res.json(jobHistory);
  } catch (error) {
    console.error("Error fetching job history:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get job statistics (must come before /:jobId route)
router.get("/stats", async (req, res) => {
  try {
    const stats = jobService.getJobStats();
    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error fetching job stats:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Get job statistics (must come before /:jobId route)
router.get("/stats/overview", async (req, res) => {
  try {
    const stats = jobService.getJobStats();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching job stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get job by ID
router.get("/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = jobService.getJobStatus(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: "Job not found",
      });
    }

    res.json({
      success: true,
      job,
    });
  } catch (error) {
    console.error("Error fetching job:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Server-Sent Events endpoint for real-time job progress
router.get("/:jobId/stream", async (req, res) => {
  const { jobId } = req.params;

  // Set headers for SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Cache-Control");

  // Send initial job status
  const job = jobService.getJobStatus(jobId);
  if (job) {
    res.write(
      `data: ${JSON.stringify({
        type: "initial",
        job: job,
      })}\n\n`
    );
  } else {
    res.write(
      `data: ${JSON.stringify({
        type: "error",
        error: "Job not found",
      })}\n\n`
    );
    res.end();
    return;
  }

  // Set up event listeners
  const progressHandler = (data) => {
    if (data.jobId === jobId) {
      res.write(
        `data: ${JSON.stringify({
          type: "progress",
          ...data,
        })}\n\n`
      );
    }
  };

  const completedHandler = (data) => {
    if (data.jobId === jobId) {
      res.write(
        `data: ${JSON.stringify({
          type: "completed",
          ...data,
        })}\n\n`
      );
      res.end();
    }
  };

  const errorHandler = (data) => {
    if (data.jobId === jobId) {
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          ...data,
        })}\n\n`
      );
      res.end();
    }
  };

  const cancelledHandler = (data) => {
    if (data.jobId === jobId) {
      res.write(
        `data: ${JSON.stringify({
          type: "cancelled",
          ...data,
        })}\n\n`
      );
      res.end();
    }
  };

  // Listen to job events
  jobService.on("jobProgress", progressHandler);
  jobService.on("jobCompleted", completedHandler);
  jobService.on("jobError", errorHandler);
  jobService.on("jobCancelled", cancelledHandler);

  // Clean up on client disconnect
  req.on("close", () => {
    jobService.removeListener("jobProgress", progressHandler);
    jobService.removeListener("jobCompleted", completedHandler);
    jobService.removeListener("jobError", errorHandler);
    jobService.removeListener("jobCancelled", cancelledHandler);
    res.end();
  });

  // Keep connection alive
  const keepAlive = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: "ping" })}\n\n`);
  }, 30000);

  req.on("close", () => {
    clearInterval(keepAlive);
  });
});

// Start screener job
router.post("/screener/:screenerId", async (req, res) => {
  try {
    const { screenerId } = req.params;

    // Check if screener job is already running
    const runningJobs = jobService.getRunningJobs();
    const existingJob = runningJobs.find(
      (job) =>
        job.type === "screener" &&
        job.screenerId == screenerId &&
        job.status === "running"
    );

    if (existingJob) {
      return res.status(409).json({
        error: "Screener job is already running",
        jobId: existingJob.id,
      });
    }

    // Start the job asynchronously
    jobService
      .executeScreenerJob(parseInt(screenerId), req.user.id)
      .catch((error) => {
        console.error("Screener job execution error:", error);
      });

    // Get the job info to return
    const jobs = jobService.getRunningJobs();
    const newJob = jobs.find(
      (job) =>
        job.type === "screener" &&
        job.screenerId == screenerId &&
        job.userId === req.user.id
    );

    res.status(202).json({
      message: "Screener job started",
      job: newJob,
    });
  } catch (error) {
    console.error("Error starting screener job:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start chart download job
router.post("/charts/:stockId", authenticateToken, async (req, res) => {
  try {
    const { stockId } = req.params;
    const { timeFrames = ["daily", "weekly"] } = req.body;

    // Check if chart job is already running for this stock
    const runningJobs = jobService.getRunningJobs();
    const existingJob = runningJobs.find(
      (job) =>
        job.type === "charts" &&
        job.stockId == stockId &&
        job.status === "running"
    );

    if (existingJob) {
      return res.status(409).json({
        error: "Chart download job is already running for this stock",
        jobId: existingJob.id,
      });
    }

    // Start the job asynchronously
    jobService
      .executeChartDownloadJob(parseInt(stockId), req.user.id, timeFrames)
      .catch((error) => {
        console.error("Chart download job execution error:", error);
      });

    // Get the job info to return
    const jobs = jobService.getRunningJobs();
    const newJob = jobs.find(
      (job) =>
        job.type === "charts" &&
        job.stockId == stockId &&
        job.userId === req.user.id
    );

    res.status(202).json({
      message: "Chart download job started",
      job: newJob,
    });
  } catch (error) {
    console.error("Error starting chart download job:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Clean up old job history (admin only)
router.post("/cleanup", authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { maxAgeInDays = 7 } = req.body;
    const maxAge = maxAgeInDays * 24 * 60 * 60 * 1000;

    jobService.cleanupJobHistory(maxAge);

    res.json({ message: "Job history cleaned up successfully" });
  } catch (error) {
    console.error("Error cleaning up job history:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
