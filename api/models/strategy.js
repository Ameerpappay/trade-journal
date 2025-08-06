module.exports = (sequelize, DataTypes) => {
  return sequelize.define("Strategy", {
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.TEXT },
  });
};
