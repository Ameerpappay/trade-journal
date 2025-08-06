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
  Tag as AntTag,
  Divider,
  Modal,
  Tooltip,
  Skeleton,
  Badge,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TagsOutlined,
  SearchOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { Tag } from "../../types";
import { apiService } from "../../services/apiService";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface TagFormData {
  name: string;
  description?: string;
}

const ManageTags: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [filteredTags, setFilteredTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [form] = Form.useForm<TagFormData>();

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    const filtered = tags.filter(
      (tag) =>
        tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tag.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTags(filtered);
  }, [tags, searchTerm]);

  const loadTags = async () => {
    try {
      const data = await apiService.getTags();
      setTags(data);
    } catch (error) {
      console.error("Error fetching tags:", error);
      message.error("Failed to load tags");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (values: TagFormData) => {
    setLoading(true);
    try {
      if (editingTag) {
        await apiService.updateTag(editingTag.id, values);
        message.success("Tag updated successfully!");
      } else {
        await apiService.createTag(values);
        message.success("Tag created successfully!");
      }

      form.resetFields();
      setIsModalVisible(false);
      setEditingTag(null);
      await loadTags();
    } catch (error) {
      console.error("Error saving tag:", error);
      message.error("Failed to save tag");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    form.setFieldsValue({
      name: tag.name,
      description: tag.description || "",
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (tag: Tag) => {
    try {
      await apiService.deleteTag(tag.id);
      message.success("Tag deleted successfully!");
      await loadTags();
    } catch (error) {
      console.error("Error deleting tag:", error);
      message.error("Failed to delete tag");
    }
  };

  const handleAdd = () => {
    setEditingTag(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingTag(null);
    form.resetFields();
  };

  const columns: ColumnsType<Tag> = [
    {
      title: "Tag",
      dataIndex: "name",
      key: "name",
      render: (text: string) => (
        <Space>
          <AntTag icon={<TagsOutlined />} color="blue">
            {text}
          </AntTag>
        </Space>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text: string) => (
        <Text type="secondary">{text || <em>No description</em>}</Text>
      ),
      ellipsis: { showTitle: false },
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) =>
        date ? new Date(date).toLocaleDateString() : "N/A",
      sorter: (a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      },
      width: 120,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit tag">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete tag"
            description={`Are you sure you want to delete "${record.name}"?`}
            onConfirm={() => handleDelete(record)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete tag">
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
          <TagsOutlined style={{ color: "#1890ff" }} />
          Manage Tags
        </Title>
        <Text type="secondary">
          Organize your trades with custom tags for better categorization
        </Text>
      </div>

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
              Tags ({filteredTags.length})
            </Title>
          </Space>

          <Space>
            <Input
              placeholder="Search tags..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Add Tag
            </Button>
          </Space>
        </div>

        <Divider style={{ margin: "16px 0" }} />

        {/* Table */}
        <Table
          columns={columns}
          dataSource={filteredTags}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} tags`,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  searchTerm
                    ? "No tags match your search"
                    : "No tags yet. Add your first tag!"
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
            {editingTag ? <EditOutlined /> : <PlusOutlined />}
            {editingTag ? "Edit Tag" : "Add New Tag"}
          </Space>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            label="Tag Name"
            name="name"
            rules={[
              { required: true, message: "Please enter tag name!" },
              { max: 50, message: "Tag name must be less than 50 characters!" },
            ]}
          >
            <Input
              placeholder="e.g., Scalping, Swing Trade, Day Trade"
              prefix={<TagsOutlined />}
            />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[
              {
                max: 500,
                message: "Description must be less than 500 characters!",
              },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Optional description of this tag..."
              showCount
              maxLength={500}
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
                icon={editingTag ? <SaveOutlined /> : <PlusOutlined />}
              >
                {editingTag ? "Update Tag" : "Add Tag"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ManageTags;
