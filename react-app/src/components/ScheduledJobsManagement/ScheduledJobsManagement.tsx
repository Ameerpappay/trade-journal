import React, { useState, useEffect } from "react";
import {
  Card,
  Switch,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Tag,
  message,
  Popconfirm,
  Descriptions,
} from "antd";
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ThunderboltOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import {
  schedulerService,
  ScheduledJobStatus,
} from "../../services/schedulerService";

const { Title, Text } = Typography;

const ScheduledJobsManagement: React.FC = () => {
  const [scheduledJobs, setScheduledJobs] = useState<ScheduledJobStatus>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchScheduledJobs();
  }, []);

  const fetchScheduledJobs = async () => {
    try {
      setLoading(true);
      const jobs = await schedulerService.getScheduledJobs();
      setScheduledJobs(jobs);
    } catch (error: any) {
      message.error(error.message || "Failed to fetch scheduled jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleJob = async (jobName: string, isRunning: boolean) => {
    try {
      if (isRunning) {
        await schedulerService.stopScheduledJob(jobName);
        message.success(`Stopped scheduled job: ${jobName}`);
      } else {
        await schedulerService.startScheduledJob(jobName);
        message.success(`Started scheduled job: ${jobName}`);
      }
      fetchScheduledJobs();
    } catch (error: any) {
      message.error(error.message || `Failed to toggle job: ${jobName}`);
    }
  };

  const handleTriggerJob = async (jobName: string) => {
    try {
      const result = await schedulerService.triggerScheduledJob(jobName);
      if (result.jobId) {
        message.success(`Triggered job: ${jobName} (Job ID: ${result.jobId})`);
      } else {
        message.success(`Triggered job: ${jobName}`);
      }
    } catch (error: any) {
      message.error(error.message || `Failed to trigger job: ${jobName}`);
    }
  };

  const handleStartAll = async () => {
    try {
      await schedulerService.startAllScheduledJobs();
      message.success("Started all scheduled jobs");
      fetchScheduledJobs();
    } catch (error: any) {
      message.error(error.message || "Failed to start all jobs");
    }
  };

  const handleStopAll = async () => {
    try {
      await schedulerService.stopAllScheduledJobs();
      message.success("Stopped all scheduled jobs");
      fetchScheduledJobs();
    } catch (error: any) {
      message.error(error.message || "Failed to stop all jobs");
    }
  };

  const getJobStatusTag = (job: any) => {
    if (job.running) {
      return (
        <Tag color="green" icon={<PlayCircleOutlined />}>
          Running
        </Tag>
      );
    } else {
      return (
        <Tag color="red" icon={<PauseCircleOutlined />}>
          Stopped
        </Tag>
      );
    }
  };

  const getJobDescription = (jobName: string) => {
    const descriptions: { [key: string]: string } = {
      daily_scraping:
        "Runs daily at 9 AM to scrape stock data from all active screeners",
      market_hours_charts:
        "Updates stock charts at 10 AM, 2 PM, and 6 PM on weekdays",
      job_cleanup: "Cleans up old job records daily at midnight",
      weekend_update:
        "Performs full scraping and chart update on Saturday at 8 AM",
    };
    return descriptions[jobName] || "No description available";
  };

  const getJobSchedule = (jobName: string) => {
    const schedules: { [key: string]: string } = {
      daily_scraping: "Daily at 9:00 AM (Asia/Kolkata)",
      market_hours_charts: "10 AM, 2 PM, 6 PM on weekdays (Asia/Kolkata)",
      job_cleanup: "Daily at 12:00 AM (Asia/Kolkata)",
      weekend_update: "Saturday at 8:00 AM (Asia/Kolkata)",
    };
    return schedules[jobName] || "Custom schedule";
  };

  const formatJobName = (jobName: string) => {
    return jobName
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

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
        <Title level={2}>
          <ClockCircleOutlined /> Scheduled Jobs Management
        </Title>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchScheduledJobs}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleStartAll}
          >
            Start All
          </Button>
          <Popconfirm
            title="Are you sure you want to stop all scheduled jobs?"
            onConfirm={handleStopAll}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<PauseCircleOutlined />}>
              Stop All
            </Button>
          </Popconfirm>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        {Object.entries(scheduledJobs).map(([jobName, job]) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={jobName}>
            <Card
              title={
                <Space>
                  {getJobStatusTag(job)}
                  <Text strong>{formatJobName(jobName)}</Text>
                </Space>
              }
              extra={
                <Switch
                  checked={job.running}
                  onChange={(checked) => handleToggleJob(jobName, !checked)}
                  checkedChildren="ON"
                  unCheckedChildren="OFF"
                />
              }
              actions={[
                <Popconfirm
                  key="trigger"
                  title={`Trigger ${formatJobName(jobName)} manually?`}
                  onConfirm={() => handleTriggerJob(jobName)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    type="link"
                    icon={<ThunderboltOutlined />}
                    size="small"
                  >
                    Trigger Now
                  </Button>
                </Popconfirm>,
              ]}
            >
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Schedule">
                  <Text type="secondary">{getJobSchedule(jobName)}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Description">
                  <Text>{getJobDescription(jobName)}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  {job.scheduled ? (
                    <Tag color="blue">Scheduled</Tag>
                  ) : (
                    <Tag color="default">Not Scheduled</Tag>
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        ))}
      </Row>

      {Object.keys(scheduledJobs).length === 0 && !loading && (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Text type="secondary">No scheduled jobs found</Text>
        </div>
      )}
    </div>
  );
};

export default ScheduledJobsManagement;
