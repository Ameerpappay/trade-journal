const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const { Sequelize, DataTypes } = require("sequelize");

// Path to StockTracker database
const stockTrackerDbPath = path.join(
  __dirname,
  "..",
  "StockTracker",
  "src",
  "database",
  "stocktracker.db"
);

// Path to trade journal database
const tradeJournalDbPath = path.join(
  __dirname,
  "database",
  "trade-journal.sqlite"
);

console.log("StockTracker DB path:", stockTrackerDbPath);
console.log("Trade Journal DB path:", tradeJournalDbPath);

// Connect to StockTracker database
const stockTrackerDb = new sqlite3.Database(stockTrackerDbPath, (err) => {
  if (err) {
    console.error("Error opening StockTracker database:", err);
    return;
  }
  console.log("Connected to StockTracker database");
});

// Connect to trade journal database using Sequelize
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: tradeJournalDbPath,
  logging: false,
});

// Define Symbol model
const Symbol = sequelize.define(
  "Symbol",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    source_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    source_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "symbols",
    timestamps: true,
  }
);

// Function to get screeners from StockTracker
function getStockTrackerScreeners() {
  return new Promise((resolve, reject) => {
    stockTrackerDb.all(
      "SELECT id, scan_name, description, source_name, source_url FROM screeners WHERE is_active = 1 ORDER BY scan_name",
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
}

// Main execution
async function main() {
  try {
    console.log("\n--- Connecting to trade journal database ---");
    await sequelize.authenticate();
    console.log("Trade journal database connection established");

    // Sync the Symbol model (create table if it doesn't exist)
    await Symbol.sync();
    console.log("Symbols table synced");

    console.log("\n--- Extracting screeners from StockTracker ---");

    // Get screeners from StockTracker
    const screeners = await getStockTrackerScreeners();
    console.log(`Found ${screeners.length} screeners in StockTracker:`);

    screeners.forEach((screener, index) => {
      console.log(
        `${index + 1}. ${screener.scan_name} - ${
          screener.description || "No description"
        } (Source: ${screener.source_name})`
      );
    });

    // Clear existing mock data first
    console.log("\n--- Removing existing mock screeners ---");
    const deletedCount = await Symbol.destroy({ where: {} });
    console.log(`Removed ${deletedCount} existing screeners`);

    // Insert each screener
    console.log("\n--- Inserting screeners into trade journal ---");
    let insertedCount = 0;

    for (const screener of screeners) {
      try {
        const symbol = await Symbol.create({
          name: screener.scan_name,
          description: screener.description,
          source_name: screener.source_name,
          source_url: screener.source_url,
        });
        console.log(
          `✅ Inserted screener: ${screener.scan_name} (ID: ${symbol.id})`
        );
        insertedCount++;
      } catch (err) {
        console.error(
          `❌ Failed to insert screener ${screener.scan_name}:`,
          err.message
        );
      }
    }

    console.log(
      `\n🎉 Successfully inserted ${insertedCount} out of ${screeners.length} screeners`
    );

    // Verify insertion
    const allSymbols = await Symbol.findAll({ order: [["name", "ASC"]] });
    console.log(
      `\n📊 Total screeners in trade journal database: ${allSymbols.length}`
    );
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Close database connections
    stockTrackerDb.close();
    await sequelize.close();
    console.log("\nDatabase connections closed");
  }
}

main();
