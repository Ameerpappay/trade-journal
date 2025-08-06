import { Database } from 'better-sqlite3'
import { Trade, TradeImage } from '../types/Trade'

export class TradeService {
  private db: Database

  constructor() {
    this.db = new Database('mydb.sqlite3')
  }

  async getAllTrades(): Promise<Trade[]> {
    const trades = this.db.prepare(`
      SELECT t.*, s.name as strategy_name
      FROM trades t
      LEFT JOIN strategies s ON t.strategy_id = s.id
      ORDER BY t.date DESC
    `).all()

    // Get images for each trade
    const tradesWithImages = trades.map(trade => ({
      ...trade,
      images: this.getTradeImages(trade.id)
    }))

    return tradesWithImages
  }

  async addTrade(trade: Omit<Trade, 'id'>, images: TradeImage[]): Promise<number> {
    const result = this.db.prepare(`
      INSERT INTO trades (symbol, date, quantity, price, notes, strategy_id) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      trade.symbol,
      trade.date,
      trade.quantity,
      trade.price,
      trade.notes || '',
      trade.strategy_id
    )

    const tradeId = result.lastInsertRowid as number

    // Insert images
    if (images && images.length > 0) {
      const insertImage = this.db.prepare(`
        INSERT INTO images (trade_id, path, tag_id) VALUES (?, ?, ?)
      `)
      
      images.forEach(img => {
        insertImage.run(tradeId, img.path, img.tag_id)
      })
    }

    return tradeId
  }

  private getTradeImages(tradeId: number): TradeImage[] {
    return this.db.prepare(`
      SELECT i.*, t.name as tag_name
      FROM images i
      LEFT JOIN tags t ON i.tag_id = t.id
      WHERE i.trade_id = ?
    `).all(tradeId)
  }
} 