import { Trade, TradeFormData } from "../../types";
import { BaseApiService } from "./baseService";

class TradeService extends BaseApiService {
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
}

export const tradeService = new TradeService();
