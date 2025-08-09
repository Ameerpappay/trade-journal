"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create stocks table (enhanced version of StockTracker's stocks)
    await queryInterface.createTable("Stocks", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      bseCode: {
        type: Sequelize.STRING,
        allowNull: true,
        field: "bse_code",
      },
      nseCode: {
        type: Sequelize.STRING,
        allowNull: true,
        field: "nse_code",
      },
      stockName: {
        type: Sequelize.STRING,
        allowNull: false,
        field: "stock_name",
      },
      industry: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      currentPrice: {
        type: Sequelize.DECIMAL(15, 4),
        allowNull: true,
        field: "current_price",
      },
      dayChange: {
        type: Sequelize.DECIMAL(15, 4),
        allowNull: true,
        field: "day_change",
      },
      dayChangePercent: {
        type: Sequelize.DECIMAL(8, 4),
        allowNull: true,
        field: "day_change_percent",
      },
      volume: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      marketCap: {
        type: Sequelize.BIGINT,
        allowNull: true,
        field: "market_cap",
      },
      pe: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      pb: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        field: "user_id",
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: "is_active",
      },
      lastUpdated: {
        type: Sequelize.DATE,
        allowNull: true,
        field: "last_updated",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Create screeners table
    await queryInterface.createTable("Screeners", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      scanName: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        field: "scan_name",
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      sourceName: {
        type: Sequelize.STRING,
        allowNull: false,
        field: "source_name",
      },
      sourceUrl: {
        type: Sequelize.STRING,
        allowNull: true,
        field: "source_url",
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        field: "user_id",
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: "is_active",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Create stock_screener_results table (many-to-many)
    await queryInterface.createTable("StockScreenerResults", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      stockId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Stocks",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        field: "stock_id",
      },
      screenerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Screeners",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        field: "screener_id",
      },
      isMatch: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: "is_match",
      },
      scanDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        field: "scan_date",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Create stock_charts table
    await queryInterface.createTable("StockCharts", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      stockId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Stocks",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        field: "stock_id",
      },
      chartType: {
        type: Sequelize.STRING,
        allowNull: false,
        field: "chart_type", // 'daily', 'weekly', 'monthly'
      },
      chartRange: {
        type: Sequelize.STRING,
        allowNull: false,
        field: "chart_range", // '121', '504', etc.
      },
      filePath: {
        type: Sequelize.STRING,
        allowNull: false,
        field: "file_path",
      },
      fileSize: {
        type: Sequelize.INTEGER,
        allowNull: true,
        field: "file_size",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Create stock_prices table for historical data
    await queryInterface.createTable("StockPrices", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      stockId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Stocks",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        field: "stock_id",
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      open: {
        type: Sequelize.DECIMAL(15, 4),
        allowNull: true,
      },
      high: {
        type: Sequelize.DECIMAL(15, 4),
        allowNull: true,
      },
      low: {
        type: Sequelize.DECIMAL(15, 4),
        allowNull: true,
      },
      close: {
        type: Sequelize.DECIMAL(15, 4),
        allowNull: false,
      },
      volume: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Add indexes for performance
    await queryInterface.addIndex("Stocks", ["bse_code"]);
    await queryInterface.addIndex("Stocks", ["nse_code"]);
    await queryInterface.addIndex("Stocks", ["industry"]);
    await queryInterface.addIndex("Stocks", ["user_id"]);

    await queryInterface.addIndex("StockScreenerResults", ["stock_id"]);
    await queryInterface.addIndex("StockScreenerResults", ["screener_id"]);
    await queryInterface.addIndex("StockScreenerResults", ["scan_date"]);
    await queryInterface.addIndex(
      "StockScreenerResults",
      ["stock_id", "screener_id", "scan_date"],
      {
        unique: true,
      }
    );

    await queryInterface.addIndex("StockCharts", ["stock_id"]);
    await queryInterface.addIndex(
      "StockCharts",
      ["stock_id", "chart_type", "chart_range"],
      {
        unique: true,
      }
    );

    await queryInterface.addIndex("StockPrices", ["stock_id"]);
    await queryInterface.addIndex("StockPrices", ["date"]);
    await queryInterface.addIndex("StockPrices", ["stock_id", "date"], {
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("StockPrices");
    await queryInterface.dropTable("StockCharts");
    await queryInterface.dropTable("StockScreenerResults");
    await queryInterface.dropTable("Screeners");
    await queryInterface.dropTable("Stocks");
  },
};
