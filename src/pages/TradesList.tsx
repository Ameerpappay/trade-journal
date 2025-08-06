import React, { useState, useEffect } from "react";
import { apiClient, Trade } from "../services/api";
import "./TradesList.css";

const TradesList: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrades();
  }, []);

  const loadTrades = async () => {
    try {
      const tradesData = await apiClient.getTrades();
      setTrades(tradesData);
    } catch (error) {
      console.error("Failed to load trades:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="trades-list-page">Loading...</div>;
  }

  return (
    <div className="trades-list-page">
      <h2>All Trades</h2>

      {trades.length > 0 ? (
        <div className="trades-grid">
          {trades.map((trade) => (
            <div key={trade.id} className="trade-item">
              <div className="trade-header">
                <span className="symbol">{trade.symbol}</span>
                <span className="date">
                  {new Date(trade.date).toLocaleDateString()}
                </span>
              </div>
              <div className="trade-details">
                <div className="detail-row">
                  <span className="label">Quantity:</span>
                  <span className="value">{trade.quantity}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Price:</span>
                  <span className="value">₹{trade.price}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Total Value:</span>
                  <span className="value">
                    ₹{(trade.quantity * trade.price).toLocaleString()}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Strategy:</span>
                  <span className="value">{trade.strategy_name || "N/A"}</span>
                </div>
              </div>
              {trade.notes && (
                <div className="trade-notes">
                  <span className="label">Notes:</span>
                  <p>{trade.notes}</p>
                </div>
              )}
              {trade.images && trade.images.length > 0 && (
                <div className="trade-images">
                  <span className="label">Images:</span>
                  <div className="images-list">
                    {trade.images.map((image, index) => (
                      <span key={index} className="image-tag">
                        {image.path} ({image.tag_name})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No trades found. Add your first trade to get started!</p>
        </div>
      )}
    </div>
  );
};

export default TradesList;
