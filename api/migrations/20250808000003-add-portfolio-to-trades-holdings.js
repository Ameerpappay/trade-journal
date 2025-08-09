"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add portfolioId to Trades table
    await queryInterface.addColumn("Trades", "portfolioId", {
      type: Sequelize.INTEGER,
      allowNull: true, // Allow null for existing trades
      references: {
        model: "Portfolios",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });

    // Add portfolioId to Holdings table
    await queryInterface.addColumn("Holdings", "portfolioId", {
      type: Sequelize.INTEGER,
      allowNull: true, // Allow null for existing holdings
      references: {
        model: "Portfolios",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Trades", "portfolioId");
    await queryInterface.removeColumn("Holdings", "portfolioId");
  },
};
