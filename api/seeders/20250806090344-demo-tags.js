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
          type: "image",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Exit",
          description: "Trade exit screenshots and analysis",
          type: "image",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Chart Analysis",
          description: "Technical analysis charts and indicators",
          type: "image",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "News",
          description: "Related news and fundamental analysis",
          type: "image",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Setup",
          description: "Trading setup and pre-market analysis",
          type: "image",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Stop Loss",
          description: "Stop loss placement and risk management",
          type: "image",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Profit Target",
          description: "Take profit levels and targets",
          type: "image",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        // Sentiment tags
        {
          name: "Confident",
          description: "High confidence in the trade setup",
          type: "sentiment",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Uncertain",
          description: "Uncertain about the trade outcome",
          type: "sentiment",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "FOMO",
          description: "Fear of missing out on the trade",
          type: "sentiment",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Revenge Trading",
          description: "Trading to recover from previous losses",
          type: "sentiment",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Patient",
          description: "Waiting for the right setup patiently",
          type: "sentiment",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Stressed",
          description: "Feeling stressed about the market or trade",
          type: "sentiment",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Disciplined",
          description: "Following trading plan and rules strictly",
          type: "sentiment",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Greedy",
          description: "Being greedy and not taking profits",
          type: "sentiment",
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
