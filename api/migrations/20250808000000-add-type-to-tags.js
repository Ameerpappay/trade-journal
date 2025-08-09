"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Tags", "type", {
      type: Sequelize.ENUM("image", "sentiment"),
      allowNull: false,
      defaultValue: "image",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Tags", "type");
  },
};
