"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "Portfolios",
      [
        {
          name: "Main Portfolio",
          description: "Default trading portfolio",
          rValue: 2.0,
          capital: 50000.0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Conservative Portfolio",
          description: "Low risk conservative trading approach",
          rValue: 1.0,
          capital: 25000.0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Aggressive Portfolio",
          description: "High risk high reward trading strategy",
          rValue: 3.0,
          capital: 15000.0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Portfolios", null, {});
  },
};
