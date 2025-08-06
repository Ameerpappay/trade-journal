import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  InputNumber,
  Button,
  Select,
  DatePicker,
  Upload,
  Space,
  Typography,
  Row,
  Col,
  message,
  Divider,
  Tag,
} from "antd";
import {
  PlusOutlined,
  InboxOutlined,
  DollarOutlined,
  CalendarOutlined,
  LineChartOutlined,
  TagsOutlined,
  FileTextOutlined,
  SaveOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { Strategy, Tag as TagType, TradeFormData } from "../../types";
import { apiService } from "../../services/apiService";
import dayjs from "dayjs";
import type { UploadProps, UploadFile } from "antd";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Dragger } = Upload;

interface TradeForm {
  symbol: string;
  date: dayjs.Dayjs;
  entryPrice: number;
  stoploss?: number;
  notes?: string;
  strategyId: number;
  tagIds: number[];
}

const AddTrade: React.FC = () => {
  const [form] = Form.useForm<TradeForm>();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  useEffect(() => {
    loadStrategiesAndTags();
  }, []);

  const loadStrategiesAndTags = async () => {
    try {
      const [strategiesData, tagsData] = await Promise.all([
        apiService.getStrategies(),
        apiService.getTags(),
      ]);
      setStrategies(strategiesData);
      setTags(tagsData);
    } catch (error) {
      console.error("Error loading strategies and tags:", error);
      message.error("Failed to load strategies and tags");
    }
  };

  const handleSubmit = async (values: TradeForm) => {
    setLoading(true);
    try {
      // Create images array - for now, we'll associate all images with the first selected tag
      const selectedTagId = values.tagIds?.[0] || tags[0]?.id;

      const tradeData: TradeFormData = {
        symbol: values.symbol.toUpperCase(),
        date: values.date.format("YYYY-MM-DD"),
        entryPrice: values.entryPrice,
        stoploss: values.stoploss,
        notes: values.notes,
        strategyId: values.strategyId,
        images: fileList.map((file, index) => ({
          filePath: file.name || `image_${index}`,
          tagId: selectedTagId || 1,
        })),
      };

      console.log("Submitting trade data:", tradeData);
      const result = await apiService.createTrade(tradeData);
      console.log("Trade created successfully:", result);

      message.success("Trade added successfully! 🎉");
      form.resetFields();
      setFileList([]);
    } catch (error) {
      console.error("Error creating trade:", error);
      message.error(
        `Failed to add trade: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const uploadProps: UploadProps = {
    name: "file",
    multiple: true,
    fileList,
    beforeUpload: () => false, // Prevent auto upload
    onChange: (info) => {
      setFileList(info.fileList);
    },
    onDrop: (e) => {
      console.log("Dropped files", e.dataTransfer.files);
    },
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title
          level={2}
          style={{ margin: 0, display: "flex", alignItems: "center", gap: 12 }}
        >
          <TrophyOutlined style={{ color: "#52c41a" }} />
          Add New Trade
        </Title>
        <Text type="secondary">
          Record your trading activity with detailed information and analysis
        </Text>
      </div>

      {/* Main Form */}
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          initialValues={{
            date: dayjs(),
          }}
        >
          <Row gutter={16}>
            {/* Basic Trade Information */}
            <Col span={24}>
              <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}>
                <FileTextOutlined
                  style={{ marginRight: 8, color: "#1890ff" }}
                />
                Trade Details
              </Title>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Symbol"
                name="symbol"
                rules={[
                  { required: true, message: "Please enter the symbol!" },
                  {
                    min: 1,
                    max: 10,
                    message: "Symbol must be 1-10 characters!",
                  },
                ]}
              >
                <Input
                  placeholder="e.g., AAPL, TSLA, BTC"
                  prefix={<DollarOutlined />}
                  style={{ textTransform: "uppercase" }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Trade Date"
                name="date"
                rules={[{ required: true, message: "Please select the date!" }]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="YYYY-MM-DD"
                  prefix={<CalendarOutlined />}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Entry Price"
                name="entryPrice"
                rules={[
                  { required: true, message: "Please enter the entry price!" },
                  {
                    type: "number",
                    min: 0,
                    message: "Price must be positive!",
                  },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="0.00"
                  step="0.01"
                  precision={2}
                  prefix="$"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Stop Loss"
                name="stoploss"
                rules={[
                  {
                    type: "number",
                    min: 0,
                    message: "Stop loss must be positive!",
                  },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="0.00"
                  step="0.01"
                  precision={2}
                  prefix="$"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Strategy"
                name="strategyId"
                rules={[
                  { required: true, message: "Please select a strategy!" },
                ]}
              >
                <Select
                  placeholder="Select trading strategy"
                  suffixIcon={<LineChartOutlined />}
                >
                  {strategies.map((strategy) => (
                    <Option key={strategy.id} value={strategy.id}>
                      {strategy.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Tags"
                name="tagIds"
                rules={[{ required: false }]}
              >
                <Select
                  mode="multiple"
                  placeholder="Select tags (optional)"
                  suffixIcon={<TagsOutlined />}
                  maxTagCount={3}
                >
                  {tags.map((tag) => (
                    <Option key={tag.id} value={tag.id}>
                      <Tag color="blue" style={{ margin: 0 }}>
                        {tag.name}
                      </Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* Notes Section */}
            <Col span={24}>
              <Divider style={{ margin: "24px 0 16px 0" }} />
              <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}>
                <FileTextOutlined
                  style={{ marginRight: 8, color: "#1890ff" }}
                />
                Additional Information
              </Title>
            </Col>

            <Col span={24}>
              <Form.Item
                label="Trade Notes"
                name="notes"
                rules={[
                  {
                    max: 1000,
                    message: "Notes must be less than 1000 characters!",
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="Add notes about your trade setup, rationale, market conditions, etc."
                  showCount
                  maxLength={1000}
                />
              </Form.Item>
            </Col>

            {/* Images Section */}
            <Col span={24}>
              <Form.Item
                label="Trade Screenshots/Charts"
                help="Upload screenshots of your trade setup, charts, or related images"
              >
                <Dragger {...uploadProps} style={{ padding: 20 }}>
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined style={{ fontSize: 48, color: "#1890ff" }} />
                  </p>
                  <p className="ant-upload-text">
                    Click or drag files to this area to upload
                  </p>
                  <p className="ant-upload-hint">
                    Support for single or bulk upload of images (PNG, JPG, GIF)
                  </p>
                </Dragger>
              </Form.Item>
            </Col>
          </Row>

          {/* Action Buttons */}
          <Divider />
          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space size="middle">
              <Button
                onClick={() => {
                  form.resetFields();
                  setFileList([]);
                }}
              >
                Clear Form
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SaveOutlined />}
                size="large"
              >
                Save Trade
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AddTrade;
