import React, { useState, useEffect } from "react";
import { Input, Select, Button, Spin, message, Badge } from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  PictureOutlined,
  FilterOutlined,
  LineChartOutlined,
} from "@ant-design/icons";
import { getChartImageUrl } from "../../utils/imageUtils";
import { stockService, screenerService } from "../../services";

const { Search } = Input;

interface Stock {
  id: number;
  stockName: string;
  nseCode: string;
  bseCode: string;
  industry: string;
  screeners: string[];
  charts: Chart[];
}

interface Chart {
  id: number;
  chartType: string;
  chartRange: string;
  filePath: string;
  fileSize?: number;
}

interface Screener {
  id: number;
  scanName: string;
  description?: string;
  sourceName: string;
  isActive: boolean;
}

const ChartViewer: React.FC = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  const [screeners, setScreeners] = useState<Screener[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedScreener, setSelectedScreener] = useState<string>("all");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterStocks();
  }, [stocks, searchTerm, selectedScreener, selectedIndustry]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch stocks with charts using the service
      const stocksData = await stockService.getStocksWithCharts();

      // Fetch screeners using the service
      const screenersResponse = await screenerService.getScreeners();
      const screenersData = screenersResponse.screeners;

      setStocks(stocksData);
      setScreeners(screenersData);

      // Extract unique industries
      const uniqueIndustries = Array.from(
        new Set(stocksData.map((stock) => stock.industry).filter(Boolean))
      ) as string[];
      setIndustries(uniqueIndustries);
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Failed to load chart data");
    } finally {
      setLoading(false);
    }
  };

  const filterStocks = () => {
    let filtered = stocks;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (stock) =>
          stock.stockName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          stock.nseCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          stock.bseCode?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Screener filter
    if (selectedScreener !== "all") {
      filtered = filtered.filter((stock) =>
        stock.screeners.includes(selectedScreener)
      );
    }

    // Industry filter
    if (selectedIndustry !== "all") {
      filtered = filtered.filter(
        (stock) => stock.industry === selectedIndustry
      );
    }

    setFilteredStocks(filtered);
  };

  const handleRefresh = () => {
    fetchData();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedScreener("all");
    setSelectedIndustry("all");
  };

  const renderStockCard = (stock: Stock) => {
    const chartCount = stock.charts?.length || 0;

    return (
      <div
        key={stock.id}
        style={{
          background: "white",
          borderRadius: "6px",
          padding: "12px",
          marginBottom: "12px",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          border: "1px solid #e2e8f0",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 4px 12px 0 rgba(0, 0, 0, 0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 1px 3px 0 rgba(0, 0, 0, 0.1)";
        }}
      >
        {/* Stock Header - Single Line Layout */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "6px",
            gap: "12px",
          }}
        >
          {/* Left Side: Stock Name + Codes */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flex: 1,
            }}
          >
            <h3
              style={{
                color: "#2563eb",
                fontSize: "16px",
                fontWeight: 600,
                margin: 0,
              }}
            >
              {stock.stockName}
            </h3>
            {stock.nseCode && (
              <span
                style={{
                  background: "#e0f2fe",
                  color: "#0277bd",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  fontSize: "10px",
                  fontWeight: 600,
                }}
              >
                NSE: {stock.nseCode}
              </span>
            )}
            {stock.bseCode && (
              <span
                style={{
                  background: "#f3e5f5",
                  color: "#7b1fa2",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  fontSize: "10px",
                  fontWeight: 600,
                }}
              >
                BSE: {stock.bseCode}
              </span>
            )}
          </div>

          {/* Right Side: Screeners + Chart Count */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              {stock.screeners.map((screener, index) => (
                <span
                  key={index}
                  style={{
                    background: "#06b6d4",
                    color: "white",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "10px",
                    fontWeight: 500,
                  }}
                >
                  {screener}
                </span>
              ))}
            </div>
            <Badge count={chartCount} color="#10b981" />
          </div>
        </div>

        {/* Industry - Compact Line */}
        <div style={{ marginBottom: "8px" }}>
          <p
            style={{
              color: "#64748b",
              fontSize: "12px",
              margin: 0,
            }}
          >
            {stock.industry || "Unknown Industry"}
          </p>
        </div>

        {/* Charts Container - Full Width Grid */}
        {stock.charts && stock.charts.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
              gap: "8px",
              marginTop: "6px",
            }}
          >
            {stock.charts.map((chart) => (
              <div key={chart.id} style={{ position: "relative" }}>
                <img
                  src={getChartImageUrl(chart.filePath)}
                  alt={`${stock.stockName} ${chart.chartType} chart`}
                  loading="lazy"
                  style={{
                    width: "100%",
                    height: "auto",
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                    transition: "transform 0.3s ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.02)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                  onClick={() => {
                    // Open image in new tab for full view
                    window.open(getChartImageUrl(chart.filePath), "_blank");
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: "12px",
                    left: "12px",
                    background: "rgba(0, 0, 0, 0.75)",
                    color: "white",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: 600,
                    backdropFilter: "blur(10px)",
                  }}
                >
                  {chart.chartType} ({chart.chartRange})
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "24px",
              color: "#64748b",
            }}
          >
            <PictureOutlined style={{ fontSize: "48px", opacity: 0.5 }} />
            <div style={{ marginTop: "8px" }}>No charts available</div>
          </div>
        )}

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "12px",
            paddingTop: "12px",
            borderTop: "1px solid #e2e8f0",
            justifyContent: "flex-start",
          }}
        >
          <button
            style={{
              padding: "4px 12px",
              borderRadius: "6px",
              fontWeight: 500,
              fontSize: "12px",
              textDecoration: "none",
              transition: "all 0.3s ease",
              background: "#2563eb",
              color: "white",
              border: "1px solid #2563eb",
              cursor: "pointer",
            }}
            onClick={() =>
              window.open(
                `https://chartink.com/stocks/${
                  stock.nseCode || stock.bseCode
                }.html`,
                "_blank"
              )
            }
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#1d4ed8";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#2563eb";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <LineChartOutlined style={{ marginRight: "4px" }} />
            Chartink
          </button>
          <button
            style={{
              padding: "4px 12px",
              borderRadius: "6px",
              fontWeight: 500,
              fontSize: "12px",
              textDecoration: "none",
              transition: "all 0.3s ease",
              background: "#10b981",
              color: "white",
              border: "1px solid #10b981",
              cursor: "pointer",
            }}
            onClick={() =>
              window.open(
                `https://www.screener.in/company/${
                  stock.nseCode || stock.bseCode || stock.stockName
                }/consolidated/`,
                "_blank"
              )
            }
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#059669";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#10b981";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <PictureOutlined style={{ marginRight: "4px" }} />
            Screener.in
          </button>
        </div>
      </div>
    );
  };

  const statsData = {
    totalStocks: stocks.length,
    filteredStocks: filteredStocks.length,
    totalCharts: stocks.reduce(
      (sum, stock) => sum + (stock.charts?.length || 0),
      0
    ),
    screenerCount: screeners.length,
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <div>Loading stock charts...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#f8fafc",
        minHeight: "100vh",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div style={{ padding: "4px" }}>
        {/* Filter Section */}
        <div
          style={{
            background: "white",
            borderRadius: "6px",
            padding: "8px",
            marginBottom: "6px",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <h6 style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>
              <FilterOutlined style={{ marginRight: "4px" }} />
              Filters
            </h6>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <Button
                size="small"
                onClick={clearFilters}
                style={{ fontSize: "12px" }}
              >
                Clear All
              </Button>
              <Button
                style={{
                  background: "rgba(37, 99, 235, 0.1)",
                  border: "1px solid #2563eb",
                  color: "#2563eb",
                  fontSize: "12px",
                }}
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={loading}
                size="small"
              >
                Refresh
              </Button>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "8px",
            }}
          >
            <div>
              <Search
                placeholder="Search stocks..."
                allowClear
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: "100%" }}
                size="small"
              />
            </div>
            <div>
              <Select
                style={{ width: "100%" }}
                placeholder="Select Screener"
                value={selectedScreener}
                onChange={setSelectedScreener}
                size="small"
                options={[
                  { value: "all", label: "All Screeners" },
                  ...screeners.map((screener) => ({
                    value: screener.scanName,
                    label: screener.scanName,
                  })),
                ]}
              />
            </div>
            <div>
              <Select
                style={{ width: "100%" }}
                placeholder="Select Industry"
                value={selectedIndustry}
                onChange={setSelectedIndustry}
                size="small"
                options={[
                  { value: "all", label: "All Industries" },
                  ...industries.map((industry) => ({
                    value: industry,
                    label: industry,
                  })),
                ]}
              />
            </div>
          </div>
        </div>

        {/* Scrollable Stock Charts Section */}
        <div
          style={{
            height: "93vh",
            overflowY: "auto",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "12px",
            background: "white",
            position: "relative",
          }}
          onScroll={(e) => {
            const element = e.currentTarget;
            const scrolled = element.scrollTop;
            const maxScroll = element.scrollHeight - element.clientHeight;
            const scrollPercentage = Math.round((scrolled / maxScroll) * 100);

            // Update scroll indicator
            const indicator = document.getElementById("scroll-indicator");
            if (indicator) {
              indicator.style.display =
                filteredStocks.length > 3 ? "block" : "none";
              indicator.innerHTML = `
                <div style="font-size: 12px; font-weight: 600; color: #2563eb;">
                  📊 ${filteredStocks.length} stocks • ${statsData.totalCharts} charts
                </div>
                <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
                  ${scrollPercentage}% scrolled
                </div>
              `;
            }
          }}
        >
          {/* Scroll Indicator */}
          <div
            id="scroll-indicator"
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              background: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "8px 12px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              zIndex: 1000,
              display: "none",
              backdropFilter: "blur(10px)",
            }}
          />

          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>Loading stock charts...</div>
            </div>
          ) : filteredStocks.length > 0 ? (
            <div>{filteredStocks.map(renderStockCard)}</div>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "80px 20px",
                color: "#64748b",
              }}
            >
              <PictureOutlined style={{ fontSize: "72px", opacity: 0.5 }} />
              <h4 style={{ marginTop: "16px", color: "#64748b" }}>
                No Stock Data Available
              </h4>
              <p>
                Charts may be getting updated. Please wait or try refreshing the
                page.
              </p>
              <Button
                type="primary"
                style={{ marginTop: 16 }}
                onClick={handleRefresh}
              >
                Refresh Data
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChartViewer;
