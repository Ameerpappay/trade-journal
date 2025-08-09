module.exports = (sequelize, DataTypes) => {
  const Symbol = sequelize.define(
    "Symbol",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      bse: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: {
          name: "symbols_bse_unique",
          msg: "BSE code already exists",
        },
      },
      nse: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: {
          name: "symbols_nse_unique",
          msg: "NSE code already exists",
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      userId: { type: DataTypes.INTEGER, allowNull: true },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "symbols",
      validate: {
        atLeastOneCode() {
          if (!this.bse && !this.nse) {
            throw new Error("At least one of BSE or NSE code must be provided");
          }
        },
      },
      indexes: [
        {
          unique: true,
          fields: ["bse"],
          where: {
            bse: { [sequelize.Sequelize.Op.ne]: null },
          },
          name: "symbols_bse_unique_index",
        },
        {
          unique: true,
          fields: ["nse"],
          where: {
            nse: { [sequelize.Sequelize.Op.ne]: null },
          },
          name: "symbols_nse_unique_index",
        },
      ],
    }
  );

  Symbol.associate = function (models) {
    // Symbol belongs to User
    Symbol.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
  };

  return Symbol;
};
