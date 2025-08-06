module.exports = (sequelize, DataTypes) => {
  return sequelize.define("Tag", {
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.TEXT },
  });
};
