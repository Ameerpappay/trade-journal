"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class StockScreenerResult extends Model {
    static associate(models) {
      StockScreenerResult.belongsTo(models.Stock, {
        foreignKey: "stockId",
        as: "stock",
      });

      StockScreenerResult.belongsTo(models.Screener, {
        foreignKey: "screenerId",
        as: "screener",
      });
    }
  }

  StockScreenerResult.init(
    {
      stockId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "stock_id",
      },
      screenerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "screener_id",
      },
      isMatch: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: "is_match",
      },
      scanDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: "scan_date",
      },
    },
    {
      sequelize,
      modelName: "StockScreenerResult",
      tableName: "StockScreenerResults",
      timestamps: false,
      createdAt: "createdAt",
      updatedAt: false,
    }
  );

  return StockScreenerResult;
};
