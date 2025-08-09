import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Table,
  Space,
  Typography,
  Row,
  Col,
  Badge,
  Tag,
  message,
  Divider,
  Timeline,
  Alert,
  Dropdown,
  MenuProps,
  Statistic,
  Popconfirm,
} from "antd";
import {
  PlayCircleOutlined,
  StopOutlined,
  DownloadOutlined,
  SyncOutlined,
  SettingOutlined,
  EyeOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  LineChartOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  RobotOutlined,
  ControlOutlined,
  GlobalOutlined,
  FieldTimeOutlined,
} from "@ant-design/icons";
import { screenerService } from "../../services/screenerService";

const { Title, Text } = Typography;
const { Option } = Select;

interface Screener {
  id: number;
  scanName: string;
  description?: string;
  sourceName: string;
  sourceUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Job {
  id: string;
  type: string;
  status: "running" | "completed" | "failed" | "cancelled";
  startTime: string;
  endTime?: string;
  duration: number;
  stocksFound: number;
  resultsSaved: number;
  chartsDownloaded: number;
  chartsSaved: number;
  error?: string;
  progress?: Array<{ timestamp: string; message: string }>;
}

interface JobStats {
  total: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
}

interface ScheduledJob {
  name: string;
  schedule: string;
  description: string;
  isActive: boolean;
  nextRun?: string;
  lastRun?: string;
}

const StockScrapingManagement: React.FC = () => {
  // State for jobs
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobStats, setJobStats] = useState<JobStats>({
    total: 0,
    running: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
  });
  const [currentJob, setCurrentJob] = useState<Job | null>(null);

  // State for screeners
  const [screeners, setScreeners] = useState<Screener[]>([]);
  const [screenerForm] = Form.useForm();

  // State for scheduled jobs
  const [scheduledJobs, setScheduledJobs] = useState<ScheduledJob[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [jobsModalVisible, setJobsModalVisible] = useState(false);
  const [screenerModalVisible, setScreenerModalVisible] = useState(false);
  const [jobProgressModalVisible, setJobProgressModalVisible] = useState(false);
  const [scheduledJobsModalVisible, setScheduledJobsModalVisible] =
    useState(false);

  // Real-time job tracking
  const [jobEventSource, setJobEventSource] = useState<EventSource | null>(
    null
  );

  useEffect(() => {
    loadInitialData();
    return () => {
      if (jobEventSource) {
        jobEventSource.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadJobs(),
        loadScreeners(),
        loadScheduledJobs(),
        loadJobStats(),
      ]);
    } catch (error) {
      console.error("Error loading initial data:", error);
      message.error("Failed to load data");
    }
  };

  // Job Management Functions
  const loadJobs = async () => {
    try {
      const response = await fetch("/api/jobs");
      const data = await response.json();
      if (data.success) {
        // Ensure all jobs have required properties with defaults
        const validatedJobs = (data.jobs || []).map((job: any) => ({
          id: job.id || "unknown",
          type: job.type || "unknown",
          status: job.status || "unknown",
          startTime: job.startTime || new Date().toISOString(),
          endTime: job.endTime,
          duration: job.duration || 0,
          stocksFound: job.stocksFound || 0,
          resultsSaved: job.resultsSaved || 0,
          chartsDownloaded: job.chartsDownloaded || 0,
          chartsSaved: job.chartsSaved || 0,
          error: job.error,
          progress: job.progress || [],
        }));
        setJobs(validatedJobs);
      } else {
        console.error("Failed to load jobs:", data.error);
        setJobs([]); // Set empty array if failed
      }
    } catch (error) {
      console.error("Error loading jobs:", error);
      setJobs([]); // Set empty array on error
    }
  };

  const loadJobStats = async () => {
    try {
      const response = await fetch("/api/jobs/stats");
      const data = await response.json();
      if (data.success) {
        setJobStats(data.stats);
      } else {
        console.error("Failed to load job stats:", data.error);
      }
    } catch (error) {
      console.error("Error loading job stats:", error);
    }
  };

  const startScrapingJob = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/jobs/start-scraping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();

      if (data.success) {
        message.success("Scraping job started successfully");
        setCurrentJob({
          id: data.jobId,
          type: "scraping",
          status: "running",
          startTime: new Date().toISOString(),
          duration: 0,
          stocksFound: 0,
          resultsSaved: 0,
          chartsDownloaded: 0,
          chartsSaved: 0,
          progress: [],
        } as Job);
        setJobProgressModalVisible(true);
        connectToJobStream(data.jobId);
        loadJobs();
      } else {
        message.error(`Failed to start scraping job: ${data.error}`);
      }
    } catch (error) {
      console.error("Error starting scraping job:", error);
      message.error("Failed to start scraping job");
    } finally {
      setLoading(false);
    }
  };

  const startChartDownloadJob = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/jobs/start-chart-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();

      if (data.success) {
        message.success("Chart download job started successfully");
        setCurrentJob({
          id: data.jobId,
          type: "chart_download",
          status: "running",
          startTime: new Date().toISOString(),
          duration: 0,
          stocksFound: 0,
          resultsSaved: 0,
          chartsDownloaded: 0,
          chartsSaved: 0,
          progress: [],
        } as Job);
        setJobProgressModalVisible(true);
        connectToJobStream(data.jobId);
        loadJobs();
      } else {
        message.error(`Failed to start chart download job: ${data.error}`);
      }
    } catch (error) {
      console.error("Error starting chart download job:", error);
      message.error("Failed to start chart download job");
    } finally {
      setLoading(false);
    }
  };

  const startFullUpdateJob = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/jobs/start-scraping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();

      if (data.success) {
        message.success("Full update job started (scraping + charts)");
        setCurrentJob({
          id: data.jobId,
          type: "scraping",
          status: "running",
          startTime: new Date().toISOString(),
          duration: 0,
          stocksFound: 0,
          resultsSaved: 0,
          chartsDownloaded: 0,
          chartsSaved: 0,
          progress: [],
        } as Job);
        setJobProgressModalVisible(true);
        connectToJobStream(data.jobId, true); // true for full update
        loadJobs();
      } else {
        message.error(`Failed to start full update job: ${data.error}`);
      }
    } catch (error) {
      console.error("Error starting full update job:", error);
      message.error("Failed to start full update job");
    } finally {
      setLoading(false);
    }
  };

  const connectToJobStream = (jobId: string, isFullUpdate = false) => {
    if (jobEventSource) {
      jobEventSource.close();
    }

    const eventSource = new EventSource(`/api/jobs/${jobId}/stream`);
    setJobEventSource(eventSource);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "initial":
          // Validate and set job data with defaults
          const validatedJob = {
            id: data.job?.id || jobId,
            type: data.job?.type || "unknown",
            status: data.job?.status || "running",
            startTime: data.job?.startTime || new Date().toISOString(),
            endTime: data.job?.endTime,
            duration: data.job?.duration || 0,
            stocksFound: data.job?.stocksFound || 0,
            resultsSaved: data.job?.resultsSaved || 0,
            chartsDownloaded: data.job?.chartsDownloaded || 0,
            chartsSaved: data.job?.chartsSaved || 0,
            error: data.job?.error,
            progress: data.job?.progress || [],
          };
          setCurrentJob(validatedJob);
          break;
        case "progress":
          setCurrentJob((prev) =>
            prev
              ? {
                  ...prev,
                  progress: [
                    ...(prev.progress || []),
                    { timestamp: data.timestamp, message: data.message },
                  ],
                }
              : null
          );
          break;
        case "completed":
          setCurrentJob((prev) =>
            prev
              ? {
                  ...prev,
                  status: "completed",
                  endTime: new Date().toISOString(),
                }
              : null
          );
          message.success("Job completed successfully!");

          // If this is a full update, start chart download
          if (isFullUpdate && data.jobType === "scraping") {
            setTimeout(() => {
              startChartDownloadAfterScraping();
            }, 1000);
          } else {
            eventSource.close();
            setJobEventSource(null);
            loadJobs();
            loadJobStats();
          }
          break;
        case "error":
          setCurrentJob((prev) =>
            prev ? { ...prev, status: "failed", error: data.error } : null
          );
          message.error(`Job failed: ${data.error}`);
          eventSource.close();
          setJobEventSource(null);
          loadJobs();
          loadJobStats();
          break;
      }
    };

    eventSource.onerror = (error) => {
      console.error("Job stream error:", error);
      eventSource.close();
      setJobEventSource(null);
    };
  };

  const startChartDownloadAfterScraping = async () => {
    try {
      const response = await fetch("/api/jobs/start-chart-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();

      if (data.success) {
        setCurrentJob({ id: data.jobId } as Job);
        connectToJobStream(data.jobId);
      }
    } catch (error) {
      console.error("Error starting chart download after scraping:", error);
    }
  };

  const cancelJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      const data = await response.json();

      if (data.success) {
        message.success("Job cancelled successfully");
        loadJobs();
        loadJobStats();
      } else {
        message.error(`Failed to cancel job: ${data.error}`);
      }
    } catch (error) {
      console.error("Error cancelling job:", error);
      message.error("Failed to cancel job");
    }
  };

  // Screener Management Functions
  const loadScreeners = async () => {
    try {
      const response = await screenerService.getScreeners();
      // Ensure all screeners have required properties with defaults
      const validatedScreeners = (response.screeners || []).map(
        (screener: any) => ({
          id: screener.id || 0,
          scanName: screener.scanName || "Unknown",
          description: screener.description || "",
          sourceName: screener.sourceName || "unknown",
          sourceUrl: screener.sourceUrl || "",
          isActive: screener.isActive !== undefined ? screener.isActive : true,
          createdAt: screener.createdAt || new Date().toISOString(),
          updatedAt: screener.updatedAt || new Date().toISOString(),
        })
      );
      setScreeners(validatedScreeners);
    } catch (error) {
      console.error("Error loading screeners:", error);
      setScreeners([]); // Set empty array on network error
    }
  };

  const addScreener = async (values: any) => {
    try {
      setLoading(true);
      await screenerService.createScreener(values);
      message.success("Screener added successfully");
      screenerForm.resetFields();
      loadScreeners();
    } catch (error: any) {
      console.error("Error adding screener:", error);
      message.error(
        `Failed to add screener: ${error.message || "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteScreener = async (id: number) => {
    try {
      console.log("Attempting to delete screener with ID:", id);
      const response = await screenerService.deleteScreener(id);
      console.log("Delete response:", response);
      message.success(response.message || "Screener deleted successfully");
      loadScreeners();
    } catch (error: any) {
      console.error("Error deleting screener:", error);
      message.error(
        `Failed to delete screener: ${error.message || "Unknown error"}`
      );
    }
  };

  // Scheduled Jobs Functions
  const loadScheduledJobs = async () => {
    try {
      const response = await fetch("/api/scheduled-jobs");
      const data = await response.json();
      if (data.success) {
        setScheduledJobs(data.jobs || []);
      } else {
        console.error("Failed to load scheduled jobs:", data.error);
        setScheduledJobs([]); // Set empty array if API call fails
      }
    } catch (error) {
      console.error("Error loading scheduled jobs:", error);
      setScheduledJobs([]); // Set empty array on network error
    }
  };

  const toggleScheduledJobs = async (start: boolean) => {
    try {
      const endpoint = start
        ? "/api/scheduled-jobs/start-all"
        : "/api/scheduled-jobs/stop-all";
      const response = await fetch(endpoint, { method: "POST" });
      const data = await response.json();

      if (data.success) {
        message.success(
          `Scheduled jobs ${start ? "started" : "stopped"} successfully`
        );
        loadScheduledJobs();
      } else {
        message.error(
          `Failed to ${start ? "start" : "stop"} scheduled jobs: ${data.error}`
        );
      }
    } catch (error) {
      console.error("Error toggling scheduled jobs:", error);
      message.error("Failed to toggle scheduled jobs");
    }
  };

  // Job Action Menu
  const getJobActionMenu = (job: Job): MenuProps["items"] => [
    {
      key: "view",
      label: "View Details",
      icon: <EyeOutlined />,
      onClick: () => {
        setCurrentJob(job);
        setJobProgressModalVisible(true);
      },
    },
    ...(job.status === "running"
      ? [
          {
            key: "cancel",
            label: "Cancel Job",
            icon: <StopOutlined />,
            danger: true,
            onClick: () => cancelJob(job.id),
          },
        ]
      : []),
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "processing";
      case "completed":
        return "success";
      case "failed":
        return "error";
      case "cancelled":
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <FieldTimeOutlined />;
      case "completed":
        return <CheckCircleOutlined />;
      case "failed":
        return <ExclamationCircleOutlined />;
      case "cancelled":
        return <StopOutlined />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const jobColumns = [
    {
      title: "Job ID",
      dataIndex: "id",
      key: "id",
      render: (id: string) => (
        <Text code style={{ fontSize: "12px" }}>
          {id.length > 20 ? `${id.substring(0, 20)}...` : id}
        </Text>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => (
        <Tag color={type === "scraping" ? "blue" : "green"}>
          {type === "scraping"
            ? "SCRAPING"
            : type === "chart_download"
            ? "CHARTS"
            : (type || "UNKNOWN").toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Badge
          status={getStatusColor(status)}
          text={status ? status.toUpperCase() : "UNKNOWN"}
        />
      ),
    },
    {
      title: "Duration",
      dataIndex: "duration",
      key: "duration",
      render: (duration: number) => formatDuration(duration),
    },
    {
      title: "Results",
      key: "results",
      render: (record: Job) => (
        <Space direction="vertical" size="small">
          {record.stocksFound > 0 && (
            <Text style={{ fontSize: "12px" }}>
              📈 {record.stocksFound} stocks found
            </Text>
          )}
          {record.chartsDownloaded > 0 && (
            <Text style={{ fontSize: "12px" }}>
              📊 {record.chartsDownloaded} charts
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (record: Job) => (
        <Dropdown
          menu={{ items: getJobActionMenu(record) }}
          trigger={["click"]}
        >
          <Button type="text" icon={<SettingOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const screenerColumns = [
    {
      title: "Name",
      dataIndex: "scanName",
      key: "scanName",
    },
    {
      title: "Source",
      dataIndex: "sourceName",
      key: "sourceName",
      render: (source: string) => (
        <Tag color={source === "chartink" ? "blue" : "green"}>
          {source ? source.toUpperCase() : "UNKNOWN"}
        </Tag>
      ),
    },
    {
      title: "URL",
      dataIndex: "sourceUrl",
      key: "sourceUrl",
      render: (url: string) =>
        url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: "12px" }}
          >
            {url.length > 30 ? `${url.substring(0, 30)}...` : url}
          </a>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (desc: string) => desc || "-",
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <Badge
          status={isActive ? "success" : "error"}
          text={isActive ? "Active" : "Inactive"}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (record: Screener) => (
        <Popconfirm
          title="Delete screener"
          description={`Are you sure you want to delete "${record.scanName}"?`}
          onConfirm={() => {
            console.log("Popconfirm onConfirm triggered for ID:", record.id);
            deleteScreener(record.id);
          }}
          okText="Yes, Delete"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            title="Delete screener"
            onClick={() => {
              console.log("Delete button clicked for ID:", record.id);
            }}
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title
          level={2}
          style={{ margin: 0, display: "flex", alignItems: "center", gap: 12 }}
        >
          <RobotOutlined style={{ color: "#1890ff" }} />
          Stock Scraping & Jobs Management
        </Title>
        <Text type="secondary">
          Automate stock data collection from Chartink and Screener.in with
          background job processing
        </Text>
      </div>

      {/* Quick Actions */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="Total Jobs"
              value={jobStats.total}
              prefix={<ControlOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Running"
              value={jobStats.running}
              valueStyle={{ color: "#1890ff" }}
              prefix={<FieldTimeOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Completed"
              value={jobStats.completed}
              valueStyle={{ color: "#52c41a" }}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Failed"
              value={jobStats.failed}
              valueStyle={{ color: "#ff4d4f" }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Col>
        </Row>
      </Card>

      {/* Action Buttons */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <PlayCircleOutlined />
                Quick Actions
              </Space>
            }
          >
            <Space wrap>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={startScrapingJob}
                loading={loading}
              >
                Start Scraping Only
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={startChartDownloadJob}
                loading={loading}
              >
                Download Charts Only
              </Button>
              <Button
                icon={<SyncOutlined />}
                onClick={startFullUpdateJob}
                loading={loading}
              >
                Full Update (Scraping + Charts)
              </Button>
              <Divider type="vertical" />
              <Button
                icon={<EyeOutlined />}
                onClick={() => {
                  loadJobs();
                  setJobsModalVisible(true);
                }}
              >
                View All Jobs
              </Button>
              <Button
                icon={<PlusOutlined />}
                onClick={() => {
                  loadScreeners();
                  setScreenerModalVisible(true);
                }}
              >
                Manage Screeners
              </Button>
              <Button
                icon={<ClockCircleOutlined />}
                onClick={() => {
                  loadScheduledJobs();
                  setScheduledJobsModalVisible(true);
                }}
              >
                Scheduled Jobs
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Recent Jobs */}
      <Card
        title={
          <Space>
            <LineChartOutlined />
            Recent Jobs
          </Space>
        }
      >
        <Table
          columns={jobColumns}
          dataSource={jobs.slice(0, 10)}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>

      {/* Jobs Modal */}
      <Modal
        title={
          <Space>
            <ControlOutlined />
            All Background Jobs
          </Space>
        }
        open={jobsModalVisible}
        onCancel={() => setJobsModalVisible(false)}
        width={1000}
        footer={[
          <Button key="close" onClick={() => setJobsModalVisible(false)}>
            Close
          </Button>,
        ]}
      >
        <Table
          columns={jobColumns}
          dataSource={jobs}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Modal>

      {/* Job Progress Modal */}
      <Modal
        title={
          <Space>
            <FieldTimeOutlined />
            Job Progress
            {currentJob && (
              <Text code style={{ fontSize: "12px" }}>
                {currentJob.id}
              </Text>
            )}
          </Space>
        }
        open={jobProgressModalVisible}
        onCancel={() => {
          setJobProgressModalVisible(false);
          if (jobEventSource) {
            jobEventSource.close();
            setJobEventSource(null);
          }
        }}
        width={800}
        footer={[
          currentJob?.status === "running" && (
            <Button
              key="cancel"
              danger
              icon={<StopOutlined />}
              onClick={() => currentJob && cancelJob(currentJob.id)}
            >
              Cancel Job
            </Button>
          ),
          <Button key="close" onClick={() => setJobProgressModalVisible(false)}>
            Close
          </Button>,
        ]}
      >
        {currentJob && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Statistic
                  title="Status"
                  value={
                    currentJob.status
                      ? currentJob.status.toUpperCase()
                      : "UNKNOWN"
                  }
                  prefix={getStatusIcon(currentJob.status)}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Type"
                  value={
                    currentJob.type ? currentJob.type.toUpperCase() : "UNKNOWN"
                  }
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Duration"
                  value={formatDuration(currentJob.duration || 0)}
                />
              </Col>
            </Row>

            {currentJob.progress && currentJob.progress.length > 0 && (
              <div>
                <Title level={5}>Progress Log</Title>
                <div style={{ maxHeight: 300, overflowY: "auto" }}>
                  <Timeline
                    items={currentJob.progress.map((p) => ({
                      children: (
                        <div>
                          <Text style={{ fontSize: "12px", color: "#999" }}>
                            {new Date(p.timestamp).toLocaleTimeString()}
                          </Text>
                          <div>{p.message}</div>
                        </div>
                      ),
                    }))}
                  />
                </div>
              </div>
            )}

            {currentJob.error && (
              <Alert
                message="Error"
                description={currentJob.error}
                type="error"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}
          </div>
        )}
      </Modal>

      {/* Screener Management Modal */}
      <Modal
        title={
          <Space>
            <GlobalOutlined />
            Manage Screeners
          </Space>
        }
        open={screenerModalVisible}
        onCancel={() => setScreenerModalVisible(false)}
        width={1000}
        footer={[
          <Button key="close" onClick={() => setScreenerModalVisible(false)}>
            Close
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 24 }}>
          <Title level={4}>Add New Screener</Title>
          <Form form={screenerForm} layout="vertical" onFinish={addScreener}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Scan Name"
                  name="scanName"
                  rules={[
                    { required: true, message: "Please enter scan name" },
                  ]}
                >
                  <Input placeholder="e.g., high-momentum" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Source"
                  name="sourceName"
                  rules={[{ required: true, message: "Please select source" }]}
                >
                  <Select placeholder="Select source">
                    <Option value="chartink">Chartink</Option>
                    <Option value="screenerin">Screener.in</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="Description" name="description">
              <Input placeholder="Brief description" />
            </Form.Item>
            <Form.Item
              label="Source URL"
              name="sourceUrl"
              rules={[
                { required: true, message: "Please enter source URL" },
                { type: "url", message: "Please enter a valid URL" },
              ]}
            >
              <Input placeholder="https://www.screener.in/screens/..." />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<PlusOutlined />}
              >
                Add Screener
              </Button>
            </Form.Item>
          </Form>
        </div>

        <Divider />

        <div>
          <Title level={4}>Existing Screeners</Title>
          <Table
            columns={screenerColumns}
            dataSource={screeners}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            size="small"
          />
        </div>
      </Modal>

      {/* Scheduled Jobs Modal */}
      <Modal
        title={
          <Space>
            <ClockCircleOutlined />
            Scheduled Jobs
          </Space>
        }
        open={scheduledJobsModalVisible}
        onCancel={() => setScheduledJobsModalVisible(false)}
        width={800}
        footer={[
          <Button
            key="start"
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => toggleScheduledJobs(true)}
          >
            Start All
          </Button>,
          <Button
            key="stop"
            danger
            icon={<StopOutlined />}
            onClick={() => toggleScheduledJobs(false)}
          >
            Stop All
          </Button>,
          <Button
            key="close"
            onClick={() => setScheduledJobsModalVisible(false)}
          >
            Close
          </Button>,
        ]}
      >
        <Alert
          message="Scheduled Jobs Information"
          description="These jobs run automatically based on their schedule. You can start/stop all scheduled jobs using the buttons below."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <div>
          {scheduledJobs.map((job, index) => (
            <Card key={index} size="small" style={{ marginBottom: 8 }}>
              <Row align="middle">
                <Col span={8}>
                  <Title level={5} style={{ margin: 0 }}>
                    {job.name}
                  </Title>
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    {job.description}
                  </Text>
                </Col>
                <Col span={6}>
                  <Text strong>Schedule:</Text>
                  <br />
                  <Text code style={{ fontSize: "12px" }}>
                    {job.schedule}
                  </Text>
                </Col>
                <Col span={5}>
                  <Text strong>Next Run:</Text>
                  <br />
                  <Text style={{ fontSize: "12px" }}>
                    {job.nextRun || "N/A"}
                  </Text>
                </Col>
                <Col span={5}>
                  <Badge
                    status={job.isActive ? "success" : "error"}
                    text={job.isActive ? "Active" : "Inactive"}
                  />
                </Col>
              </Row>
            </Card>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default StockScrapingManagement;
