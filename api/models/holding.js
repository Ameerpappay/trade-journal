module.exports = (sequelize, DataTypes) => {
  return sequelize.define("Holding", {
    symbol: { type: DataTypes.STRING, allowNull: false, unique: true },
    quantity: { type: DataTypes.FLOAT, allowNull: false },
    averagePrice: { type: DataTypes.FLOAT, allowNull: false },
    lastTradeId: { type: DataTypes.INTEGER },
  });
};
