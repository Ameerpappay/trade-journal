"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "Tags",
      [
        {
          name: "Entry",
          description: "Trade entry screenshots and analysis",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Exit",
          description: "Trade exit screenshots and analysis",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Chart Analysis",
          description: "Technical analysis charts and indicators",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "News",
          description: "Related news and fundamental analysis",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Setup",
          description: "Trading setup and pre-market analysis",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Stop Loss",
          description: "Stop loss placement and risk management",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Profit Target",
          description: "Take profit levels and targets",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Tags", null, {});
  },
};
