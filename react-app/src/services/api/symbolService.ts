import { Symbol, SymbolFormData, SymbolUploadResponse } from "../../types";
import { BaseApiService } from "./baseService";

class SymbolService extends BaseApiService {
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

    const fullUrl = `${this.apiBaseUrl}/api/symbols/upload`;
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

export const symbolService = new SymbolService();
