import { Holding, Trade } from "../../types";
import { BaseApiService } from "./baseService";

class HoldingService extends BaseApiService {
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
}

export const holdingService = new HoldingService();
