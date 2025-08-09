import { Portfolio, PortfolioFormData } from "../../types";
import { BaseApiService } from "./baseService";

class PortfolioService extends BaseApiService {
  async getPortfolios(): Promise<Portfolio[]> {
    return this.request<Portfolio[]>("/api/portfolios");
  }

  async getActivePortfolio(): Promise<Portfolio> {
    return this.request<Portfolio>("/api/portfolios/current/active");
  }

  async createPortfolio(portfolioData: PortfolioFormData): Promise<Portfolio> {
    return this.request<Portfolio>("/api/portfolios", {
      method: "POST",
      body: JSON.stringify(portfolioData),
    });
  }

  async updatePortfolio(
    id: number,
    portfolioData: PortfolioFormData
  ): Promise<Portfolio> {
    return this.request<Portfolio>(`/api/portfolios/${id}`, {
      method: "PUT",
      body: JSON.stringify(portfolioData),
    });
  }

  async deletePortfolio(id: number): Promise<void> {
    return this.request<void>(`/api/portfolios/${id}`, {
      method: "DELETE",
    });
  }
}

export const portfolioService = new PortfolioService();
