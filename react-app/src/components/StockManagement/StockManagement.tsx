import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Input,
  Select,
  Button,
  Space,
  Typography,
  Tag,
  Pagination,
  Row,
  Col,
  Statistic,
  Modal,
  message,
  Tooltip,
  Image,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  BarChartOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import { stockService, Stock, MarketMover } from "../../services/stockService";
import { jobService } from "../../services/jobService";

const { Title, Text } = Typography;
const { Option } = Select;

interface StockTableData extends Stock {
  key: string;
  priceChange: {
    value: number;
    percent: number;
    direction: "up" | "down" | "neutral";
  };
}

const StockManagement: React.FC = () => {
  const [stocks, setStocks] = useState<StockTableData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("");
  const [industries, setIndustries] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [sortBy, setSortBy] = useState("stockName");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const [marketMovers, setMarketMovers] = useState<{
    gainers: MarketMover[];
    losers: MarketMover[];
  }>({ gainers: [], losers: [] });

  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [stockDetailModal, setStockDetailModal] = useState(false);
  const [chartModal, setChartModal] = useState(false);
  const [stockCharts, setStockCharts] = useState<any[]>([]);

  useEffect(() => {
    fetchStocks();
    fetchIndustries();
    fetchMarketMovers();
  }, [
    pagination.current,
    pagination.pageSize,
    searchQuery,
    selectedIndustry,
    sortBy,
    sortOrder,
  ]);

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const response = await stockService.getStocks({
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchQuery || undefined,
        industry: selectedIndustry || undefined,
        sortBy,
        sortOrder,
      });

      const tableData: StockTableData[] = response.stocks.map((stock) => ({
        ...stock,
        key: stock.id.toString(),
        priceChange: {
          value: stock.dayChange || 0,
          percent: stock.dayChangePercent || 0,
          direction:
            (stock.dayChange || 0) > 0
              ? "up"
              : (stock.dayChange || 0) < 0
              ? "down"
              : "neutral",
        },
      }));

      setStocks(tableData);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination.totalItems,
      }));
    } catch (error) {
      message.error("Failed to fetch stocks");
      console.error("Error fetching stocks:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIndustries = async () => {
    try {
      const industries = await stockService.getIndustries();
      setIndustries(industries);
    } catch (error) {
      console.error("Error fetching industries:", error);
    }
  };

  const fetchMarketMovers = async () => {
    try {
      const [gainers, losers] = await Promise.all([
        stockService.getMarketMovers("gainers", 5),
        stockService.getMarketMovers("losers", 5),
      ]);
      setMarketMovers({ gainers, losers });
    } catch (error) {
      console.error("Error fetching market movers:", error);
    }
  };

  const handleTableChange = (page: number, pageSize?: number) => {
    setPagination((prev) => ({
      ...prev,
      current: page,
      pageSize: pageSize || prev.pageSize,
    }));
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
    } else {
      setSortBy(field);
      setSortOrder("ASC");
    }
  };

  const handleViewStock = async (stock: Stock) => {
    setSelectedStock(stock);
    setStockDetailModal(true);
  };

  const handleViewCharts = async (stock: Stock) => {
    try {
      setSelectedStock(stock);
      const charts = await stockService.getStockCharts(stock.id);
      setStockCharts(charts);
      setChartModal(true);
    } catch (error) {
      message.error("Failed to fetch stock charts");
    }
  };

  const handleDownloadCharts = async (stock: Stock) => {
    try {
      const response = await jobService.startChartDownloadJob(stock.id);
      message.success(`Chart download job started: ${response.job?.id}`);
    } catch (error: any) {
      if (error.message.includes("already running")) {
        message.warning("Chart download is already in progress for this stock");
      } else {
        message.error("Failed to start chart download job");
      }
    }
  };

  const columns = [
    {
      title: "Stock Name",
      dataIndex: "stockName",
      key: "stockName",
      sorter: true,
      render: (text: string, record: StockTableData) => (
        <div>
          <div style={{ fontWeight: "bold" }}>{text}</div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            {record.nseCode && <Tag>NSE: {record.nseCode}</Tag>}
            {record.bseCode && <Tag>BSE: {record.bseCode}</Tag>}
          </div>
        </div>
      ),
    },
    {
      title: "Industry",
      dataIndex: "industry",
      key: "industry",
      render: (industry: string) =>
        industry ? <Tag color="blue">{industry}</Tag> : "-",
    },
    {
      title: "Current Price",
      dataIndex: "currentPrice",
      key: "currentPrice",
      sorter: true,
      align: "right" as const,
      render: (price: number) => (price ? `₹${price.toFixed(2)}` : "-"),
    },
    {
      title: "Day Change",
      key: "priceChange",
      align: "right" as const,
      render: (record: StockTableData) => {
        if (!record.dayChange && !record.dayChangePercent) return "-";

        const color =
          record.priceChange.direction === "up"
            ? "#52c41a"
            : record.priceChange.direction === "down"
            ? "#ff4d4f"
            : "#666";
        const icon =
          record.priceChange.direction === "up" ? (
            <ArrowUpOutlined />
          ) : record.priceChange.direction === "down" ? (
            <ArrowDownOutlined />
          ) : null;

        return (
          <div style={{ color }}>
            {icon && <span style={{ marginRight: 4 }}>{icon}</span>}
            <div>₹{Math.abs(record.dayChange || 0).toFixed(2)}</div>
            <div>({(record.dayChangePercent || 0).toFixed(2)}%)</div>
          </div>
        );
      },
    },
    {
      title: "Volume",
      dataIndex: "volume",
      key: "volume",
      align: "right" as const,
      render: (volume: number) => (volume ? volume.toLocaleString() : "-"),
    },
    {
      title: "Market Cap",
      dataIndex: "marketCap",
      key: "marketCap",
      align: "right" as const,
      render: (marketCap: number) => {
        if (!marketCap) return "-";
        if (marketCap >= 1e9) return `₹${(marketCap / 1e9).toFixed(1)}B`;
        if (marketCap >= 1e6) return `₹${(marketCap / 1e6).toFixed(1)}M`;
        return `₹${marketCap.toLocaleString()}`;
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (record: StockTableData) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleViewStock(record)}
            />
          </Tooltip>
          <Tooltip title="View Charts">
            <Button
              icon={<BarChartOutlined />}
              size="small"
              onClick={() => handleViewCharts(record)}
            />
          </Tooltip>
          <Tooltip title="Download Charts">
            <Button size="small" onClick={() => handleDownloadCharts(record)}>
              Download
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Title level={2}>Stock Management</Title>

      {/* Market Movers */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card
            title={<span style={{ color: "#52c41a" }}>Top Gainers</span>}
            size="small"
          >
            {marketMovers.gainers.map((stock, index) => (
              <div
                key={stock.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Text strong>{stock.stockName}</Text>
                <Text style={{ color: "#52c41a" }}>
                  +{stock.dayChangePercent?.toFixed(2)}%
                </Text>
              </div>
            ))}
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title={<span style={{ color: "#ff4d4f" }}>Top Losers</span>}
            size="small"
          >
            {marketMovers.losers.map((stock, index) => (
              <div
                key={stock.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Text strong>{stock.stockName}</Text>
                <Text style={{ color: "#ff4d4f" }}>
                  {stock.dayChangePercent?.toFixed(2)}%
                </Text>
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Input
              placeholder="Search stocks..."
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={6}>
            <Select
              placeholder="Select industry"
              value={selectedIndustry}
              onChange={setSelectedIndustry}
              allowClear
              style={{ width: "100%" }}
            >
              {industries.map((industry) => (
                <Option key={industry} value={industry}>
                  {industry}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Select
              value={`${sortBy}-${sortOrder}`}
              onChange={(value) => {
                const [field, order] = value.split("-");
                setSortBy(field);
                setSortOrder(order as "ASC" | "DESC");
              }}
              style={{ width: "100%" }}
            >
              <Option value="stockName-ASC">Name (A-Z)</Option>
              <Option value="stockName-DESC">Name (Z-A)</Option>
              <Option value="currentPrice-DESC">Price (High-Low)</Option>
              <Option value="currentPrice-ASC">Price (Low-High)</Option>
              <Option value="dayChangePercent-DESC">Change % (High-Low)</Option>
              <Option value="dayChangePercent-ASC">Change % (Low-High)</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchStocks}
              loading={loading}
            >
              Refresh
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Stocks Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={stocks}
          loading={loading}
          pagination={false}
          scroll={{ x: 1200 }}
          size="small"
        />

        <div style={{ marginTop: 16, textAlign: "right" }}>
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onChange={handleTableChange}
            showSizeChanger
            showQuickJumper
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} of ${total} stocks`
            }
          />
        </div>
      </Card>

      {/* Stock Detail Modal */}
      <Modal
        title="Stock Details"
        open={stockDetailModal}
        onCancel={() => setStockDetailModal(false)}
        footer={null}
        width={600}
      >
        {selectedStock && (
          <div>
            <Title level={4}>{selectedStock.stockName}</Title>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Current Price"
                  value={selectedStock.currentPrice}
                  prefix="₹"
                  precision={2}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Day Change"
                  value={selectedStock.dayChangePercent}
                  suffix="%"
                  precision={2}
                  valueStyle={{
                    color:
                      (selectedStock.dayChangePercent || 0) >= 0
                        ? "#3f8600"
                        : "#cf1322",
                  }}
                />
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Statistic title="Volume" value={selectedStock.volume} />
              </Col>
              <Col span={12}>
                <Statistic
                  title="P/E Ratio"
                  value={selectedStock.pe}
                  precision={2}
                />
              </Col>
            </Row>
            {selectedStock.industry && (
              <div style={{ marginTop: 16 }}>
                <Text strong>Industry: </Text>
                <Tag color="blue">{selectedStock.industry}</Tag>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Chart Modal */}
      <Modal
        title={`Charts - ${selectedStock?.stockName}`}
        open={chartModal}
        onCancel={() => setChartModal(false)}
        footer={null}
        width={800}
      >
        {stockCharts.length > 0 ? (
          <div>
            {stockCharts.map((chart, index) => (
              <div key={chart.id} style={{ marginBottom: 16 }}>
                <Title level={5}>
                  {chart.chartType.charAt(0).toUpperCase() +
                    chart.chartType.slice(1)}{" "}
                  Chart ({chart.chartRange} days)
                </Title>
                <Image
                  src={`/api/${chart.filePath}`}
                  alt={`${chart.chartType} chart`}
                  style={{ width: "100%" }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Text>No charts available for this stock</Text>
            <div style={{ marginTop: 16 }}>
              <Button
                type="primary"
                onClick={() =>
                  selectedStock && handleDownloadCharts(selectedStock)
                }
              >
                Download Charts
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StockManagement;
