"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Screener extends Model {
    static associate(models) {
      Screener.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
      });

      Screener.hasMany(models.StockScreenerResult, {
        foreignKey: "screenerId",
        as: "results",
      });

      // Many-to-many relationship with stocks through results
      Screener.belongsToMany(models.Stock, {
        through: models.StockScreenerResult,
        foreignKey: "screenerId",
        otherKey: "stockId",
        as: "stocks",
      });
    }
  }

  Screener.init(
    {
      scanName: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: "scan_name",
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      sourceName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "source_name",
      },
      sourceUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "source_url",
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
    },
    {
      sequelize,
      modelName: "Screener",
      tableName: "Screeners",
    }
  );

  return Screener;
};
