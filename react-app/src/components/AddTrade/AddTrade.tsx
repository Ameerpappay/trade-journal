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
  AutoComplete,
} from "antd";
import {
  InboxOutlined,
  DollarOutlined,
  CalendarOutlined,
  LineChartOutlined,
  TagsOutlined,
  FileTextOutlined,
  SaveOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import {
  Strategy,
  Tag as TagType,
  TradeFormData,
  TradeImageData,
  Symbol,
} from "../../types";
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
  quantity: number;
  stoploss?: number;
  notes?: string;
  type: "buy" | "sell";
  strategyId: number;
}

interface ImageWithTag extends UploadFile {
  tagId?: number;
}

const AddTrade: React.FC = () => {
  const [form] = Form.useForm<TradeForm>();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [loading, setLoading] = useState(false);
  const [symbolSearchLoading, setSymbolSearchLoading] = useState(false);
  const [fileList, setFileList] = useState<ImageWithTag[]>([]);
  const [symbolOptions, setSymbolOptions] = useState<{value: string, label: string}[]>([]);

  useEffect(() => {
    loadStrategiesAndTags();
  }, []);

  const loadStrategiesAndTags = async () => {
    try {
      const [strategiesData, tagsData, symbolsData] = await Promise.all([
        apiService.getStrategies(),
        apiService.getTags(),
        apiService.getSymbols(1, 50), // Load first 50 symbols for initial options
      ]);
      setStrategies(strategiesData);
      setTags(tagsData);
      setSymbols(symbolsData.symbols);
      
      // Prepare initial symbol options for autocomplete
      const options = symbolsData.symbols.map((symbol) => ({
        value: symbol.nse || symbol.bse || '',
        label: `${symbol.nse || symbol.bse || 'N/A'} - ${symbol.name || 'No name'}`,
      }));
      setSymbolOptions(options);
    } catch (error) {
      console.error("Error loading strategies and tags:", error);
      message.error("Failed to load strategies and tags");
    }
  };

  const handleSubmit = async (values: TradeForm) => {
    // Validate that all uploaded images have tags assigned
    const imagesWithoutTags = fileList.filter((file) => !file.tagId);
    if (imagesWithoutTags.length > 0) {
      message.warning(
        `Please assign tags to all uploaded images (${imagesWithoutTags.length} images missing tags)`
      );
      return;
    }

    setLoading(true);
    try {
      let uploadedImages: TradeImageData[] = [];

      // Upload files if there are any
      if (fileList.length > 0) {
        message.loading("Uploading images...", 0);

        // Convert UploadFile objects to File objects
        const filesToUpload = fileList
          .map((file) => file.originFileObj)
          .filter((file) => file instanceof File) as File[];

        if (filesToUpload.length > 0) {
          const uploadResult = await apiService.uploadFiles(filesToUpload);

          // Map uploaded files with their assigned tags
          uploadedImages = uploadResult.files.map((uploadedFile, index) => {
            const originalFile = fileList[index];
            return {
              filePath: uploadedFile.filename, // Use the server-generated filename
              tagId: originalFile.tagId!,
            };
          });
        }

        message.destroy(); // Clear the loading message
      }

      // Create images array with their individual tags
      const tradeData: TradeFormData = {
        symbol: values.symbol.toUpperCase(),
        date: values.date.format("YYYY-MM-DD"),
        entryPrice: values.entryPrice,
        quantity: values.quantity,
        stoploss: values.stoploss,
        notes: values.notes,
        type: values.type,
        strategyId: values.strategyId,
        images: uploadedImages,
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
      // Auto-assign first available tag to new images
      const updatedFileList = info.fileList.map((file) => {
        const existingFile = fileList.find((f) => f.uid === file.uid);
        if (existingFile) {
          return existingFile; // Keep existing tag assignment
        } else {
          // New file, auto-assign first tag if available
          return { ...file, tagId: tags[0]?.id } as ImageWithTag;
        }
      });
      setFileList(updatedFileList);
    },
    onDrop: (e) => {
      console.log("Dropped files", e.dataTransfer.files);
    },
  };

  const handleSymbolSearch = async (searchText: string) => {
    if (!searchText) {
      // Show all loaded symbols when no search text
      setSymbolOptions(symbols.map((symbol) => ({
        value: symbol.nse || symbol.bse || '',
        label: `${symbol.nse || symbol.bse || 'N/A'} - ${symbol.name || 'No name'}`,
      })));
      return;
    }
    
    setSymbolSearchLoading(true);
    try {
      // Call API to search for symbols
      const searchResults = await apiService.getSymbols(1, 20, searchText);
      
      const options = searchResults.symbols.map((symbol) => ({
        value: symbol.nse || symbol.bse || '',
        label: `${symbol.nse || symbol.bse || 'N/A'} - ${symbol.name || 'No name'}`,
      }));
      
      setSymbolOptions(options);
    } catch (error) {
      console.error("Error searching symbols:", error);
      // Fallback to local filtering if API fails
      const filtered = symbols.filter((symbol) =>
        (symbol.nse && symbol.nse.toLowerCase().includes(searchText.toLowerCase())) ||
        (symbol.bse && symbol.bse.toLowerCase().includes(searchText.toLowerCase())) ||
        (symbol.name && symbol.name.toLowerCase().includes(searchText.toLowerCase()))
      );
      
      const options = filtered.slice(0, 10).map((symbol) => ({
        value: symbol.nse || symbol.bse || '',
        label: `${symbol.nse || symbol.bse || 'N/A'} - ${symbol.name || 'No name'}`,
      }));
      
      setSymbolOptions(options);
    } finally {
      setSymbolSearchLoading(false);
    }
  };

  const handleImageTagChange = (fileUid: string, tagId: number) => {
    setFileList((prev) =>
      prev.map((file) => (file.uid === fileUid ? { ...file, tagId } : file))
    );
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
            type: "buy",
            quantity: 1,
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
                <AutoComplete
                  options={symbolOptions}
                  onSearch={handleSymbolSearch}
                  placeholder="Search symbols... e.g., RELIANCE, TCS, HDFCBANK"
                  style={{ width: "100%" }}
                  filterOption={false}
                  notFoundContent={symbolSearchLoading ? "Searching..." : "No symbols found"}
                  allowClear
                >
                  <Input 
                    prefix={<DollarOutlined />}
                    style={{ textTransform: "uppercase" }}
                  />
                </AutoComplete>
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
                label="Quantity"
                name="quantity"
                rules={[
                  { required: true, message: "Please enter the quantity!" },
                  {
                    type: "number",
                    min: 0.0001,
                    message: "Quantity must be positive!",
                  },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="1.0"
                  step="0.0001"
                  precision={4}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Trade Type"
                name="type"
                rules={[
                  { required: true, message: "Please select trade type!" },
                ]}
              >
                <Select placeholder="Select trade type">
                  <Option value="buy">Buy</Option>
                  <Option value="sell">Sell</Option>
                </Select>
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

                {/* Individual image tag assignment */}
                {fileList.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <Title level={5} style={{ marginBottom: 16 }}>
                      <TagsOutlined
                        style={{ marginRight: 8, color: "#1890ff" }}
                      />
                      Assign Tags to Images
                    </Title>
                    <Row gutter={[16, 16]}>
                      {fileList.map((file) => (
                        <Col key={file.uid} xs={24} sm={12} md={8} lg={6}>
                          <Card
                            size="small"
                            style={{
                              border: file.tagId
                                ? "1px solid #d9d9d9"
                                : "2px solid #ff7875",
                              backgroundColor: file.tagId ? "white" : "#fff2f0",
                            }}
                            cover={
                              file.type?.startsWith("image/") ? (
                                <div
                                  style={{
                                    height: 80,
                                    background: "#f5f5f5",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "24px",
                                    color: "#999",
                                  }}
                                >
                                  📸
                                </div>
                              ) : (
                                <div
                                  style={{
                                    height: 80,
                                    background: "#f5f5f5",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "24px",
                                    color: "#999",
                                  }}
                                >
                                  📄
                                </div>
                              )
                            }
                          >
                            <div style={{ padding: "8px 0" }}>
                              <Text
                                ellipsis
                                style={{
                                  fontSize: "12px",
                                  display: "block",
                                  marginBottom: 8,
                                }}
                              >
                                {file.name}
                              </Text>
                              {!file.tagId && (
                                <Text
                                  type="danger"
                                  style={{
                                    fontSize: "10px",
                                    display: "block",
                                    marginBottom: 4,
                                  }}
                                >
                                  Tag required!
                                </Text>
                              )}
                              <Select
                                placeholder="Select tag"
                                style={{ width: "100%" }}
                                size="small"
                                value={file.tagId}
                                onChange={(tagId) =>
                                  handleImageTagChange(file.uid!, tagId)
                                }
                                status={!file.tagId ? "error" : undefined}
                              >
                                {tags.map((tag) => (
                                  <Option key={tag.id} value={tag.id}>
                                    <Tag
                                      color="blue"
                                      style={{ margin: 0, fontSize: "11px" }}
                                    >
                                      {tag.name}
                                    </Tag>
                                  </Option>
                                ))}
                              </Select>
                            </div>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}
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
