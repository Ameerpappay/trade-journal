import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Image,
  Space,
  Divider,
  Spin,
  Empty,
  Button,
  Input,
  Select,
  DatePicker,
  Statistic,
  Badge,
  Tooltip,
  Avatar,
} from "antd";
import {
  DollarOutlined,
  CalendarOutlined,
  LineChartOutlined,
  TagsOutlined,
  CameraOutlined,
  TrophyOutlined,
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  RiseOutlined,
  FallOutlined,
  AppstoreOutlined,
  BorderOuterOutlined,
} from "@ant-design/icons";
import { Trade, Strategy, Tag as TagType } from "../../types";
import { apiService } from "../../services/apiService";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const ViewTrades: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStrategy, setSelectedStrategy] = useState<
    number | undefined
  >();
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null
  );
  const [imageDisplayMode, setImageDisplayMode] = useState<
    "grid" | "fullscreen"
  >("grid");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterTrades();
  }, [trades, searchTerm, selectedStrategy, selectedTags, dateRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tradesData, strategiesData, tagsData] = await Promise.all([
        apiService.getTrades(),
        apiService.getStrategies(),
        apiService.getTags(),
      ]);
      setTrades(tradesData);
      setStrategies(strategiesData);
      setTags(tagsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterTrades = () => {
    let filtered = [...trades];

    // Text search
    if (searchTerm) {
      filtered = filtered.filter(
        (trade) =>
          trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trade.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trade.Strategy?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Strategy filter
    if (selectedStrategy) {
      filtered = filtered.filter(
        (trade) => trade.strategyId === selectedStrategy
      );
    }

    // Tags filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter((trade) =>
        trade.Images?.some((image) => selectedTags.includes(image.tagId))
      );
    }

    // Date range filter
    if (dateRange) {
      filtered = filtered.filter((trade) => {
        const tradeDate = dayjs(trade.date);
        return tradeDate.isBetween(dateRange[0], dateRange[1], "day", "[]");
      });
    }

    setFilteredTrades(filtered);
  };

  const getStrategyColor = (strategyName: string) => {
    const colors = [
      "#f56a00",
      "#7265e6",
      "#ffbf00",
      "#00a2ae",
      "#ff7875",
      "#87d068",
    ];
    return colors[strategyName.length % colors.length];
  };

  const getTagColor = (tagName: string) => {
    const colors = ["blue", "green", "orange", "purple", "cyan", "magenta"];
    return colors[tagName.length % colors.length];
  };

  const calculateProfitLoss = (entryPrice: number, stoploss?: number) => {
    if (!stoploss) return null;
    const profitLoss = stoploss - entryPrice;
    return {
      value: profitLoss,
      percentage: (profitLoss / entryPrice) * 100,
      isProfit: profitLoss > 0,
    };
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStrategy(undefined);
    setSelectedTags([]);
    setDateRange(null);
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>Loading your trading history...</Text>
        </div>
      </div>
    );
  }

  const totalTrades = trades.length;
  const profitableTrades = trades.filter((trade) => {
    const pl = calculateProfitLoss(trade.entryPrice, trade.stoploss);
    return pl && pl.isProfit;
  }).length;
  const totalImages = trades.reduce(
    (sum, trade) => sum + (trade.Images?.length || 0),
    0
  );
  const avgEntryPrice =
    trades.length > 0
      ? trades.reduce((sum, trade) => sum + trade.entryPrice, 0) / trades.length
      : 0;

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title
          level={2}
          style={{ margin: 0, display: "flex", alignItems: "center", gap: 12 }}
        >
          <EyeOutlined style={{ color: "#1890ff" }} />
          Trading Dashboard
        </Title>
        <Text type="secondary">
          View and analyze your complete trading history with images and tags
        </Text>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}>
          <FilterOutlined style={{ marginRight: 8, color: "#1890ff" }} />
          Filters & Search
        </Title>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Search trades..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filter by strategy"
              style={{ width: "100%" }}
              value={selectedStrategy}
              onChange={setSelectedStrategy}
              allowClear
            >
              {strategies.map((strategy) => (
                <Option key={strategy.id} value={strategy.id}>
                  <Space>
                    <Avatar
                      size="small"
                      style={{
                        backgroundColor: getStrategyColor(strategy.name),
                      }}
                      icon={<LineChartOutlined />}
                    />
                    {strategy.name}
                  </Space>
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              mode="multiple"
              placeholder="Filter by tags"
              style={{ width: "100%" }}
              value={selectedTags}
              onChange={setSelectedTags}
              allowClear
              maxTagCount={2}
            >
              {tags.map((tag) => (
                <Option key={tag.id} value={tag.id}>
                  <Tag color={getTagColor(tag.name)} style={{ margin: 0 }}>
                    {tag.name}
                  </Tag>
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: "100%" }}
              value={dateRange}
              onChange={(dates) =>
                setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)
              }
              format="YYYY-MM-DD"
            />
          </Col>
        </Row>
        <div
          style={{
            marginTop: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Space>
            <Text type="secondary">
              Showing {filteredTrades.length} of {totalTrades} trades
            </Text>
            <Button size="small" onClick={clearFilters}>
              Clear Filters
            </Button>
          </Space>

          <Space>
            <Text type="secondary">Image Display:</Text>
            <Button.Group size="small">
              <Button
                type={imageDisplayMode === "grid" ? "primary" : "default"}
                icon={<AppstoreOutlined />}
                onClick={() => setImageDisplayMode("grid")}
              >
                Grid
              </Button>
              <Button
                type={imageDisplayMode === "fullscreen" ? "primary" : "default"}
                icon={<BorderOuterOutlined />}
                onClick={() => setImageDisplayMode("fullscreen")}
              >
                Full Screen
              </Button>
            </Button.Group>
          </Space>
        </div>
      </Card>

      {/* Trades Display */}
      {filteredTrades.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No trades match your current filters"
        />
      ) : (
        <Row gutter={[16, 16]}>
          {filteredTrades.map((trade) => {
            const profitLoss = calculateProfitLoss(
              trade.entryPrice,
              trade.stoploss
            );

            return (
              <Col key={trade.id} xs={24} lg={12} xl={8}>
                <Card
                  hoverable
                  style={{ height: "100%" }}
                  cover={
                    trade.Images && trade.Images.length > 0 ? (
                      imageDisplayMode === "fullscreen" ? (
                        // Full Screen Mode - Show each image separately
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                          }}
                        >
                          <Image.PreviewGroup>
                            {trade.Images.map((image, index) => (
                              <div
                                key={image.id}
                                style={{ position: "relative" }}
                              >
                                <Image
                                  src={`http://localhost:3001/uploads/${image.filePath}`}
                                  alt={`Trade ${trade.symbol} - Image ${
                                    index + 1
                                  }`}
                                  style={{
                                    width: "100%",
                                    height: "200px",
                                    objectFit: "cover",
                                    marginBottom:
                                      index < trade.Images!.length - 1
                                        ? "8px"
                                        : "0",
                                  }}
                                  fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RUG8A8OCIz8A4g4cODAgBvAgAMLDAYMLDCwwMDCAgMLCwsLDCwsLCwsLCwsLCwsLCwsLOQJICcmKIAgcOBABAYC04BqhKLn/6DX/3BVfbe75733VVU6qqru6Xm4K1xd+6lq7fPz83MAAEAAEQAEAAEAAEAAEQAEAAEAAEAAEQAEAAEAAEQAEAAEAAE..."
                                />
                                {image.Tag && (
                                  <Tag
                                    color={getTagColor(image.Tag.name)}
                                    style={{
                                      position: "absolute",
                                      top: 8,
                                      right: 8,
                                      fontSize: "11px",
                                      zIndex: 1,
                                    }}
                                  >
                                    {image.Tag.name}
                                  </Tag>
                                )}
                              </div>
                            ))}
                          </Image.PreviewGroup>
                        </div>
                      ) : (
                        // Grid Mode - Show images in grid layout
                        <div
                          style={{
                            position: "relative",
                            height: 200,
                            background: "#f5f5f5",
                          }}
                        >
                          <Image.PreviewGroup>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns:
                                  trade.Images.length === 1
                                    ? "1fr"
                                    : "repeat(2, 1fr)",
                                height: "100%",
                                gap: 2,
                              }}
                            >
                              {trade.Images.slice(0, 4).map((image, index) => (
                                <div
                                  key={image.id}
                                  style={{ position: "relative" }}
                                >
                                  <Image
                                    src={`http://localhost:3001/uploads/${image.filePath}`}
                                    alt={`Trade ${trade.symbol}`}
                                    style={{
                                      width: "100%",
                                      height:
                                        trade.Images!.length === 1
                                          ? "200px"
                                          : "98px",
                                      objectFit: "cover",
                                    }}
                                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RUG8A8OCIz8A4g4cODAgBvAgAMLDAYMLDCwwMDCAgMLCwsLDCwsLCwsLCwsLCwsLCwsLOQJICcmKIAgcOBABAYC04BqhKLn/6DX/3BVfbe75733VVU6qqru6Xm4K1xd+6lq7fPz83MAAEAAEQAEAAEAAEAAEQAEAAEAAEAAEQAEAAEAAEQAEAAEAAE..."
                                  />
                                  {image.Tag && (
                                    <Tag
                                      color={getTagColor(image.Tag.name)}
                                      style={{
                                        position: "absolute",
                                        top: 4,
                                        right: 4,
                                        fontSize: "10px",
                                      }}
                                    >
                                      {image.Tag.name}
                                    </Tag>
                                  )}
                                  {trade.Images!.length > 4 && index === 3 && (
                                    <div
                                      style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        backgroundColor: "rgba(0,0,0,0.6)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "white",
                                        fontSize: "16px",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      +{trade.Images!.length - 4} more
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </Image.PreviewGroup>
                          <Badge
                            count={trade.Images.length}
                            style={{ position: "absolute", top: 8, left: 8 }}
                            overflowCount={99}
                          />
                        </div>
                      )
                    ) : (
                      <div
                        style={{
                          height: 200,
                          background: "#f5f5f5",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "48px",
                          color: "#d9d9d9",
                        }}
                      >
                        <CameraOutlined />
                      </div>
                    )
                  }
                >
                  <div style={{ padding: "0 0 16px 0" }}>
                    {/* Trade Header */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <Title
                        level={4}
                        style={{
                          margin: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <DollarOutlined style={{ color: "#1890ff" }} />
                        {trade.symbol}
                      </Title>
                      {profitLoss && (
                        <Tooltip
                          title={`${
                            profitLoss.isProfit ? "Profit" : "Loss"
                          }: $${Math.abs(profitLoss.value).toFixed(2)}`}
                        >
                          <Tag color={profitLoss.isProfit ? "green" : "red"}>
                            {profitLoss.isProfit ? (
                              <RiseOutlined />
                            ) : (
                              <FallOutlined />
                            )}
                            {profitLoss.percentage.toFixed(1)}%
                          </Tag>
                        </Tooltip>
                      )}
                    </div>

                    {/* Trade Details */}
                    <Space direction="vertical" style={{ width: "100%" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Space>
                          <CalendarOutlined style={{ color: "#52c41a" }} />
                          <Text>
                            {dayjs(trade.date).format("MMM DD, YYYY")}
                          </Text>
                        </Space>
                        <Text strong>${trade.entryPrice.toFixed(2)}</Text>
                      </div>

                      {/* Quantity and Type */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Space>
                          <Text type="secondary">Quantity:</Text>
                          <Text strong>
                            {trade.quantity?.toFixed(4) || "1.0000"}
                          </Text>
                        </Space>
                        <Tag
                          color={trade.type === "buy" ? "green" : "red"}
                          style={{ fontWeight: "bold" }}
                        >
                          {trade.type?.toUpperCase() || "BUY"}
                        </Tag>
                      </div>

                      {/* Position Value */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text type="secondary">Position Value:</Text>
                        <Text strong style={{ color: "#1890ff" }}>
                          $
                          {((trade.quantity || 1) * trade.entryPrice).toFixed(
                            2
                          )}
                        </Text>
                      </div>

                      {trade.stoploss && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Text type="secondary">Stop Loss:</Text>
                          <Text type="secondary">
                            ${trade.stoploss.toFixed(2)}
                          </Text>
                        </div>
                      )}

                      {/* Strategy */}
                      {trade.Strategy && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <Avatar
                            size="small"
                            style={{
                              backgroundColor: getStrategyColor(
                                trade.Strategy.name
                              ),
                            }}
                            icon={<LineChartOutlined />}
                          />
                          <Text strong>{trade.Strategy.name}</Text>
                        </div>
                      )}

                      {/* Unique Tags from Images */}
                      {trade.Images && trade.Images.length > 0 && (
                        <div>
                          <Text
                            type="secondary"
                            style={{
                              fontSize: "12px",
                              display: "block",
                              marginBottom: 4,
                            }}
                          >
                            Image Tags:
                          </Text>
                          <Space wrap>
                            {Array.from(
                              new Set(
                                trade.Images.map((img) => img.Tag?.name).filter(
                                  Boolean
                                )
                              )
                            ).map((tagName) => (
                              <Tag
                                key={tagName}
                                color={getTagColor(tagName!)}
                                style={{ fontSize: "11px" }}
                              >
                                {tagName}
                              </Tag>
                            ))}
                          </Space>
                        </div>
                      )}

                      {/* Notes */}
                      {trade.notes && (
                        <>
                          <Divider style={{ margin: "8px 0" }} />
                          <Paragraph
                            ellipsis={{
                              rows: 2,
                              expandable: true,
                              symbol: "more",
                            }}
                            style={{ margin: 0, fontSize: "13px" }}
                          >
                            <Text type="secondary">{trade.notes}</Text>
                          </Paragraph>
                        </>
                      )}
                    </Space>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
};

export default ViewTrades;
