module.exports = (sequelize, DataTypes) => {
  return sequelize.define("Image", {
    filePath: { type: DataTypes.STRING, allowNull: false },
    tradeId: { type: DataTypes.INTEGER, allowNull: false },
    tagId: { type: DataTypes.INTEGER, allowNull: false },
  });
};
