import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Space,
  message,
  Popconfirm,
  Tag,
  Card,
  Row,
  Col,
  Statistic,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { portfolioService } from "../../services";
import type { Portfolio, PortfolioFormData } from "../../types";

const PortfolioManagement: React.FC = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(
    null
  );
  const [form] = Form.useForm();

  useEffect(() => {
    loadPortfolios();
  }, []);

  const loadPortfolios = async () => {
    try {
      setLoading(true);
      const data = await portfolioService.getPortfolios();
      setPortfolios(data);
    } catch (error: any) {
      message.error(error.message || "Failed to load portfolios");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingPortfolio(null);
    setIsModalVisible(true);
    form.resetFields();
    form.setFieldsValue({ isActive: true }); // Default to active
  };

  const handleEdit = (portfolio: Portfolio) => {
    setEditingPortfolio(portfolio);
    setIsModalVisible(true);
    form.setFieldsValue({
      name: portfolio.name,
      rValue: portfolio.rValue,
      capital: portfolio.capital,
      isActive: portfolio.isActive,
    });
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingPortfolio(null);
    form.resetFields();
  };

  const handleSubmit = async (values: PortfolioFormData) => {
    try {
      if (editingPortfolio) {
        await portfolioService.updatePortfolio(editingPortfolio.id, values);
        message.success("Portfolio updated successfully");
      } else {
        await portfolioService.createPortfolio(values);
        message.success("Portfolio created successfully");
      }
      setIsModalVisible(false);
      setEditingPortfolio(null);
      form.resetFields();
      loadPortfolios();
    } catch (error: any) {
      message.error(error.message || "Failed to save portfolio");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await portfolioService.deletePortfolio(id);
      message.success("Portfolio deleted successfully");
      loadPortfolios();
    } catch (error: any) {
      message.error(error.message || "Failed to delete portfolio");
    }
  };

  const calculateTotalStats = () => {
    const activePortfolios = portfolios.filter((p) => p.isActive);
    const totalCapital = activePortfolios.reduce(
      (sum, p) => sum + p.capital,
      0
    );
    const avgRValue =
      activePortfolios.length > 0
        ? activePortfolios.reduce((sum, p) => sum + p.rValue, 0) /
          activePortfolios.length
        : 0;
    const totalTrades = activePortfolios.reduce(
      (sum, p) => sum + (p.stats?.totalTrades || 0),
      0
    );
    const totalHoldings = activePortfolios.reduce(
      (sum, p) => sum + (p.stats?.totalHoldings || 0),
      0
    );

    return {
      totalCapital,
      avgRValue,
      totalTrades,
      totalHoldings,
      activeCount: activePortfolios.length,
    };
  };

  const stats = calculateTotalStats();

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a: Portfolio, b: Portfolio) => a.name.localeCompare(b.name),
    },
    {
      title: "R Value (%)",
      dataIndex: "rValue",
      key: "rValue",
      render: (rValue: number) => `${rValue.toFixed(2)}%`,
      sorter: (a: Portfolio, b: Portfolio) => a.rValue - b.rValue,
    },
    {
      title: "Capital",
      dataIndex: "capital",
      key: "capital",
      render: (capital: number) => `₹${capital.toLocaleString()}`,
      sorter: (a: Portfolio, b: Portfolio) => a.capital - b.capital,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean, record: Portfolio) => (
        <div>
          <Tag color={isActive ? "green" : "red"}>
            {isActive ? "Active" : "Inactive"}
          </Tag>
          {isActive && (
            <div
              style={{ fontSize: "11px", color: "#52c41a", marginTop: "2px" }}
            >
              Current Portfolio
            </div>
          )}
        </div>
      ),
      filters: [
        { text: "Active", value: true },
        { text: "Inactive", value: false },
      ],
      onFilter: (value: any, record: Portfolio) => record.isActive === value,
    },
    {
      title: "Trades",
      key: "trades",
      render: (_: any, record: Portfolio) => record.stats?.totalTrades || 0,
      sorter: (a: Portfolio, b: Portfolio) =>
        (a.stats?.totalTrades || 0) - (b.stats?.totalTrades || 0),
    },
    {
      title: "Holdings",
      key: "holdings",
      render: (_: any, record: Portfolio) => record.stats?.totalHoldings || 0,
      sorter: (a: Portfolio, b: Portfolio) =>
        (a.stats?.totalHoldings || 0) - (b.stats?.totalHoldings || 0),
    },
    {
      title: "Capital Used",
      key: "capitalUsed",
      render: (_: any, record: Portfolio) => {
        const used = record.stats?.totalInvested || 0;
        const percentage =
          record.capital > 0 ? (used / record.capital) * 100 : 0;
        return (
          <div>
            <div>₹{used.toLocaleString()}</div>
            <div style={{ fontSize: "12px", color: "#666" }}>
              {percentage.toFixed(1)}%
            </div>
          </div>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Portfolio) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this portfolio?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ marginBottom: "24px" }}>
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Active Portfolios"
                value={stats.activeCount}
                valueStyle={{ color: "#3f8600" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Capital"
                value={stats.totalCapital}
                precision={0}
                prefix="₹"
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Average R Value"
                value={stats.avgRValue}
                precision={2}
                suffix="%"
                valueStyle={{ color: "#722ed1" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Trades"
                value={stats.totalTrades}
                valueStyle={{ color: "#fa541c" }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h2>Portfolio Management</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Add Portfolio
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={portfolios}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} portfolios`,
        }}
      />

      <Modal
        title={editingPortfolio ? "Edit Portfolio" : "Add New Portfolio"}
        open={isModalVisible}
        onCancel={handleModalCancel}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ isActive: true }}
        >
          <Form.Item
            name="name"
            label="Portfolio Name"
            rules={[
              { required: true, message: "Please enter portfolio name" },
              {
                min: 2,
                message: "Portfolio name must be at least 2 characters",
              },
              {
                max: 100,
                message: "Portfolio name cannot exceed 100 characters",
              },
            ]}
          >
            <Input placeholder="Enter portfolio name" />
          </Form.Item>

          <Form.Item
            name="rValue"
            label="R Value (%)"
            rules={[
              { required: true, message: "Please enter R value" },
              {
                type: "number",
                min: 0.1,
                max: 100,
                message: "R value must be between 0.1% and 100%",
              },
            ]}
            tooltip="Percentage risk you will take on each trade in this portfolio"
          >
            <InputNumber
              placeholder="Enter R value percentage"
              min={0.1}
              max={100}
              precision={2}
              style={{ width: "100%" }}
              addonAfter="%"
            />
          </Form.Item>

          <Form.Item
            name="capital"
            label="Capital"
            rules={[
              { required: true, message: "Please enter capital amount" },
              {
                type: "number",
                min: 1,
                message: "Capital must be greater than 0",
              },
            ]}
          >
            <InputNumber
              placeholder="Enter capital amount"
              min={1}
              precision={2}
              style={{ width: "100%" }}
              addonBefore="₹"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Active Status"
            valuePropName="checked"
            tooltip="Only one portfolio can be active at a time. The active portfolio will be used for all new trades and holdings."
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button onClick={handleModalCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {editingPortfolio ? "Update" : "Create"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PortfolioManagement;
