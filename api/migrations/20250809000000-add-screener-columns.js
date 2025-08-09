"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add description column
    await queryInterface.addColumn("symbols", "description", {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // Add source_name column
    await queryInterface.addColumn("symbols", "source_name", {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    // Add source_url column
    await queryInterface.addColumn("symbols", "source_url", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove the added columns
    await queryInterface.removeColumn("symbols", "description");
    await queryInterface.removeColumn("symbols", "source_name");
    await queryInterface.removeColumn("symbols", "source_url");
  },
};
