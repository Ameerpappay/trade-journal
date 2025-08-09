"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class StockPrice extends Model {
    static associate(models) {
      StockPrice.belongsTo(models.Stock, {
        foreignKey: "stockId",
        as: "stock",
      });
    }
  }

  StockPrice.init(
    {
      stockId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "stock_id",
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      open: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: true,
      },
      high: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: true,
      },
      low: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: true,
      },
      close: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: false,
      },
      volume: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "StockPrice",
      tableName: "StockPrices",
      timestamps: false,
      createdAt: "createdAt",
      updatedAt: false,
    }
  );

  return StockPrice;
};
