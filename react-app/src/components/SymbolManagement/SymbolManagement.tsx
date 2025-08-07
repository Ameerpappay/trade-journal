import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Popconfirm,
  message,
  Upload,
  Typography,
  Divider,
  Row,
  Col,
  Tag,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Symbol, SymbolFormData } from "../../types";
import { apiService } from "../../services/apiService";

const { Title, Text } = Typography;
const { Search } = Input;

interface SymbolManagementProps {}

const SymbolManagement: React.FC<SymbolManagementProps> = () => {
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSymbol, setEditingSymbol] = useState<Symbol | null>(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);

  // Forms
  const [form] = Form.useForm();
  const [uploadForm] = Form.useForm();

  useEffect(() => {
    loadSymbols();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize, searchTerm]);

  const loadSymbols = async () => {
    setLoading(true);
    try {
      const response = await apiService.getSymbols(
        pagination.current,
        pagination.pageSize,
        searchTerm || undefined
      );
      setSymbols(response.symbols);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination.totalItems,
      }));
    } catch (error) {
      message.error("Failed to load symbols");
      console.error("Error loading symbols:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleTableChange = (paginationConfig: any) => {
    setPagination({
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
      total: paginationConfig.total,
    });
  };

  const showModal = (symbol?: Symbol) => {
    setEditingSymbol(symbol || null);
    setIsModalVisible(true);
    if (symbol) {
      form.setFieldsValue(symbol);
    } else {
      form.resetFields();
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingSymbol(null);
    form.resetFields();
  };

  const handleSubmit = async (values: SymbolFormData) => {
    try {
      if (editingSymbol) {
        await apiService.updateSymbol(editingSymbol.id, values);
        message.success("Symbol updated successfully");
      } else {
        await apiService.createSymbol(values);
        message.success("Symbol created successfully");
      }
      setIsModalVisible(false);
      setEditingSymbol(null);
      form.resetFields();
      loadSymbols();
    } catch (error: any) {
      message.error(error.message || "Failed to save symbol");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiService.deleteSymbol(id);
      message.success("Symbol deleted successfully");
      loadSymbols();
    } catch (error: any) {
      message.error(error.message || "Failed to delete symbol");
    }
  };

  const handleUpload = async (values: { file: any }) => {
    try {
      const fileList = values.file;
      const file =
        fileList && fileList.length > 0 ? fileList[0].originFileObj : null;

      if (!file) {
        message.error("Please select a file");
        return;
      }

      const response = await apiService.uploadSymbols(file);
      const successMessage =
        response.created > 0
          ? `Upload completed! Created: ${response.created}, Total skipped: ${
              response.skipped
            } (Excel duplicates: ${
              response.excelDuplicatesSkipped || 0
            }, Database duplicates: ${response.databaseDuplicatesSkipped || 0})`
          : `Upload completed! No new symbols added - all ${response.skipped} were duplicates.`;

      message.success(successMessage);
      setUploadModalVisible(false);
      uploadForm.resetFields();
      loadSymbols();
    } catch (error: any) {
      message.error(error.message || "Failed to upload symbols");
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: true,
    },
    {
      title: "BSE Code",
      dataIndex: "bse",
      key: "bse",
      render: (bse: string) =>
        bse ? <Tag color="blue">{bse}</Tag> : <Text type="secondary">-</Text>,
    },
    {
      title: "NSE Code",
      dataIndex: "nse",
      key: "nse",
      render: (nse: string) =>
        nse ? <Tag color="green">{nse}</Tag> : <Text type="secondary">-</Text>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Symbol) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this symbol?"
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
    <div>
      <Card>
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: 16 }}
        >
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              Symbol Management
            </Title>
            <Text type="secondary">
              Manage stock symbols for BSE and NSE exchanges
            </Text>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => showModal()}
              >
                Add Symbol
              </Button>
              <Button
                icon={<UploadOutlined />}
                onClick={() => setUploadModalVisible(true)}
              >
                Upload Excel
              </Button>
            </Space>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Search
              placeholder="Search symbols by name, BSE or NSE code"
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={handleSearch}
              onChange={(e) => {
                if (!e.target.value) {
                  handleSearch("");
                }
              }}
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={symbols}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} symbols`,
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingSymbol ? "Edit Symbol" : "Add New Symbol"}
        open={isModalVisible}
        onCancel={handleModalCancel}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          validateMessages={{
            required: "This field is required!",
          }}
        >
          <Form.Item
            name="name"
            label="Company Name"
            rules={[{ required: true }]}
          >
            <Input placeholder="Enter company name" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="bse"
                label="BSE Code"
                rules={[
                  {
                    validator: (_, value) => {
                      const nseValue = form.getFieldValue("nse");
                      if (!value && !nseValue) {
                        return Promise.reject(
                          new Error(
                            "At least one of BSE or NSE code is required"
                          )
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input placeholder="BSE code" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="nse"
                label="NSE Code"
                rules={[
                  {
                    validator: (_, value) => {
                      const bseValue = form.getFieldValue("bse");
                      if (!value && !bseValue) {
                        return Promise.reject(
                          new Error(
                            "At least one of BSE or NSE code is required"
                          )
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input placeholder="NSE code" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingSymbol ? "Update" : "Create"} Symbol
              </Button>
              <Button onClick={handleModalCancel}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Upload Modal */}
      <Modal
        title="Upload Symbols from Excel"
        open={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false);
          uploadForm.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <div style={{ marginBottom: 16 }}>
          <Title level={4}>Excel File Format</Title>
          <Text>Your Excel file should contain the following columns:</Text>
          <ul>
            <li>
              <strong>Name</strong>: Company name (required)
            </li>
            <li>
              <strong>BSE</strong>: BSE stock code (optional)
            </li>
            <li>
              <strong>NSE</strong>: NSE stock code (optional)
            </li>
          </ul>
          <Text type="warning">
            Note: At least one of BSE or NSE code must be provided for each
            symbol. Duplicates will be automatically skipped.
          </Text>
        </div>

        <Divider />

        <Form form={uploadForm} onFinish={handleUpload} layout="vertical">
          <Form.Item
            name="file"
            label="Select Excel File"
            rules={[{ required: true, message: "Please select an Excel file" }]}
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) {
                return e;
              }
              return e && e.fileList;
            }}
          >
            <Upload
              beforeUpload={() => false}
              accept=".xlsx,.xls"
              maxCount={1}
              listType="text"
            >
              <Button icon={<UploadOutlined />}>Click to Upload</Button>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Upload Symbols
              </Button>
              <Button
                onClick={() => {
                  setUploadModalVisible(false);
                  uploadForm.resetFields();
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SymbolManagement;
