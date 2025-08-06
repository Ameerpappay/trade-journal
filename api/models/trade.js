module.exports = (sequelize, DataTypes) => {
  return sequelize.define("Trade", {
    symbol: { type: DataTypes.STRING, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    entryPrice: { type: DataTypes.FLOAT, allowNull: false },
    quantity: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 1 },
    stoploss: { type: DataTypes.FLOAT },
    notes: { type: DataTypes.TEXT },
    type: {
      type: DataTypes.ENUM("buy", "sell"),
      allowNull: false,
      defaultValue: "buy",
    },
    strategyId: { type: DataTypes.INTEGER, allowNull: false },
  });
};
