import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Badge,
  Button,
  Space,
  Typography,
  Progress,
  Statistic,
  Row,
  Col,
  Tag,
  Tooltip,
  message,
  Popconfirm,
} from "antd";
import {
  ReloadOutlined,
  StopOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { jobService, Job, JobStats } from "../../services/jobService";
import moment from "moment";

const { Title, Text } = Typography;

const JobManagement: React.FC = () => {
  const [runningJobs, setRunningJobs] = useState<Job[]>([]);
  const [jobHistory, setJobHistory] = useState<Job[]>([]);
  const [jobStats, setJobStats] = useState<JobStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchJobData();
    // Refresh every 10 seconds for running jobs
    const interval = setInterval(fetchJobData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchJobData = async () => {
    try {
      setLoading(true);
      const [running, history, stats] = await Promise.all([
        jobService.getRunningJobs(),
        jobService.getJobHistory(50),
        jobService.getJobStats(),
      ]);

      setRunningJobs(running);
      setJobHistory(history);
      setJobStats(stats);
    } catch (error) {
      console.error("Error fetching job data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      await jobService.cancelJob(jobId);
      message.success("Job cancelled successfully");
      fetchJobData();
    } catch (error: any) {
      message.error(error.message || "Failed to cancel job");
    }
  };

  const getJobStatusBadge = (status: string) => {
    const statusConfig = {
      running: {
        status: "processing" as const,
        text: "Running",
        icon: <ClockCircleOutlined />,
      },
      completed: {
        status: "success" as const,
        text: "Completed",
        icon: <CheckCircleOutlined />,
      },
      failed: {
        status: "error" as const,
        text: "Failed",
        icon: <CloseCircleOutlined />,
      },
      cancelled: {
        status: "default" as const,
        text: "Cancelled",
        icon: <StopOutlined />,
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.failed;

    return (
      <Badge
        status={config.status}
        text={
          <Space>
            {config.icon}
            {config.text}
          </Space>
        }
      />
    );
  };

  const getJobTypeTag = (type: string) => {
    const typeConfig = {
      screener: { color: "blue", text: "Screener" },
      charts: { color: "green", text: "Charts" },
    };

    const config = typeConfig[type as keyof typeof typeConfig] || {
      color: "default",
      text: type,
    };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getDuration = (startTime: string, endTime?: string) => {
    const start = moment(startTime);
    const end = endTime ? moment(endTime) : moment();
    const duration = moment.duration(end.diff(start));

    if (duration.asMinutes() < 1) {
      return `${Math.floor(duration.asSeconds())}s`;
    } else if (duration.asHours() < 1) {
      return `${Math.floor(duration.asMinutes())}m ${Math.floor(
        duration.asSeconds() % 60
      )}s`;
    } else {
      return `${Math.floor(duration.asHours())}h ${Math.floor(
        duration.asMinutes() % 60
      )}m`;
    }
  };

  const runningJobsColumns = [
    {
      title: "Job ID",
      dataIndex: "id",
      key: "id",
      width: 200,
      render: (id: string) => (
        <Text code style={{ fontSize: "12px" }}>
          {id}
        </Text>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => getJobTypeTag(type),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => getJobStatusBadge(status),
    },
    {
      title: "Duration",
      key: "duration",
      render: (record: Job) => getDuration(record.startTime),
    },
    {
      title: "Progress",
      key: "progress",
      render: (record: Job) => {
        if (record.type === "screener") {
          return (
            <div>
              <Progress percent={50} size="small" status="active" />
              <Text type="secondary">Scraping...</Text>
            </div>
          );
        } else if (record.type === "charts") {
          return (
            <div>
              <Progress percent={75} size="small" status="active" />
              <Text type="secondary">Downloading charts...</Text>
            </div>
          );
        }
        return <Progress percent={0} size="small" />;
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (record: Job) => (
        <Popconfirm
          title="Are you sure you want to cancel this job?"
          onConfirm={() => handleCancelJob(record.id)}
          okText="Yes"
          cancelText="No"
        >
          <Button icon={<StopOutlined />} size="small" danger>
            Cancel
          </Button>
        </Popconfirm>
      ),
    },
  ];

  const historyColumns = [
    {
      title: "Job ID",
      dataIndex: "id",
      key: "id",
      width: 200,
      render: (id: string) => (
        <Text code style={{ fontSize: "12px" }}>
          {id}
        </Text>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => getJobTypeTag(type),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => getJobStatusBadge(status),
    },
    {
      title: "Started",
      dataIndex: "startTime",
      key: "startTime",
      render: (startTime: string) =>
        moment(startTime).format("MMM DD, HH:mm:ss"),
    },
    {
      title: "Duration",
      key: "duration",
      render: (record: Job) => getDuration(record.startTime, record.endTime),
    },
    {
      title: "Results",
      key: "results",
      render: (record: Job) => {
        if (record.status === "completed") {
          if (record.type === "screener") {
            return (
              <div>
                <div>Stocks: {record.stocksFound || 0}</div>
                <div>Saved: {record.resultsSaved || 0}</div>
              </div>
            );
          } else if (record.type === "charts") {
            return (
              <div>
                <div>Downloaded: {record.chartsDownloaded || 0}</div>
                <div>Saved: {record.chartsSaved || 0}</div>
              </div>
            );
          }
        } else if (record.status === "failed" && record.error) {
          return (
            <Tooltip title={record.error}>
              <Tag color="red">
                <ExclamationCircleOutlined /> Error
              </Tag>
            </Tooltip>
          );
        }
        return "-";
      },
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Title level={2}>Job Management</Title>
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchJobData}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      {/* Job Statistics */}
      {jobStats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Jobs"
                value={jobStats.total}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Running"
                value={jobStats.running}
                valueStyle={{ color: "#1890ff" }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Completed"
                value={jobStats.completed}
                valueStyle={{ color: "#3f8600" }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Failed"
                value={jobStats.failed}
                valueStyle={{ color: "#cf1322" }}
                prefix={<CloseCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Running Jobs */}
      <Card
        title={
          <Space>
            <Title level={4} style={{ margin: 0 }}>
              Running Jobs
            </Title>
            <Badge count={runningJobs.length} />
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        {runningJobs.length > 0 ? (
          <Table
            columns={runningJobsColumns}
            dataSource={runningJobs}
            rowKey="id"
            pagination={false}
            size="small"
          />
        ) : (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Text type="secondary">No running jobs</Text>
          </div>
        )}
      </Card>

      {/* Job History */}
      <Card
        title={
          <Title level={4} style={{ margin: 0 }}>
            Job History
          </Title>
        }
      >
        <Table
          columns={historyColumns}
          dataSource={jobHistory}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} jobs`,
          }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default JobManagement;
