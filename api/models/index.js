const sequelize = require("../config/database");
const { DataTypes } = require("sequelize");

// Import models
const Trade = require("./trade")(sequelize, DataTypes);
const Strategy = require("./strategy")(sequelize, DataTypes);
const Tag = require("./tag")(sequelize, DataTypes);
const Image = require("./image")(sequelize, DataTypes);
const Holding = require("./holding")(sequelize, DataTypes);
const Symbol = require("./symbol")(sequelize, DataTypes);

// Associations
Strategy.hasMany(Trade);
Trade.belongsTo(Strategy);

Trade.hasMany(Image);
Image.belongsTo(Trade);

Tag.hasMany(Image);
Image.belongsTo(Tag);

// Holdings logic will be handled in code, not as a direct association

module.exports = {
  sequelize,
  Trade,
  Strategy,
  Tag,
  Image,
  Holding,
  Symbol,
};
