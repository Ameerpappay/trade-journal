module.exports = (sequelize, DataTypes) => {
  const Strategy = sequelize.define("Strategy", {
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.TEXT },
    userId: { type: DataTypes.INTEGER, allowNull: true },
  });

  Strategy.associate = function (models) {
    // Strategy belongs to User
    Strategy.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
  };

  return Strategy;
};
