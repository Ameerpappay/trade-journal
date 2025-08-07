"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "symbols",
      [
        {
          bse: "500325",
          nse: "RELIANCE",
          name: "Reliance Industries Limited",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          bse: "532540",
          nse: "TCS",
          name: "Tata Consultancy Services Limited",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          bse: "500034",
          nse: "HDFCBANK",
          name: "HDFC Bank Limited",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          bse: "500180",
          nse: "HCLTECH",
          name: "HCL Technologies Limited",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          bse: "507685",
          nse: "WIPRO",
          name: "Wipro Limited",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          bse: "500209",
          nse: "INFY",
          name: "Infosys Limited",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          bse: "532174",
          nse: "ICICIBANK",
          name: "ICICI Bank Limited",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          bse: "500875",
          nse: "ITC",
          name: "ITC Limited",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          bse: "500696",
          nse: "HINDUNILVR",
          name: "Hindustan Unilever Limited",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          bse: "532281",
          nse: "HDFCLIFE",
          name: "HDFC Life Insurance Company Limited",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("symbols", null, {});
  },
};
