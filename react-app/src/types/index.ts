export interface Portfolio {
  id: number;
  name: string;
  description?: string;
  rValue: number;
  capital: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  stats?: {
    totalTrades: number;
    totalHoldings: number;
    totalInvested: number;
    availableCapital: number;
  };
}

export interface PortfolioFormData {
  name: string;
  description?: string;
  rValue: number;
  capital: number;
  isActive?: boolean;
}

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
  type: "image" | "sentiment";
  createdAt?: string;
  updatedAt?: string;
}

export interface Symbol {
  id: number;
  bse?: string;
  nse?: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SymbolFormData {
  bse?: string;
  nse?: string;
  name: string;
}

export interface SymbolUploadResponse {
  message: string;
  created: number;
  skipped: number;
  total: number;
  excelDuplicatesSkipped?: number;
  databaseDuplicatesSkipped?: number;
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
  portfolioId?: number;
  images: TradeImageData[];
  sentimentTagIds?: number[];
}

export interface Trade extends TradeFormData {
  id: number;
  createdAt: string;
  updatedAt: string;
  Strategy?: Strategy;
  Portfolio?: Portfolio;
  Images?: Array<{
    id: number;
    filePath: string;
    tagId: number;
    Tag?: Tag;
  }>;
  SentimentTags?: Tag[];
}

export interface Holding {
  id: number;
  symbol: string;
  quantity: number;
  averagePrice: number;
  lastTradeId?: number;
  portfolioId?: number;
  createdAt: string;
  updatedAt: string;
  Portfolio?: Portfolio;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
