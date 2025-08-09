import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Table,
  Space,
  Typography,
  message,
  Popconfirm,
  Empty,
  Tag,
  Divider,
  Modal,
  Tooltip,
  Skeleton,
  Badge,
  Avatar,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LineChartOutlined,
  SearchOutlined,
  SaveOutlined,
  CloseOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { Strategy } from "../../types";
import type { ColumnsType } from "antd/es/table";
import { strategyService } from "../../services";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface StrategyFormData {
  name: string;
  description?: string;
}

const ManageStrategies: React.FC = () => {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [filteredStrategies, setFilteredStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [form] = Form.useForm<StrategyFormData>();

  useEffect(() => {
    loadStrategies();
  }, []);

  useEffect(() => {
    const filtered = strategies.filter(
      (strategy) =>
        strategy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        strategy.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStrategies(filtered);
  }, [strategies, searchTerm]);

  const loadStrategies = async () => {
    try {
      const data = await strategyService.getStrategies();
      setStrategies(data);
    } catch (error) {
      console.error("Error fetching strategies:", error);
      message.error("Failed to load strategies");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (values: StrategyFormData) => {
    setLoading(true);
    try {
      if (editingStrategy) {
        await strategyService.updateStrategy(editingStrategy.id, values);
        message.success("Strategy updated successfully!");
      } else {
        await strategyService.createStrategy(values);
        message.success("Strategy created successfully!");
      }

      form.resetFields();
      setIsModalVisible(false);
      setEditingStrategy(null);
      await loadStrategies();
    } catch (error) {
      console.error("Error saving strategy:", error);
      message.error("Failed to save strategy");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (strategy: Strategy) => {
    setEditingStrategy(strategy);
    form.setFieldsValue({
      name: strategy.name,
      description: strategy.description || "",
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (strategy: Strategy) => {
    try {
      await strategyService.deleteStrategy(strategy.id);
      message.success("Strategy deleted successfully!");
      await loadStrategies();
    } catch (error) {
      console.error("Error deleting strategy:", error);
      message.error("Failed to delete strategy");
    }
  };

  const handleAdd = () => {
    setEditingStrategy(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingStrategy(null);
    form.resetFields();
  };

  // Generate random colors for strategy avatars
  const getStrategyColor = (name: string) => {
    const colors = [
      "#f56a00",
      "#7265e6",
      "#ffbf00",
      "#00a2ae",
      "#ff7875",
      "#87d068",
    ];
    return colors[name.length % colors.length];
  };

  const columns: ColumnsType<Strategy> = [
    {
      title: "Strategy",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: Strategy) => (
        <Space>
          <Avatar
            style={{ backgroundColor: getStrategyColor(text) }}
            icon={<LineChartOutlined />}
            size="small"
          />
          <div>
            <Text strong>{text}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: "12px" }}>
              ID: {record.id}
            </Text>
          </div>
        </Space>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
      width: 200,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text: string) => (
        <div style={{ maxWidth: 400 }}>
          {text ? (
            <Paragraph
              ellipsis={{ rows: 2, expandable: true, symbol: "more" }}
              style={{ marginBottom: 0 }}
            >
              {text}
            </Paragraph>
          ) : (
            <Text type="secondary" italic>
              No description provided
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => (
        <div>
          <Text>{date ? new Date(date).toLocaleDateString() : "N/A"}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {date ? new Date(date).toLocaleTimeString() : ""}
          </Text>
        </div>
      ),
      sorter: (a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      },
      width: 150,
    },
    {
      title: "Status",
      key: "status",
      render: () => (
        <Tag color="green" icon={<TrophyOutlined />}>
          Active
        </Tag>
      ),
      width: 100,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit strategy">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete strategy"
            description={`Are you sure you want to delete "${record.name}"?`}
            onConfirm={() => handleDelete(record)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete strategy">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
      width: 100,
    },
  ];

  if (initialLoading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title
          level={2}
          style={{ margin: 0, display: "flex", alignItems: "center", gap: 12 }}
        >
          <LineChartOutlined style={{ color: "#1890ff" }} />
          Manage Trading Strategies
        </Title>
        <Text type="secondary">
          Define and organize your trading strategies for consistent execution
        </Text>
      </div>

      {/* Main Content */}
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Space>
            <Title level={4} style={{ margin: 0 }}>
              Trading Strategies ({filteredStrategies.length})
            </Title>
            {filteredStrategies.length > 0 && (
              <Badge
                count={filteredStrategies.length}
                showZero
                color="#52c41a"
              />
            )}
          </Space>

          <Space>
            <Input
              placeholder="Search strategies..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              size="middle"
            >
              Add Strategy
            </Button>
          </Space>
        </div>

        <Divider style={{ margin: "16px 0" }} />

        {/* Table */}
        <Table
          columns={columns}
          dataSource={filteredStrategies}
          rowKey="id"
          pagination={{
            pageSize: 8,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} strategies`,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  searchTerm
                    ? "No strategies match your search"
                    : "No strategies yet. Create your first trading strategy!"
                }
              />
            ),
          }}
          size="small"
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={
          <Space>
            {editingStrategy ? <EditOutlined /> : <PlusOutlined />}
            {editingStrategy ? "Edit Strategy" : "Add New Strategy"}
          </Space>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            label="Strategy Name"
            name="name"
            rules={[
              { required: true, message: "Please enter strategy name!" },
              {
                max: 100,
                message: "Strategy name must be less than 100 characters!",
              },
            ]}
          >
            <Input
              placeholder="e.g., Moving Average Crossover, RSI Divergence, Breakout Strategy"
              prefix={<LineChartOutlined />}
            />
          </Form.Item>

          <Form.Item
            label="Strategy Description"
            name="description"
            rules={[
              {
                max: 1000,
                message: "Description must be less than 1000 characters!",
              },
            ]}
          >
            <TextArea
              rows={6}
              placeholder="Describe your trading strategy in detail. Include entry/exit rules, risk management, timeframes, indicators used, etc."
              showCount
              maxLength={1000}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button onClick={handleCancel} icon={<CloseOutlined />}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={editingStrategy ? <SaveOutlined /> : <PlusOutlined />}
              >
                {editingStrategy ? "Update Strategy" : "Create Strategy"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ManageStrategies;
