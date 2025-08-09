"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Portfolios", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      rValue: {
        type: Sequelize.FLOAT,
        allowNull: false,
        comment: "Risk percentage per trade (e.g., 2.0 for 2%)",
        validate: {
          min: 0.1,
          max: 100,
        },
      },
      capital: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        comment: "Total capital allocated to this portfolio",
        validate: {
          min: 0,
        },
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Portfolios");
  },
};
