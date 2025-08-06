export interface Trade {
  id: number
  symbol: string
  date: string
  quantity: number
  price: number
  notes?: string
  strategy_id: number
  strategy_name?: string
  images?: TradeImage[]
}

export interface TradeImage {
  id?: number
  trade_id?: number
  path: string
  tag_id: number
  tag_name?: string
}

export interface Strategy {
  id: number
  name: string
}

export interface Tag {
  id: number
  name: string
} 