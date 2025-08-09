"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add userId to Trades table
    await queryInterface.addColumn("Trades", "userId", {
      type: Sequelize.INTEGER,
      allowNull: true, // Allow null initially for existing records
      references: {
        model: "Users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    // Add userId to Strategies table
    await queryInterface.addColumn("Strategies", "userId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    // Add userId to Tags table
    await queryInterface.addColumn("Tags", "userId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    // Add userId to Portfolios table
    await queryInterface.addColumn("Portfolios", "userId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE", // Delete portfolios when user is deleted
    });

    // Add userId to Symbols table
    await queryInterface.addColumn("Symbols", "userId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    // Add indexes for performance
    await queryInterface.addIndex("Trades", ["userId"]);
    await queryInterface.addIndex("Strategies", ["userId"]);
    await queryInterface.addIndex("Tags", ["userId"]);
    await queryInterface.addIndex("Portfolios", ["userId"]);
    await queryInterface.addIndex("Symbols", ["userId"]);
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes
    await queryInterface.removeIndex("Trades", ["userId"]);
    await queryInterface.removeIndex("Strategies", ["userId"]);
    await queryInterface.removeIndex("Tags", ["userId"]);
    await queryInterface.removeIndex("Portfolios", ["userId"]);
    await queryInterface.removeIndex("Symbols", ["userId"]);

    // Remove columns
    await queryInterface.removeColumn("Trades", "userId");
    await queryInterface.removeColumn("Strategies", "userId");
    await queryInterface.removeColumn("Tags", "userId");
    await queryInterface.removeColumn("Portfolios", "userId");
    await queryInterface.removeColumn("Symbols", "userId");
  },
};
