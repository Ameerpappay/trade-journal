const sequelize = require("../config/database");
const { DataTypes } = require("sequelize");

// Import models
const User = require("./user")(sequelize, DataTypes);
const Trade = require("./trade")(sequelize, DataTypes);
const Strategy = require("./strategy")(sequelize, DataTypes);
const Tag = require("./tag")(sequelize, DataTypes);
const Image = require("./image")(sequelize, DataTypes);
const Holding = require("./holding")(sequelize, DataTypes);
const Symbol = require("./symbol")(sequelize, DataTypes);
const TradeSentimentTag = require("./tradeSentimentTag")(sequelize, DataTypes);
const Portfolio = require("./portfolio")(sequelize, DataTypes);
const Screener = require("./screener")(sequelize, DataTypes);
const Stock = require("./stock")(sequelize, DataTypes);
const StockChart = require("./stockchart")(sequelize, DataTypes);
const StockPrice = require("./stockprice")(sequelize, DataTypes);
const StockScreenerResult = require("./stockscreenerresult")(
  sequelize,
  DataTypes
);

// Set up associations
const models = {
  User,
  Trade,
  Strategy,
  Tag,
  Image,
  Holding,
  Symbol,
  TradeSentimentTag,
  Portfolio,
  Screener,
  Stock,
  StockChart,
  StockPrice,
  StockScreenerResult,
};

// Call associate methods if they exist
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Legacy associations (keeping for backward compatibility)
Strategy.hasMany(Trade);
Trade.belongsTo(Strategy);

Portfolio.hasMany(Trade);
Trade.belongsTo(Portfolio);

Portfolio.hasMany(Holding);
Holding.belongsTo(Portfolio);

Trade.hasMany(Image);
Image.belongsTo(Trade);

Tag.hasMany(Image);
Image.belongsTo(Tag);

// Many-to-many relationship for trade sentiment tags
Trade.belongsToMany(Tag, {
  through: TradeSentimentTag,
  as: "SentimentTags",
  foreignKey: "tradeId",
  otherKey: "tagId",
});
Tag.belongsToMany(Trade, {
  through: TradeSentimentTag,
  as: "SentimentTrades",
  foreignKey: "tagId",
  otherKey: "tradeId",
});

module.exports = {
  sequelize,
  User,
  Trade,
  Strategy,
  Tag,
  Image,
  Holding,
  Symbol,
  TradeSentimentTag,
  Portfolio,
  Screener,
  Stock,
  StockChart,
  StockPrice,
  StockScreenerResult,
};
