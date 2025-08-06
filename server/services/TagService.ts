import { Database } from 'better-sqlite3'
import { Tag } from '../types/Trade'

export class TagService {
  private db: Database

  constructor() {
    this.db = new Database('mydb.sqlite3')
  }

  async getAllTags(): Promise<Tag[]> {
    return this.db.prepare('SELECT * FROM tags ORDER BY name').all()
  }

  async addTag(name: string): Promise<number> {
    const result = this.db.prepare('INSERT INTO tags (name) VALUES (?)').run(name)
    return result.lastInsertRowid as number
  }

  async deleteTag(id: number): Promise<void> {
    this.db.prepare('DELETE FROM tags WHERE id = ?').run(id)
  }
} 