import React, { useState, useEffect } from 'react'
import { apiClient, Trade } from '../services/api'
import './Dashboard.css'

const Dashboard: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTrades()
  }, [])

  const loadTrades = async () => {
    try {
      const tradesData = await apiClient.getTrades()
      setTrades(tradesData)
    } catch (error) {
      console.error('Failed to load trades:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTotalValue = () => {
    return trades.reduce((total, trade) => total + (trade.quantity * trade.price), 0)
  }

  const getRecentTrades = () => {
    return trades.slice(0, 5)
  }

  if (loading) {
    return <div className="dashboard">Loading...</div>
  }

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Trades</h3>
          <p className="stat-value">{trades.length}</p>
        </div>
        <div className="stat-card">
          <h3>Total Value</h3>
          <p className="stat-value">₹{calculateTotalValue().toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <h3>Average Price</h3>
          <p className="stat-value">
            ₹{trades.length > 0 ? (calculateTotalValue() / trades.length).toFixed(2) : '0'}
          </p>
        </div>
      </div>

      <div className="recent-trades">
        <h3>Recent Trades</h3>
        {getRecentTrades().length > 0 ? (
          <div className="trades-list">
            {getRecentTrades().map(trade => (
              <div key={trade.id} className="trade-card">
                <div className="trade-header">
                  <span className="symbol">{trade.symbol}</span>
                  <span className="date">{new Date(trade.date).toLocaleDateString()}</span>
                </div>
                <div className="trade-details">
                  <span>Qty: {trade.quantity}</span>
                  <span>Price: ₹{trade.price}</span>
                  <span>Strategy: {trade.strategy_name || 'N/A'}</span>
                </div>
                {trade.notes && (
                  <div className="trade-notes">{trade.notes}</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>No trades yet. Add your first trade!</p>
        )}
      </div>
    </div>
  )
}

export default Dashboard 