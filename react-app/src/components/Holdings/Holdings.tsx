import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Typography,
  Space,
  Button,
  message,
  Statistic,
  Row,
  Col,
  Tag,
  Modal,
  Timeline,
  Divider,
  Image,
} from "antd";
import {
  TrophyOutlined,
  DollarCircleOutlined,
  LineChartOutlined,
  ReloadOutlined,
  StockOutlined,
  EyeOutlined,
  CalendarOutlined,
  CameraOutlined,
  AppstoreOutlined,
  BorderOuterOutlined,
} from "@ant-design/icons";
import { apiService } from "../../services/apiService";
import { Holding, Trade } from "../../types";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Column } = Table;

const Holdings: React.FC = () => {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(false);
  const [recalculateLoading, setRecalculateLoading] = useState(false);
  const [imageDisplayMode, setImageDisplayMode] = useState<
    "grid" | "fullscreen"
  >("grid");
  const [selectedHolding, setSelectedHolding] = useState<{
    holding: Holding;
    trades: Array<
      Trade & {
        runningQuantity: number;
        runningAveragePrice: number;
        positionValue: number;
      }
    >;
    summary: {
      totalBuyTrades: number;
      totalSellTrades: number;
      totalBoughtShares: number;
      totalSoldShares: number;
      currentHolding: number;
    };
  } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchHoldings = async () => {
    try {
      setLoading(true);
      const data = await apiService.getHoldings();
      setHoldings(data);
    } catch (error) {
      message.error("Failed to fetch holdings");
      console.error("Error fetching holdings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateHoldings = async () => {
    try {
      setRecalculateLoading(true);
      const data = await apiService.recalculateHoldings();
      setHoldings(data);
      message.success("Holdings recalculated successfully");
    } catch (error) {
      message.error("Failed to recalculate holdings");
      console.error("Error recalculating holdings:", error);
    } finally {
      setRecalculateLoading(false);
    }
  };

  const showHoldingDetails = async (symbol: string) => {
    try {
      setLoading(true);
      const data = await apiService.getHoldingWithTrades(symbol);
      setSelectedHolding(data);
      setModalVisible(true);
    } catch (error) {
      message.error("Failed to fetch holding details");
      console.error("Error fetching holding details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHoldings();
  }, []);

  // Calculate portfolio stats
  const totalPortfolioValue = holdings.reduce(
    (total, holding) => total + holding.quantity * holding.averagePrice,
    0
  );

  const totalPositions = holdings.length;
  const totalShares = holdings.reduce(
    (total, holding) => total + holding.quantity,
    0
  );

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

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
  const formatShares = (value: number) => value.toFixed(4);

  const getQuantityColor = (quantity: number) => {
    if (quantity > 100) return "green";
    if (quantity > 50) return "blue";
    if (quantity > 10) return "orange";
    return "default";
  };

  return (
    <div style={{ padding: "24px" }}>
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Title
          level={2}
          style={{ margin: 0, display: "flex", alignItems: "center", gap: 12 }}
        >
          <StockOutlined style={{ color: "#1890ff" }} />
          Portfolio Holdings
        </Title>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          loading={recalculateLoading}
          onClick={handleRecalculateHoldings}
        >
          Recalculate Holdings
        </Button>
      </div>

      {/* Portfolio Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Positions"
              value={totalPositions}
              prefix={<TrophyOutlined style={{ color: "#1890ff" }} />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Portfolio Value"
              value={totalPortfolioValue}
              precision={2}
              prefix={<DollarCircleOutlined style={{ color: "#52c41a" }} />}
              valueStyle={{ color: "#52c41a" }}
              formatter={(value) => `$${value}`}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Shares"
              value={totalShares}
              precision={4}
              prefix={<LineChartOutlined style={{ color: "#fa8c16" }} />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Average Position Value"
              value={
                totalPositions > 0 ? totalPortfolioValue / totalPositions : 0
              }
              precision={2}
              prefix={<DollarCircleOutlined style={{ color: "#722ed1" }} />}
              valueStyle={{ color: "#722ed1" }}
              formatter={(value) => `$${value}`}
            />
          </Card>
        </Col>
      </Row>

      {/* Holdings Table */}
      <Card
        title={
          <Space>
            <StockOutlined />
            Current Holdings
            <Text type="secondary" style={{ fontSize: "14px" }}>
              (Click "View Trades" to see how each holding was built)
            </Text>
          </Space>
        }
      >
        <Table
          dataSource={holdings}
          loading={loading}
          rowKey="id"
          pagination={false}
          size="middle"
          scroll={{ x: 800 }}
        >
          <Column
            title="Symbol"
            dataIndex="symbol"
            key="symbol"
            render={(symbol: string) => (
              <Tag
                color="blue"
                style={{ fontSize: "14px", fontWeight: "bold" }}
              >
                {symbol}
              </Tag>
            )}
            sorter={(a: Holding, b: Holding) =>
              a.symbol.localeCompare(b.symbol)
            }
            defaultSortOrder="ascend"
          />
          <Column
            title="Quantity"
            dataIndex="quantity"
            key="quantity"
            render={(quantity: number) => (
              <Tag
                color={getQuantityColor(quantity)}
                style={{ fontSize: "13px" }}
              >
                {formatShares(quantity)}
              </Tag>
            )}
            sorter={(a: Holding, b: Holding) => a.quantity - b.quantity}
            align="center"
          />
          <Column
            title="Average Price"
            dataIndex="averagePrice"
            key="averagePrice"
            render={(price: number) => (
              <span style={{ fontWeight: "bold", color: "#1890ff" }}>
                {formatCurrency(price)}
              </span>
            )}
            sorter={(a: Holding, b: Holding) => a.averagePrice - b.averagePrice}
            align="right"
          />
          <Column
            title="Position Value"
            key="positionValue"
            render={(_, holding: Holding) => (
              <span
                style={{
                  fontWeight: "bold",
                  color: "#52c41a",
                  fontSize: "14px",
                }}
              >
                {formatCurrency(holding.quantity * holding.averagePrice)}
              </span>
            )}
            sorter={(a: Holding, b: Holding) =>
              a.quantity * a.averagePrice - b.quantity * b.averagePrice
            }
            align="right"
          />
          <Column
            title="Actions"
            key="actions"
            render={(_, holding: Holding) => (
              <Button
                type="link"
                icon={<EyeOutlined />}
                onClick={() => showHoldingDetails(holding.symbol)}
                size="small"
              >
                View Trades
              </Button>
            )}
            align="center"
          />
        </Table>

        {holdings.length === 0 && !loading && (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "#666",
              background: "#fafafa",
              borderRadius: "8px",
              margin: "20px 0",
            }}
          >
            <StockOutlined
              style={{
                fontSize: "48px",
                marginBottom: "16px",
                color: "#d9d9d9",
              }}
            />
            <div style={{ fontSize: "16px" }}>No holdings found</div>
            <div style={{ fontSize: "14px", marginTop: "8px" }}>
              Start trading to build your portfolio!
            </div>
          </div>
        )}
      </Card>

      {/* Trade History Modal */}
      <Modal
        title={
          selectedHolding ? (
            <Row justify="space-between" align="middle">
              <Col>
                <Space>
                  <StockOutlined style={{ color: "#1890ff" }} />
                  {selectedHolding.holding.symbol} - How This Position Was Built
                </Space>
              </Col>
              <Col>
                <Space>
                  <Typography.Text type="secondary">Images:</Typography.Text>
                  <Button.Group size="small">
                    <Button
                      type={imageDisplayMode === "grid" ? "primary" : "default"}
                      icon={<AppstoreOutlined />}
                      onClick={() => setImageDisplayMode("grid")}
                    >
                      Grid
                    </Button>
                    <Button
                      type={
                        imageDisplayMode === "fullscreen"
                          ? "primary"
                          : "default"
                      }
                      icon={<BorderOuterOutlined />}
                      onClick={() => setImageDisplayMode("fullscreen")}
                    >
                      Full
                    </Button>
                  </Button.Group>
                </Space>
              </Col>
            </Row>
          ) : (
            "Trade History"
          )
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={900}
        style={{ top: 20 }}
      >
        {selectedHolding && (
          <div>
            {/* Current Position Summary */}
            <Card style={{ marginBottom: 16, background: "#f0f8ff" }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="Current Holding"
                    value={selectedHolding.holding.quantity}
                    precision={4}
                    suffix="shares"
                    valueStyle={{ color: "#1890ff" }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Average Cost Basis"
                    value={selectedHolding.holding.averagePrice}
                    precision={2}
                    prefix="$"
                    valueStyle={{ color: "#52c41a" }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Total Position Value"
                    value={
                      selectedHolding.holding.quantity *
                      selectedHolding.holding.averagePrice
                    }
                    precision={2}
                    prefix="$"
                    valueStyle={{ color: "#722ed1" }}
                  />
                </Col>
              </Row>
            </Card>

            <Divider orientation="left">
              <Space>
                <LineChartOutlined />
                Trade History (How Your Position Was Built)
              </Space>
            </Divider>

            {/* Interactive Timeline showing position building */}
            <Timeline
              style={{ marginTop: 16 }}
              items={selectedHolding.trades.map((trade, index) => ({
                color: trade.type === "buy" ? "green" : "red",
                children: (
                  <Card size="small" style={{ marginBottom: 8 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Space>
                        <Tag
                          color={trade.type === "buy" ? "green" : "red"}
                          style={{ fontSize: "13px", fontWeight: "bold" }}
                        >
                          {trade.type?.toUpperCase() || "BUY"}{" "}
                          {trade.quantity?.toFixed(4)}
                        </Tag>
                        <Text strong>@ ${trade.entryPrice.toFixed(2)}</Text>
                        <Text type="secondary">
                          ($
                          {((trade.quantity || 0) * trade.entryPrice).toFixed(
                            2
                          )}{" "}
                          total)
                        </Text>
                      </Space>
                      <Space>
                        <CalendarOutlined style={{ color: "#666" }} />
                        <Text type="secondary">
                          {dayjs(trade.date).format("MMM DD, YYYY")}
                        </Text>
                      </Space>
                    </div>

                    {/* Running totals explanation */}
                    <div
                      style={{
                        marginTop: 8,
                        padding: "8px 12px",
                        background: "#f8f9fa",
                        borderRadius: "4px",
                        border: "1px solid #e9ecef",
                      }}
                    >
                      <Text strong style={{ color: "#1890ff" }}>
                        Position After This Trade:{" "}
                        {trade.runningQuantity.toFixed(4)} shares @ avg $
                        {trade.runningAveragePrice.toFixed(2)} = $
                        {trade.positionValue.toFixed(2)}
                      </Text>

                      {trade.type === "buy" && index > 0 && (
                        <div style={{ marginTop: 4, fontSize: "12px" }}>
                          <Text type="secondary">
                            💡 Your average price changed because you bought
                            more shares at a different price
                          </Text>
                        </div>
                      )}

                      {trade.type === "sell" && (
                        <div style={{ marginTop: 4, fontSize: "12px" }}>
                          <Text type="secondary">
                            💡 Sold shares but average price stays the same
                            (cost basis doesn't change on sells)
                          </Text>
                        </div>
                      )}
                    </div>

                    {trade.Strategy && (
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          <LineChartOutlined /> Strategy: {trade.Strategy.name}
                        </Text>
                      </div>
                    )}

                    {/* Images Section */}
                    {trade.Images && trade.Images.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ marginBottom: 4 }}>
                          <Text type="secondary" style={{ fontSize: "12px" }}>
                            <CameraOutlined /> Images ({trade.Images.length}):
                          </Text>
                        </div>
                        {imageDisplayMode === "fullscreen" ? (
                          // Full Screen Mode - Show each image separately
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 8,
                            }}
                          >
                            <Image.PreviewGroup>
                              {trade.Images.map((image, imgIndex) => (
                                <div
                                  key={image.id}
                                  style={{ position: "relative" }}
                                >
                                  <Image
                                    src={`http://localhost:3001/uploads/${image.filePath}`}
                                    alt={`Trade ${trade.symbol} - Image ${
                                      imgIndex + 1
                                    }`}
                                    style={{
                                      width: "100%",
                                      height: "150px",
                                      objectFit: "cover",
                                      marginBottom:
                                        imgIndex < trade.Images!.length - 1
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
                                        top: 4,
                                        right: 4,
                                        fontSize: "10px",
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
                              height: 120,
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
                                {trade.Images.slice(0, 4).map(
                                  (image, imgIndex) => (
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
                                              ? "120px"
                                              : "58px",
                                          objectFit: "cover",
                                        }}
                                        fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RUG8A8OCIz8A4g4cODAgBvAgAMLDAYMLDCwwMDCAgMLCwsLDCwsLCwsLCwsLCwsLCwsLOQJICcmKIAgcOBABAYC04BqhKLn/6DX/3BVfbe75733VVU6qqru6Xm4K1xd+6lq7fPz83MAAEAAEQAEAAEAAEAAEQAEAAEAAEAAEQAEAAEAAEQAEAAEAAE..."
                                      />
                                      {image.Tag && (
                                        <Tag
                                          color={getTagColor(image.Tag.name)}
                                          style={{
                                            position: "absolute",
                                            top: 2,
                                            right: 2,
                                            fontSize: "9px",
                                          }}
                                        >
                                          {image.Tag.name}
                                        </Tag>
                                      )}
                                      {trade.Images!.length > 4 &&
                                        imgIndex === 3 && (
                                          <div
                                            style={{
                                              position: "absolute",
                                              top: 0,
                                              left: 0,
                                              right: 0,
                                              bottom: 0,
                                              backgroundColor:
                                                "rgba(0,0,0,0.6)",
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              color: "white",
                                              fontSize: "12px",
                                              fontWeight: "bold",
                                            }}
                                          >
                                            +{trade.Images!.length - 4} more
                                          </div>
                                        )}
                                    </div>
                                  )
                                )}
                              </div>
                            </Image.PreviewGroup>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                ),
              }))}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Holdings;
