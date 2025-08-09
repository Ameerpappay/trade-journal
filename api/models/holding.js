module.exports = (sequelize, DataTypes) => {
  return sequelize.define("Holding", {
    symbol: { type: DataTypes.STRING, allowNull: false },
    quantity: { type: DataTypes.FLOAT, allowNull: false },
    averagePrice: { type: DataTypes.FLOAT, allowNull: false },
    lastTradeId: { type: DataTypes.INTEGER },
    portfolioId: { type: DataTypes.INTEGER, allowNull: true },
  });
};
