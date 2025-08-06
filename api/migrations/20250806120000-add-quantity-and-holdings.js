"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add quantity column to Trades table
    await queryInterface.addColumn("Trades", "quantity", {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 1,
    });

    // Create Holdings table
    await queryInterface.createTable("Holdings", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      symbol: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      quantity: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      averagePrice: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      lastTradeId: {
        type: Sequelize.INTEGER,
        allowNull: true,
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
  },

  async down(queryInterface, Sequelize) {
    // Remove quantity column from Trades table
    await queryInterface.removeColumn("Trades", "quantity");

    // Drop Holdings table
    await queryInterface.dropTable("Holdings");
  },
};
