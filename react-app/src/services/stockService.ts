import { BaseApiService } from "./api/baseService";

export interface Stock {
  id: number;
  bseCode?: string;
  nseCode?: string;
  stockName: string;
  industry?: string;
  currentPrice?: number;
  dayChange?: number;
  dayChangePercent?: number;
  volume?: number;
  marketCap?: number;
  pe?: number;
  pb?: number;
  isActive: boolean;
  lastUpdated?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockPrice {
  id: number;
  stockId: number;
  date: string;
  open?: number;
  high?: number;
  low?: number;
  close: number;
  volume?: number;
  createdAt: string;
}

export interface StockChart {
  id: number;
  stockId: number;
  chartType: string;
  chartRange: string;
  filePath: string;
  fileSize?: number;
  createdAt: string;
}

export interface StockSearchResult {
  id: number;
  stockName: string;
  nseCode?: string;
  bseCode?: string;
  currentPrice?: number;
  dayChange?: number;
  dayChangePercent?: number;
}

export interface MarketMover {
  id: number;
  stockName: string;
  nseCode?: string;
  currentPrice?: number;
  dayChange?: number;
  dayChangePercent?: number;
  volume?: number;
}

class StockService extends BaseApiService {
  private baseUrl = "/api/stocks";

  async getStocks(params?: {
    page?: number;
    limit?: number;
    search?: string;
    industry?: string;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = queryParams.toString()
      ? `${this.baseUrl}?${queryParams}`
      : this.baseUrl;

    return this.request<{
      stocks: Stock[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
      };
    }>(url);
  }

  async getStockById(id: number) {
    return this.request<Stock>(`${this.baseUrl}/${id}`);
  }

  async getStockByCode(code: string) {
    return this.request<Stock>(`${this.baseUrl}/code/${code}`);
  }

  async getStockPrices(
    stockId: number,
    params?: {
      from?: string;
      to?: string;
      period?: string;
    }
  ) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = queryParams.toString()
      ? `${this.baseUrl}/${stockId}/prices?${queryParams}`
      : `${this.baseUrl}/${stockId}/prices`;

    return this.request<StockPrice[]>(url);
  }

  async getStockCharts(
    stockId: number,
    params?: {
      type?: string;
      range?: string;
    }
  ) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = queryParams.toString()
      ? `${this.baseUrl}/${stockId}/charts?${queryParams}`
      : `${this.baseUrl}/${stockId}/charts`;

    return this.request<StockChart[]>(url);
  }

  async searchStocks(query: string, limit?: number) {
    const queryParams = new URLSearchParams();
    if (limit !== undefined) {
      queryParams.append("limit", limit.toString());
    }

    const url = queryParams.toString()
      ? `${this.baseUrl}/search/${query}?${queryParams}`
      : `${this.baseUrl}/search/${query}`;

    return this.request<StockSearchResult[]>(url);
  }

  async getIndustries() {
    return this.request<string[]>(`${this.baseUrl}/meta/industries`);
  }

  async getMarketMovers(
    type: "gainers" | "losers" = "gainers",
    limit?: number
  ) {
    const queryParams = new URLSearchParams();
    queryParams.append("type", type);
    if (limit !== undefined) {
      queryParams.append("limit", limit.toString());
    }

    const url = `${this.baseUrl}/market/movers?${queryParams}`;
    return this.request<MarketMover[]>(url);
  }

  async createStock(stockData: Partial<Stock>) {
    return this.request<Stock>(this.baseUrl, {
      method: "POST",
      body: JSON.stringify(stockData),
    });
  }

  async updateStock(id: number, stockData: Partial<Stock>) {
    return this.request<Stock>(`${this.baseUrl}/${id}`, {
      method: "PUT",
      body: JSON.stringify(stockData),
    });
  }

  async getStocksWithCharts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    industry?: string;
    screener?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = queryParams.toString()
      ? `${this.baseUrl}/with-charts?${queryParams}`
      : `${this.baseUrl}/with-charts`;

    return this.request<
      Array<{
        id: number;
        stockName: string;
        nseCode: string;
        bseCode: string;
        industry: string;
        screeners: string[];
        charts: StockChart[];
      }>
    >(url);
  }
}

export const stockService = new StockService();
