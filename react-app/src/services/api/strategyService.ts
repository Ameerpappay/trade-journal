import { Strategy } from "../../types";
import { BaseApiService } from "./baseService";

class StrategyService extends BaseApiService {
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
}

export const strategyService = new StrategyService();
