export interface Strategy {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Tag {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TradeImageData {
  filePath: string;
  tagId: number;
}

export interface TradeFormData {
  symbol: string;
  date: string;
  entryPrice: number;
  quantity: number;
  stoploss?: number;
  notes?: string;
  type: "buy" | "sell";
  strategyId: number;
  images: TradeImageData[];
}

export interface Trade extends TradeFormData {
  id: number;
  createdAt: string;
  updatedAt: string;
  Strategy?: Strategy;
  Images?: Array<{
    id: number;
    filePath: string;
    tagId: number;
    Tag?: Tag;
  }>;
}

export interface Holding {
  id: number;
  symbol: string;
  quantity: number;
  averagePrice: number;
  lastTradeId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
