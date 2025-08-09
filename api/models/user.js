module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      googleId: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      avatar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true, // Null for Google OAuth users
      },
      role: {
        type: DataTypes.ENUM("user", "admin"),
        defaultValue: "user",
        allowNull: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "Users",
      timestamps: true,
    }
  );

  User.associate = function (models) {
    // User has many trades
    User.hasMany(models.Trade, {
      foreignKey: "userId",
      as: "trades",
    });

    // User has many strategies
    User.hasMany(models.Strategy, {
      foreignKey: "userId",
      as: "strategies",
    });

    // User has many tags
    User.hasMany(models.Tag, {
      foreignKey: "userId",
      as: "tags",
    });

    // User has many portfolios
    User.hasMany(models.Portfolio, {
      foreignKey: "userId",
      as: "portfolios",
    });

    // User has many symbols
    User.hasMany(models.Symbol, {
      foreignKey: "userId",
      as: "symbols",
    });
  };

  return User;
};
