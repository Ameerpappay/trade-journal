module.exports = (sequelize, DataTypes) => {
  const Tag = sequelize.define("Tag", {
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.TEXT },
    type: {
      type: DataTypes.ENUM("image", "sentiment"),
      allowNull: false,
      defaultValue: "image",
    },
    userId: { type: DataTypes.INTEGER, allowNull: true },
  });

  Tag.associate = function (models) {
    // Tag belongs to User
    Tag.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
  };

  return Tag;
};
