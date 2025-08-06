import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { TradeService } from './services/TradeService'
import { StrategyService } from './services/StrategyService'
import { TagService } from './services/TagService'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

// Initialize services
const tradeService = new TradeService()
const strategyService = new StrategyService()
const tagService = new TagService()

// Trade routes
app.get('/api/trades', async (req, res) => {
  try {
    const trades = await tradeService.getAllTrades()
    res.json(trades)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trades' })
  }
})

app.post('/api/trades', async (req, res) => {
  try {
    const { trade, images } = req.body
    const tradeId = await tradeService.addTrade(trade, images)
    res.json({ id: tradeId })
  } catch (error) {
    res.status(500).json({ error: 'Failed to add trade' })
  }
})

// Strategy routes
app.get('/api/strategies', async (req, res) => {
  try {
    const strategies = await strategyService.getAllStrategies()
    res.json(strategies)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch strategies' })
  }
})

app.post('/api/strategies', async (req, res) => {
  try {
    const { name } = req.body
    const strategyId = await strategyService.addStrategy(name)
    res.json({ id: strategyId })
  } catch (error) {
    res.status(500).json({ error: 'Failed to add strategy' })
  }
})

app.delete('/api/strategies/:id', async (req, res) => {
  try {
    const { id } = req.params
    await strategyService.deleteStrategy(parseInt(id))
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete strategy' })
  }
})

// Tag routes
app.get('/api/tags', async (req, res) => {
  try {
    const tags = await tagService.getAllTags()
    res.json(tags)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tags' })
  }
})

app.post('/api/tags', async (req, res) => {
  try {
    const { name } = req.body
    const tagId = await tagService.addTag(name)
    res.json({ id: tagId })
  } catch (error) {
    res.status(500).json({ error: 'Failed to add tag' })
  }
})

app.delete('/api/tags/:id', async (req, res) => {
  try {
    const { id } = req.params
    await tagService.deleteTag(parseInt(id))
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete tag' })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
}) 