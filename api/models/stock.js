"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Stock extends Model {
    static associate(models) {
      // Define associations here
      Stock.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
      });

      Stock.hasMany(models.StockScreenerResult, {
        foreignKey: "stockId",
        as: "screenerResults",
      });

      Stock.hasMany(models.StockChart, {
        foreignKey: "stockId",
        as: "charts",
      });

      Stock.hasMany(models.StockPrice, {
        foreignKey: "stockId",
        as: "prices",
      });

      // Association with trades through symbol matching
      Stock.hasMany(models.Trade, {
        foreignKey: "symbol",
        sourceKey: "nseCode",
        as: "trades",
      });
    }
  }

  Stock.init(
    {
      bseCode: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "bse_code",
      },
      nseCode: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "nse_code",
      },
      stockName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "stock_name",
      },
      industry: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      currentPrice: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: true,
        field: "current_price",
      },
      dayChange: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: true,
        field: "day_change",
      },
      dayChangePercent: {
        type: DataTypes.DECIMAL(8, 4),
        allowNull: true,
        field: "day_change_percent",
      },
      volume: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      marketCap: {
        type: DataTypes.BIGINT,
        allowNull: true,
        field: "market_cap",
      },
      pe: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      pb: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "user_id",
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: "is_active",
      },
      lastUpdated: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "last_updated",
      },
    },
    {
      sequelize,
      modelName: "Stock",
      tableName: "Stocks",
    }
  );

  return Stock;
};
