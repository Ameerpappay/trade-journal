import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Button,
  Space,
  Typography,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Tag,
  DatePicker,
  Drawer,
  List,
  Badge,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  screenerService,
  Screener,
  StockScreenerResult,
} from "../../services/screenerService";
import { jobService } from "../../services/jobService";
import moment from "moment";

const { Title, Text } = Typography;
const { TextArea } = Input;

const ScreenerManagement: React.FC = () => {
  const [screeners, setScreeners] = useState<Screener[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [resultsDrawer, setResultsDrawer] = useState(false);
  const [editingScreener, setEditingScreener] = useState<Screener | null>(null);
  const [selectedScreener, setSelectedScreener] = useState<Screener | null>(
    null
  );
  const [screenerResults, setScreenerResults] = useState<StockScreenerResult[]>(
    []
  );
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchScreeners();
  }, []);

  const fetchScreeners = async () => {
    try {
      setLoading(true);
      const response = await screenerService.getScreeners();
      setScreeners(response.screeners);
    } catch (error) {
      message.error("Failed to fetch screeners");
      console.error("Error fetching screeners:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateScreener = () => {
    setEditingScreener(null);
    setModalVisible(true);
    form.resetFields();
  };

  const handleEditScreener = (screener: Screener) => {
    setEditingScreener(screener);
    setModalVisible(true);
    form.setFieldsValue({
      scanName: screener.scanName,
      description: screener.description,
      sourceName: screener.sourceName,
      sourceUrl: screener.sourceUrl,
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingScreener) {
        await screenerService.updateScreener(editingScreener.id, values);
        message.success("Screener updated successfully");
      } else {
        await screenerService.createScreener(values);
        message.success("Screener created successfully");
      }
      setModalVisible(false);
      fetchScreeners();
    } catch (error: any) {
      message.error(error.message || "Failed to save screener");
    }
  };

  const handleDeleteScreener = async (id: number) => {
    try {
      await screenerService.deleteScreener(id);
      message.success("Screener deleted successfully");
      fetchScreeners();
    } catch (error: any) {
      message.error(error.message || "Failed to delete screener");
    }
  };

  const handleRunScreener = async (screenerId: number) => {
    try {
      const response = await jobService.startScreenerJob(screenerId);
      message.success(`Screener job started: ${response.job?.id}`);
    } catch (error: any) {
      if (error.message.includes("already running")) {
        message.warning("Screener job is already running");
      } else {
        message.error("Failed to start screener job");
      }
    }
  };

  const handleViewResults = async (screener: Screener) => {
    try {
      setSelectedScreener(screener);

      // Get available dates
      const dates = await screenerService.getScreenerDates(screener.id);
      setAvailableDates(dates);

      // Get latest results
      const response = await screenerService.getScreenerById(screener.id);
      setScreenerResults(
        Array.isArray(response.results) ? response.results : []
      );
      setSelectedDate("");
      setResultsDrawer(true);
    } catch (error) {
      message.error("Failed to fetch screener results");
    }
  };

  const handleDateChange = async (date: string) => {
    if (!selectedScreener) return;

    try {
      setSelectedDate(date);
      const response = await screenerService.getScreenerById(
        selectedScreener.id,
        date
      );
      setScreenerResults(
        Array.isArray(response.results) ? response.results : []
      );
    } catch (error) {
      message.error("Failed to fetch results for selected date");
    }
  };

  const columns = [
    {
      title: "Scan Name",
      dataIndex: "scanName",
      key: "scanName",
      render: (text: string, record: Screener) => (
        <div>
          <div style={{ fontWeight: "bold" }}>{text}</div>
          {record.description && (
            <div style={{ fontSize: "12px", color: "#666" }}>
              {record.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Source",
      dataIndex: "sourceName",
      key: "sourceName",
      render: (sourceName: string, record: Screener) => (
        <div>
          <Tag color="blue">{sourceName}</Tag>
          {record.sourceUrl && (
            <div style={{ fontSize: "12px", marginTop: 4 }}>
              <a
                href={record.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Source
              </a>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Owner",
      key: "owner",
      render: (record: Screener) =>
        record.user ? (
          <div>
            <div>{record.user.name}</div>
            <div style={{ fontSize: "12px", color: "#666" }}>
              {record.user.email}
            </div>
          </div>
        ) : (
          <Tag color="green">Public</Tag>
        ),
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
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => moment(date).format("MMM DD, YYYY"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (record: Screener) => (
        <Space>
          <Button
            icon={<PlayCircleOutlined />}
            size="small"
            type="primary"
            onClick={() => handleRunScreener(record.id)}
          >
            Run
          </Button>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleViewResults(record)}
          >
            Results
          </Button>
          {record.user && (
            <>
              <Button
                icon={<EditOutlined />}
                size="small"
                onClick={() => handleEditScreener(record)}
              />
              <Popconfirm
                title="Are you sure you want to delete this screener?"
                onConfirm={() => handleDeleteScreener(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button icon={<DeleteOutlined />} size="small" danger />
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  const resultColumns = [
    {
      title: "Stock Name",
      key: "stockName",
      render: (record: StockScreenerResult) => (
        <div>
          <div style={{ fontWeight: "bold" }}>{record.stock?.stockName}</div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            {record.stock?.nseCode && <Tag>NSE: {record.stock.nseCode}</Tag>}
            {record.stock?.bseCode && <Tag>BSE: {record.stock.bseCode}</Tag>}
          </div>
        </div>
      ),
    },
    {
      title: "Industry",
      key: "industry",
      render: (record: StockScreenerResult) =>
        record.stock?.industry ? (
          <Tag color="blue">{record.stock.industry}</Tag>
        ) : (
          "-"
        ),
    },
    {
      title: "Current Price",
      key: "currentPrice",
      render: (record: StockScreenerResult) =>
        record.stock?.currentPrice
          ? `₹${record.stock.currentPrice.toFixed(2)}`
          : "-",
    },
    {
      title: "Day Change",
      key: "dayChange",
      render: (record: StockScreenerResult) => {
        if (!record.stock?.dayChange && !record.stock?.dayChangePercent)
          return "-";

        const color =
          (record.stock?.dayChange || 0) >= 0 ? "#52c41a" : "#ff4d4f";

        return (
          <div style={{ color }}>
            <div>₹{Math.abs(record.stock?.dayChange || 0).toFixed(2)}</div>
            <div>({(record.stock?.dayChangePercent || 0).toFixed(2)}%)</div>
          </div>
        );
      },
    },
    {
      title: "Scan Date",
      dataIndex: "scanDate",
      key: "scanDate",
      render: (date: string) => moment(date).format("MMM DD, YYYY"),
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
        <Title level={2}>Screener Management</Title>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchScreeners}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateScreener}
          >
            Add Screener
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={screeners}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} screeners`,
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingScreener ? "Edit Screener" : "Create Screener"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="scanName"
            label="Scan Name"
            rules={[{ required: true, message: "Please enter scan name" }]}
          >
            <Input placeholder="Enter scan name" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Enter description (optional)" />
          </Form.Item>

          <Form.Item
            name="sourceName"
            label="Source Name"
            rules={[{ required: true, message: "Please enter source name" }]}
          >
            <Input placeholder="e.g., ChartInk, Screener.in" />
          </Form.Item>

          <Form.Item
            name="sourceUrl"
            label="Source URL"
            rules={[{ type: "url", message: "Please enter a valid URL" }]}
          >
            <Input placeholder="https://chartink.com/screener/..." />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {editingScreener ? "Update" : "Create"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Results Drawer */}
      <Drawer
        title={
          <div>
            <div>Screener Results: {selectedScreener?.scanName}</div>
            {availableDates.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">Select Date: </Text>
                <DatePicker
                  size="small"
                  value={selectedDate ? moment(selectedDate) : null}
                  onChange={(date) =>
                    handleDateChange(date?.format("YYYY-MM-DD") || "")
                  }
                  disabledDate={(current) => {
                    return !availableDates.includes(
                      current.format("YYYY-MM-DD")
                    );
                  }}
                />
              </div>
            )}
          </div>
        }
        width={800}
        open={resultsDrawer}
        onClose={() => setResultsDrawer(false)}
      >
        {screenerResults.length > 0 ? (
          <Table
            columns={resultColumns}
            dataSource={screenerResults}
            rowKey="id"
            pagination={{
              pageSize: 50,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} stocks`,
            }}
            size="small"
          />
        ) : (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Text>No results found for this screener</Text>
            {selectedScreener && (
              <div style={{ marginTop: 16 }}>
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={() => handleRunScreener(selectedScreener.id)}
                >
                  Run Screener
                </Button>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default ScreenerManagement;
