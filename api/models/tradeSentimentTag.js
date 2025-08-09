module.exports = (sequelize, DataTypes) => {
  return sequelize.define("TradeSentimentTag", {
    tradeId: { type: DataTypes.INTEGER, allowNull: false },
    tagId: { type: DataTypes.INTEGER, allowNull: false },
  });
};
