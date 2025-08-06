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
  Avatar,
} from "antd";
import {
  DollarOutlined,
  CalendarOutlined,
  LineChartOutlined,
  CameraOutlined,
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  RiseOutlined,
  FallOutlined,
  AppstoreOutlined,
  BorderOuterOutlined,
  LeftOutlined,
  RightOutlined,
  UpOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { Trade, Strategy, Tag as TagType } from "../../types";
import { apiService } from "../../services/apiService";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface ViewTradesProps {}

const ViewTrades: React.FC<ViewTradesProps> = () => {
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
  const [fullscreenTradeIndex, setFullscreenTradeIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterTrades();
  }, [trades, searchTerm, selectedStrategy, selectedTags, dateRange]);

  // Keyboard navigation for fullscreen mode
  useEffect(() => {
    if (imageDisplayMode === "fullscreen" && filteredTrades.length > 0) {
      const handleKeyDown = (event: KeyboardEvent) => {
        const currentTrade = filteredTrades[fullscreenTradeIndex];
        const totalImages = currentTrade?.Images?.length || 0;

        switch (event.key) {
          case "ArrowRight":
            // Next image or next trade
            if (currentImageIndex < totalImages - 1) {
              setCurrentImageIndex((prev) => prev + 1);
            } else if (fullscreenTradeIndex < filteredTrades.length - 1) {
              setFullscreenTradeIndex((prev) => prev + 1);
              setCurrentImageIndex(0);
            }
            break;
          case "ArrowLeft":
            // Previous image or previous trade
            if (currentImageIndex > 0) {
              setCurrentImageIndex((prev) => prev - 1);
            } else if (fullscreenTradeIndex > 0) {
              setFullscreenTradeIndex((prev) => prev - 1);
              const prevTrade = filteredTrades[fullscreenTradeIndex - 1];
              setCurrentImageIndex((prevTrade?.Images?.length || 1) - 1);
            }
            break;
          case "ArrowDown":
            // Next trade
            if (fullscreenTradeIndex < filteredTrades.length - 1) {
              setFullscreenTradeIndex((prev) => prev + 1);
              setCurrentImageIndex(0);
            }
            break;
          case "ArrowUp":
            // Previous trade
            if (fullscreenTradeIndex > 0) {
              setFullscreenTradeIndex((prev) => prev - 1);
              setCurrentImageIndex(0);
            }
            break;
          case "Escape":
            setImageDisplayMode("grid");
            break;
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [
    imageDisplayMode,
    filteredTrades,
    fullscreenTradeIndex,
    currentImageIndex,
  ]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tradesResponse, strategiesData, tagsData] = await Promise.all([
        apiService.getTrades(1, 20),
        apiService.getStrategies(),
        apiService.getTags(),
      ]);
      setTrades(tradesResponse.trades);
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
          trade.notes?.toLowerCase().includes(searchTerm.toLowerCase())
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
        trade.Images?.some((image) => selectedTags.includes(image.Tag?.id || 0))
      );
    }

    // Date range filter
    if (dateRange) {
      filtered = filtered.filter((trade) =>
        dayjs(trade.date).isBetween(dateRange[0], dateRange[1], "day", "[]")
      );
    }

    setFilteredTrades(filtered);
  };

  const calculateProfitLoss = (
    entryPrice: number,
    stopLoss: number | undefined
  ) => {
    if (!stopLoss) return null;
    const difference = Math.abs(entryPrice - stopLoss);
    const percentage = (difference / entryPrice) * 100;
    return {
      value: difference,
      percentage,
      isProfit: entryPrice > stopLoss,
    };
  };

  const getTagColor = (tagName: string) => {
    const colors = [
      "magenta",
      "red",
      "volcano",
      "orange",
      "gold",
      "lime",
      "green",
      "cyan",
      "blue",
      "geekblue",
      "purple",
    ];
    const hash = tagName
      .split("")
      .reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  // Statistics calculations
  const totalTrades = filteredTrades.length;
  const profitableTrades = filteredTrades.filter((trade) => {
    const pnl = calculateProfitLoss(trade.entryPrice, trade.stoploss);
    return pnl?.isProfit || false;
  }).length;
  const totalImages = filteredTrades.reduce(
    (sum, trade) => sum + (trade.Images?.length || 0),
    0
  );
  const avgEntryPrice =
    totalTrades > 0
      ? filteredTrades.reduce((sum, trade) => sum + trade.entryPrice, 0) /
        totalTrades
      : 0;

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <Card style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Title level={2} style={{ margin: 0 }}>
              📈 Assets Overview
            </Title>
            <Text type="secondary">
              View and analyze your trading positions with advanced filtering
            </Text>
          </div>

          <Space size="large">
            <Statistic
              title="Total Trades"
              value={totalTrades}
              prefix={<EyeOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
            <Statistic
              title="Images"
              value={totalImages}
              prefix={<CameraOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Space>
        </div>
      </Card>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <Space wrap>
            <Input
              placeholder="Search trades..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 200 }}
            />
            <Select
              placeholder="Filter by strategy"
              value={selectedStrategy}
              onChange={setSelectedStrategy}
              allowClear
              style={{ width: 200 }}
            >
              {strategies.map((strategy) => (
                <Option key={strategy.id} value={strategy.id}>
                  {strategy.name}
                </Option>
              ))}
            </Select>
            <Select
              mode="multiple"
              placeholder="Filter by tags"
              value={selectedTags}
              onChange={setSelectedTags}
              style={{ width: 200 }}
            >
              {tags.map((tag) => (
                <Option key={tag.id} value={tag.id}>
                  {tag.name}
                </Option>
              ))}
            </Select>
            <DatePicker.RangePicker
              value={dateRange}
              onChange={(dates) =>
                setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)
              }
              style={{ width: 250 }}
            />
          </Space>

          <Space>
            <Text type="secondary">Display:</Text>
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
                onClick={() => {
                  setImageDisplayMode("fullscreen");
                  setFullscreenTradeIndex(0);
                  setCurrentImageIndex(0);
                }}
              >
                Fullscreen
              </Button>
            </Button.Group>
          </Space>
        </div>
      </Card>

      {/* Content Display */}
      {filteredTrades.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No trades match your current filters"
        />
      ) : imageDisplayMode === "fullscreen" ? (
        // Fullscreen Mode
        <div style={{ position: "relative", minHeight: "80vh" }}>
          {(() => {
            const currentTrade = filteredTrades[fullscreenTradeIndex];
            const totalImages = currentTrade?.Images?.length || 0;
            const profitLoss = calculateProfitLoss(
              currentTrade.entryPrice,
              currentTrade.stoploss
            );

            return (
              <Card
                style={{
                  height: "85vh",
                  display: "flex",
                  flexDirection: "column",
                }}
                bodyStyle={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  padding: 0,
                }}
              >
                {/* Navigation Header */}
                <div
                  style={{
                    padding: "16px 24px",
                    borderBottom: "1px solid #f0f0f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#fafafa",
                  }}
                >
                  <Space>
                    <Button
                      onClick={() => {
                        if (fullscreenTradeIndex > 0) {
                          setFullscreenTradeIndex((prev) => prev - 1);
                          setCurrentImageIndex(0);
                        }
                      }}
                      disabled={fullscreenTradeIndex === 0}
                      icon={<UpOutlined />}
                    >
                      Previous Trade
                    </Button>
                    <Text strong>
                      Trade {fullscreenTradeIndex + 1} of{" "}
                      {filteredTrades.length}
                    </Text>
                    <Button
                      onClick={() => {
                        if (fullscreenTradeIndex < filteredTrades.length - 1) {
                          setFullscreenTradeIndex((prev) => prev + 1);
                          setCurrentImageIndex(0);
                        }
                      }}
                      disabled={
                        fullscreenTradeIndex === filteredTrades.length - 1
                      }
                      icon={<DownOutlined />}
                    >
                      Next Trade
                    </Button>
                  </Space>

                  <Space>
                    {totalImages > 1 && (
                      <>
                        <Button
                          onClick={() =>
                            setCurrentImageIndex((prev) =>
                              Math.max(0, prev - 1)
                            )
                          }
                          disabled={currentImageIndex === 0}
                          icon={<LeftOutlined />}
                        />
                        <Text>
                          Image {currentImageIndex + 1} of {totalImages}
                        </Text>
                        <Button
                          onClick={() =>
                            setCurrentImageIndex((prev) =>
                              Math.min(totalImages - 1, prev + 1)
                            )
                          }
                          disabled={currentImageIndex === totalImages - 1}
                          icon={<RightOutlined />}
                        />
                      </>
                    )}
                    <Button
                      onClick={() => setImageDisplayMode("grid")}
                      icon={<AppstoreOutlined />}
                    >
                      Exit Fullscreen
                    </Button>
                  </Space>
                </div>

                {/* Main Content Area */}
                <div style={{ flex: 1, display: "flex" }}>
                  {/* Image Section */}
                  <div
                    style={{
                      flex: totalImages > 0 ? 2 : 0,
                      padding: totalImages > 0 ? "24px" : "0",
                      background: "#f8f9fa",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                    }}
                  >
                    {totalImages > 0 && currentTrade.Images ? (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "relative",
                        }}
                      >
                        <Image
                          src={`http://localhost:3001/uploads/${currentTrade.Images[currentImageIndex]?.filePath}`}
                          alt={`${currentTrade.symbol} - Image ${
                            currentImageIndex + 1
                          }`}
                          style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                          }}
                          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RUG8A8OCIz8A4g4cODAgBvAgAMLDAYMLDCwwMDCAgMLCwsLDCwsLCwsLCwsLCwsLCwsLOQJICcmKIAgcOBABAYC04BqhKLn/6DX/3BVfbe75733VVU6qqru6Xm4K1xd+6lq7fPz83AAAEAAEQAEAAEAAEAAEQAEAAEAAEAAEQAEAAEAAEQAEAAEAAE..."
                        />
                        {/* Image Tag Overlay */}
                        {currentTrade.Images[currentImageIndex]?.Tag && (
                          <Tag
                            color={getTagColor(
                              currentTrade.Images[currentImageIndex]?.Tag
                                ?.name || ""
                            )}
                            style={{
                              position: "absolute",
                              top: 16,
                              right: 16,
                              fontSize: "14px",
                              zIndex: 2,
                            }}
                          >
                            {currentTrade.Images[currentImageIndex]?.Tag?.name}
                          </Tag>
                        )}

                        {/* Navigation Hints */}
                        <div
                          style={{
                            position: "absolute",
                            bottom: 16,
                            left: "50%",
                            transform: "translateX(-50%)",
                            background: "rgba(0,0,0,0.7)",
                            color: "white",
                            padding: "8px 16px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            textAlign: "center",
                          }}
                        >
                          Use ← → for images • ↑ ↓ for trades • ESC to exit
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          textAlign: "center",
                          color: "#999",
                          fontSize: "16px",
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <CameraOutlined
                          style={{ fontSize: "48px", marginBottom: "16px" }}
                        />
                        <div>No images for this trade</div>
                      </div>
                    )}
                  </div>

                  {/* Trade Details Section */}
                  <div
                    style={{
                      flex: 1,
                      padding: "24px",
                      overflowY: "auto",
                      borderLeft:
                        totalImages > 0 ? "1px solid #f0f0f0" : "none",
                    }}
                  >
                    <Space
                      direction="vertical"
                      size="large"
                      style={{ width: "100%" }}
                    >
                      {/* Trade Header */}
                      <div>
                        <Title
                          level={2}
                          style={{ margin: 0, color: "#1890ff" }}
                        >
                          {currentTrade.symbol}
                        </Title>
                        <Text type="secondary" style={{ fontSize: "16px" }}>
                          <CalendarOutlined />{" "}
                          {dayjs(currentTrade.date).format("MMM DD, YYYY")}
                        </Text>
                      </div>

                      {/* Key Metrics */}
                      <Row gutter={16}>
                        <Col span={12}>
                          <Statistic
                            title="Entry Price"
                            value={currentTrade.entryPrice}
                            precision={2}
                            prefix="$"
                            valueStyle={{ color: "#1890ff" }}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title="Quantity"
                            value={currentTrade.quantity}
                            suffix={
                              currentTrade.type === "buy"
                                ? "shares bought"
                                : "shares sold"
                            }
                            valueStyle={{
                              color:
                                currentTrade.type === "buy"
                                  ? "#52c41a"
                                  : "#ff4d4f",
                            }}
                          />
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={12}>
                          <Statistic
                            title="Stop Loss"
                            value={currentTrade.stoploss}
                            precision={2}
                            prefix="$"
                            valueStyle={{ color: "#ff4d4f" }}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title="Potential P&L"
                            value={profitLoss ? Math.abs(profitLoss.value) : 0}
                            precision={2}
                            prefix={profitLoss?.isProfit ? "+$" : "-$"}
                            valueStyle={{
                              color: profitLoss?.isProfit
                                ? "#52c41a"
                                : "#ff4d4f",
                            }}
                          />
                        </Col>
                      </Row>

                      {/* Trade Type Badge */}
                      <div>
                        <Tag
                          color={currentTrade.type === "buy" ? "green" : "red"}
                          style={{ fontSize: "14px", padding: "4px 12px" }}
                        >
                          {currentTrade.type?.toUpperCase()} ORDER
                        </Tag>
                      </div>

                      {/* Strategy */}
                      {currentTrade.Strategy && (
                        <Card
                          size="small"
                          title={
                            <>
                              <LineChartOutlined /> Strategy
                            </>
                          }
                        >
                          <Text strong>{currentTrade.Strategy.name}</Text>
                          {currentTrade.Strategy.description && (
                            <div style={{ marginTop: 8 }}>
                              <Text type="secondary">
                                {currentTrade.Strategy.description}
                              </Text>
                            </div>
                          )}
                        </Card>
                      )}

                      {/* Notes */}
                      {currentTrade.notes && (
                        <Card size="small" title="Notes">
                          <Paragraph>{currentTrade.notes}</Paragraph>
                        </Card>
                      )}

                      {/* Image Thumbnails */}
                      {totalImages > 0 && currentTrade.Images && (
                        <Card
                          size="small"
                          title={
                            <>
                              <CameraOutlined /> Images ({totalImages})
                            </>
                          }
                        >
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              flexWrap: "wrap",
                            }}
                          >
                            {currentTrade.Images.map((image, index) => (
                              <div
                                key={image.id}
                                style={{ position: "relative" }}
                              >
                                <div
                                  style={{
                                    width: "60px",
                                    height: "60px",
                                    border:
                                      index === currentImageIndex
                                        ? "3px solid #1890ff"
                                        : "2px solid #d9d9d9",
                                    borderRadius: "8px",
                                    overflow: "hidden",
                                    cursor: "pointer",
                                    transition: "all 0.3s",
                                  }}
                                  onClick={() => setCurrentImageIndex(index)}
                                >
                                  <img
                                    src={`http://localhost:3001/uploads/${image.filePath}`}
                                    alt={`Thumbnail ${index + 1}`}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                    }}
                                  />
                                </div>
                                {image.Tag && (
                                  <Tag
                                    color={getTagColor(image.Tag.name)}
                                    style={{
                                      position: "absolute",
                                      top: -8,
                                      right: -8,
                                      fontSize: "10px",
                                      transform: "scale(0.8)",
                                    }}
                                  >
                                    {image.Tag.name}
                                  </Tag>
                                )}
                              </div>
                            ))}
                          </div>
                        </Card>
                      )}
                    </Space>
                  </div>
                </div>
              </Card>
            );
          })()}
        </div>
      ) : (
        // Grid Mode
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
                                  fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RUG8A8OCIz8A4g4cODAgBvAgAMLDAYMLDCwwMDCAgMLCwsLDCwsLCwsLCwsLCwsLCwsLOQJICcmKIAgcOBABAYC04BqhKLn/6DX/3BVfbd9733VFU6qqru6Xm4K1xd+6lq7fPz83AAAEAAEQAEAAEAAEAAEQAEAAEAAEAAEQAEAAEAAEQAEAAEAAE..."
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
                      </div>
                    ) : null
                  }
                >
                  <div style={{ padding: "4px 0" }}>
                    <Space
                      direction="vertical"
                      size="small"
                      style={{ width: "100%" }}
                    >
                      {/* Header */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Title
                          level={4}
                          style={{ margin: 0, color: "#1890ff" }}
                        >
                          {trade.symbol}
                        </Title>
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          <CalendarOutlined />{" "}
                          {dayjs(trade.date).format("MMM DD")}
                        </Text>
                      </div>

                      {/* Price Info */}
                      <Row gutter={8}>
                        <Col span={12}>
                          <div style={{ textAlign: "center" }}>
                            <Text type="secondary" style={{ fontSize: "11px" }}>
                              Entry
                            </Text>
                            <div
                              style={{
                                fontWeight: "bold",
                                color: "#1890ff",
                                fontSize: "13px",
                              }}
                            >
                              ${trade.entryPrice.toFixed(2)}
                            </div>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ textAlign: "center" }}>
                            <Text type="secondary" style={{ fontSize: "11px" }}>
                              Stop Loss
                            </Text>
                            <div
                              style={{
                                fontWeight: "bold",
                                color: "#ff4d4f",
                                fontSize: "13px",
                              }}
                            >
                              ${trade.stoploss?.toFixed(2) || "N/A"}
                            </div>
                          </div>
                        </Col>
                      </Row>

                      {/* Quantity and Type */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <Text type="secondary" style={{ fontSize: "11px" }}>
                            Quantity:{" "}
                          </Text>
                          <Text
                            style={{ fontWeight: "bold", fontSize: "12px" }}
                          >
                            {trade.quantity}
                          </Text>
                        </div>
                        <Tag
                          color={trade.type === "buy" ? "green" : "red"}
                          style={{ fontSize: "11px" }}
                        >
                          {trade.type?.toUpperCase()}
                        </Tag>
                      </div>

                      {/* P&L */}
                      <div style={{ textAlign: "center" }}>
                        <Text type="secondary" style={{ fontSize: "11px" }}>
                          Potential P&L
                        </Text>
                        <div
                          style={{
                            fontWeight: "bold",
                            color: profitLoss?.isProfit ? "#52c41a" : "#ff4d4f",
                            fontSize: "14px",
                          }}
                        >
                          {profitLoss?.isProfit ? "+" : "-"}$
                          {profitLoss
                            ? Math.abs(profitLoss.value).toFixed(2)
                            : "0.00"}
                          ({profitLoss?.percentage.toFixed(1)}%)
                        </div>
                      </div>

                      {/* Strategy */}
                      {trade.Strategy && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <LineChartOutlined
                            style={{ color: "#722ed1", fontSize: "12px" }}
                          />
                          <Text style={{ fontSize: "12px", color: "#722ed1" }}>
                            {trade.Strategy.name}
                          </Text>
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
