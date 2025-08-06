const API_BASE_URL = 'http://localhost:3001/api'

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

class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    return response.json()
  }

  // Trade endpoints
  async getTrades(): Promise<Trade[]> {
    return this.request<Trade[]>('/trades')
  }

  async addTrade(trade: Omit<Trade, 'id'>, images: TradeImage[]): Promise<{ id: number }> {
    return this.request<{ id: number }>('/trades', {
      method: 'POST',
      body: JSON.stringify({ trade, images }),
    })
  }

  // Strategy endpoints
  async getStrategies(): Promise<Strategy[]> {
    return this.request<Strategy[]>('/strategies')
  }

  async addStrategy(name: string): Promise<{ id: number }> {
    return this.request<{ id: number }>('/strategies', {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
  }

  async deleteStrategy(id: number): Promise<void> {
    await this.request(`/strategies/${id}`, {
      method: 'DELETE',
    })
  }

  // Tag endpoints
  async getTags(): Promise<Tag[]> {
    return this.request<Tag[]>('/tags')
  }

  async addTag(name: string): Promise<{ id: number }> {
    return this.request<{ id: number }>('/tags', {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
  }

  async deleteTag(id: number): Promise<void> {
    await this.request(`/tags/${id}`, {
      method: 'DELETE',
    })
  }
}

export const apiClient = new ApiClient() 