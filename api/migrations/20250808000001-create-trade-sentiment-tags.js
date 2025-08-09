"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("TradeSentimentTags", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      tradeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Trades",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      tagId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Tags",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
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

    // Add unique constraint to prevent duplicate tags for same trade
    await queryInterface.addIndex("TradeSentimentTags", ["tradeId", "tagId"], {
      unique: true,
      name: "trade_sentiment_tags_unique",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("TradeSentimentTags");
  },
};
