module.exports = (sequelize, DataTypes) => {
  const Portfolio = sequelize.define("Portfolio", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
    },
    rValue: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0.1,
        max: 100,
      },
    },
    capital: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    userId: { type: DataTypes.INTEGER, allowNull: true },
  });

  Portfolio.associate = function (models) {
    // Portfolio belongs to User
    Portfolio.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
  };

  return Portfolio;
};
