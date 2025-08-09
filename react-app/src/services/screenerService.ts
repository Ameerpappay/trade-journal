import { BaseApiService } from "./api/baseService";
import { Stock } from "./stockService";

export interface Screener {
  id: number;
  scanName: string;
  description?: string;
  sourceName: string;
  sourceUrl?: string;
  userId?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface StockScreenerResult {
  id: number;
  stockId: number;
  screenerId: number;
  isMatch: boolean;
  scanDate: string;
  createdAt: string;
  stock?: {
    id: number;
    stockName: string;
    nseCode?: string;
    bseCode?: string;
    currentPrice?: number;
    dayChange?: number;
    dayChangePercent?: number;
    industry?: string;
  };
}

export interface ScreenerResultsResponse {
  screener: Screener;
  results: StockScreenerResult[] | { [date: string]: StockScreenerResult[] };
  totalMatches: number;
}

class ScreenerService extends BaseApiService {
  private baseUrl = "/api/screeners";

  async getScreeners(params?: { page?: number; limit?: number }) {
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
      screeners: Screener[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
      };
    }>(url);
  }

  async getScreenerById(id: number, date?: string) {
    const queryParams = new URLSearchParams();
    if (date) {
      queryParams.append("date", date);
    }

    const url = queryParams.toString()
      ? `${this.baseUrl}/${id}?${queryParams}`
      : `${this.baseUrl}/${id}`;

    return this.request<ScreenerResultsResponse>(url);
  }

  async createScreener(screenerData: {
    scanName: string;
    description?: string;
    sourceName: string;
    sourceUrl?: string;
  }) {
    return this.request<Screener>(this.baseUrl, {
      method: "POST",
      body: JSON.stringify(screenerData),
    });
  }

  async updateScreener(
    id: number,
    screenerData: {
      scanName?: string;
      description?: string;
      sourceName?: string;
      sourceUrl?: string;
      isActive?: boolean;
    }
  ) {
    return this.request<Screener>(`${this.baseUrl}/${id}`, {
      method: "PUT",
      body: JSON.stringify(screenerData),
    });
  }

  async deleteScreener(id: number) {
    return this.request<{ message: string }>(`${this.baseUrl}/${id}`, {
      method: "DELETE",
    });
  }

  async getScreenerResults(
    id: number,
    params?: {
      fromDate?: string;
      toDate?: string;
      limit?: number;
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
      ? `${this.baseUrl}/${id}/results?${queryParams}`
      : `${this.baseUrl}/${id}/results`;

    return this.request<ScreenerResultsResponse>(url);
  }

  async getScreenerDates(id: number) {
    return this.request<string[]>(`${this.baseUrl}/${id}/dates`);
  }
}

export const screenerService = new ScreenerService();
