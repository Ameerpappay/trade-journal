import { Database } from 'better-sqlite3'
import { Strategy } from '../types/Trade'

export class StrategyService {
  private db: Database

  constructor() {
    this.db = new Database('mydb.sqlite3')
  }

  async getAllStrategies(): Promise<Strategy[]> {
    return this.db.prepare('SELECT * FROM strategies ORDER BY name').all()
  }

  async addStrategy(name: string): Promise<number> {
    const result = this.db.prepare('INSERT INTO strategies (name) VALUES (?)').run(name)
    return result.lastInsertRowid as number
  }

  async deleteStrategy(id: number): Promise<void> {
    this.db.prepare('DELETE FROM strategies WHERE id = ?').run(id)
  }
} 