"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("symbols", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      bse: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      nse: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
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

    // Add indexes
    await queryInterface.addIndex("symbols", ["bse"], {
      unique: true,
      where: {
        bse: { [Sequelize.Op.ne]: null },
      },
      name: "symbols_bse_unique_index",
    });

    await queryInterface.addIndex("symbols", ["nse"], {
      unique: true,
      where: {
        nse: { [Sequelize.Op.ne]: null },
      },
      name: "symbols_nse_unique_index",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("symbols");
  },
};
