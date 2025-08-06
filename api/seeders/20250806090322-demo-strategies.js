"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "Strategies",
      [
        {
          name: "Scalping",
          description: "Quick trades for small profits within minutes",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Swing Trading",
          description: "Medium-term trades held for days to weeks",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Day Trading",
          description: "Intraday trades opened and closed within the same day",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Long Term Hold",
          description: "Buy and hold strategy for months or years",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Breakout Trading",
          description:
            "Trading on price breakouts from support/resistance levels",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Strategies", null, {});
  },
};
