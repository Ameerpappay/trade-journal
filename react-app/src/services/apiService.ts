import {
  Trade,
  TradeFormData,
  Strategy,
  Tag,
  Holding,
  Symbol,
  SymbolFormData,
  SymbolUploadResponse,
} from "../types";

// Use proxy in development, environment variable in production
const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_BASE_URL || ""
    : "";

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const fullUrl = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(fullUrl, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Network error" }));
      throw new Error(errorData.error || "API request failed");
    }

    return response.json();
  }

  // Trade endpoints
  async getTrades(
    page: number = 1,
    limit: number = 20,
    filters?: { startDate?: string; endDate?: string; symbol?: string }
  ): Promise<{
    trades: Trade[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasMore: boolean;
      itemsPerPage: number;
    };
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }

    return this.request<{
      trades: Trade[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        hasMore: boolean;
        itemsPerPage: number;
      };
    }>(`/api/trades?${params.toString()}`);
  }

  async getTrade(id: number): Promise<Trade> {
    return this.request<Trade>(`/api/trades/${id}`);
  }

  async createTrade(tradeData: TradeFormData): Promise<Trade> {
    return this.request<Trade>("/api/trades", {
      method: "POST",
      body: JSON.stringify(tradeData),
    });
  }

  async updateTrade(
    id: number,
    tradeData: Partial<TradeFormData>
  ): Promise<Trade> {
    return this.request<Trade>(`/api/trades/${id}`, {
      method: "PUT",
      body: JSON.stringify(tradeData),
    });
  }

  async deleteTrade(id: number): Promise<void> {
    return this.request<void>(`/api/trades/${id}`, {
      method: "DELETE",
    });
  }

  // Strategy endpoints
  async getStrategies(): Promise<Strategy[]> {
    return this.request<Strategy[]>("/api/strategies");
  }

  async createStrategy(strategyData: Omit<Strategy, "id">): Promise<Strategy> {
    return this.request<Strategy>("/api/strategies", {
      method: "POST",
      body: JSON.stringify(strategyData),
    });
  }

  async updateStrategy(
    id: number,
    strategyData: Partial<Omit<Strategy, "id">>
  ): Promise<Strategy> {
    return this.request<Strategy>(`/api/strategies/${id}`, {
      method: "PUT",
      body: JSON.stringify(strategyData),
    });
  }

  async deleteStrategy(id: number): Promise<void> {
    return this.request<void>(`/api/strategies/${id}`, {
      method: "DELETE",
    });
  }

  // Tag endpoints
  async getTags(): Promise<Tag[]> {
    return this.request<Tag[]>("/api/tags");
  }

  async createTag(tagData: Omit<Tag, "id">): Promise<Tag> {
    return this.request<Tag>("/api/tags", {
      method: "POST",
      body: JSON.stringify(tagData),
    });
  }

  async updateTag(id: number, tagData: Partial<Omit<Tag, "id">>): Promise<Tag> {
    return this.request<Tag>(`/api/tags/${id}`, {
      method: "PUT",
      body: JSON.stringify(tagData),
    });
  }

  async deleteTag(id: number): Promise<void> {
    return this.request<void>(`/api/tags/${id}`, {
      method: "DELETE",
    });
  }

  // Upload endpoints
  async uploadFiles(files: File[]): Promise<{
    files: Array<{
      filename: string;
      originalName: string;
      path: string;
      size: number;
      mimetype: string;
    }>;
  }> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("images", file);
    });

    const fullUrl = `${API_BASE_URL}/api/upload`;
    const response = await fetch(fullUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Network error" }));
      throw new Error(errorData.error || "Upload failed");
    }

    return response.json();
  }

  async deleteFile(filename: string): Promise<void> {
    return this.request<void>(`/api/upload/${filename}`, {
      method: "DELETE",
    });
  }

  // Holdings endpoints
  async getHoldings(): Promise<Holding[]> {
    return this.request<Holding[]>("/api/holdings");
  }

  async getHolding(symbol: string): Promise<Holding> {
    return this.request<Holding>(`/api/holdings/${symbol}`);
  }

  async getHoldingWithTrades(symbol: string): Promise<{
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
  }> {
    return this.request(`/api/holdings/${symbol}/trades`);
  }

  async recalculateHoldings(): Promise<Holding[]> {
    return this.request<Holding[]>("/api/holdings/recalculate", {
      method: "POST",
    });
  }

  // Symbol endpoints
  async getSymbols(
    page: number = 1,
    limit: number = 20,
    search?: string
  ): Promise<{
    symbols: Symbol[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasMore: boolean;
      itemsPerPage: number;
    };
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) {
      params.append("search", search);
    }

    return this.request<{
      symbols: Symbol[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        hasMore: boolean;
        itemsPerPage: number;
      };
    }>(`/api/symbols?${params.toString()}`);
  }

  async createSymbol(symbolData: SymbolFormData): Promise<Symbol> {
    return this.request<Symbol>("/api/symbols", {
      method: "POST",
      body: JSON.stringify(symbolData),
    });
  }

  async updateSymbol(id: number, symbolData: SymbolFormData): Promise<Symbol> {
    return this.request<Symbol>(`/api/symbols/${id}`, {
      method: "PUT",
      body: JSON.stringify(symbolData),
    });
  }

  async deleteSymbol(id: number): Promise<void> {
    return this.request<void>(`/api/symbols/${id}`, {
      method: "DELETE",
    });
  }

  async uploadSymbols(file: File): Promise<SymbolUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const fullUrl = `${API_BASE_URL}/api/symbols/upload`;
    const response = await fetch(fullUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Network error" }));
      throw new Error(errorData.error || "Upload failed");
    }

    return response.json();
  }
}

export const apiService = new ApiService();
