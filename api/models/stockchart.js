"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class StockChart extends Model {
    static associate(models) {
      StockChart.belongsTo(models.Stock, {
        foreignKey: "stockId",
        as: "stock",
      });
    }
  }

  StockChart.init(
    {
      stockId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "stock_id",
      },
      chartType: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "chart_type", // 'daily', 'weekly', 'monthly'
      },
      chartRange: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "chart_range", // '121', '504', etc.
      },
      filePath: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "file_path",
      },
      fileSize: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "file_size",
      },
    },
    {
      sequelize,
      modelName: "StockChart",
      tableName: "StockCharts",
      timestamps: false,
      createdAt: "createdAt",
      updatedAt: false,
    }
  );

  return StockChart;
};
