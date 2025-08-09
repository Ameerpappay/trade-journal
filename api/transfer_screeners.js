const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Database paths
const stockTrackerDbPath = path.join(
  __dirname,
  "..",
  "StockTracker",
  "src",
  "database",
  "stocktracker.db"
);
const tradeJournalDbPath = path.join(
  __dirname,
  "database",
  "trade-journal.sqlite"
);

console.log("StockTracker DB path:", stockTrackerDbPath);
console.log("Trade Journal DB path:", tradeJournalDbPath);

// Connect to databases
const stockTrackerDb = new sqlite3.Database(
  stockTrackerDbPath,
  sqlite3.OPEN_READONLY,
  (err) => {
    if (err) {
      console.error("Error opening StockTracker database:", err);
      return;
    }
    console.log("Connected to StockTracker database (read-only)");
  }
);

const tradeJournalDb = new sqlite3.Database(tradeJournalDbPath, (err) => {
  if (err) {
    console.error("Error opening trade journal database:", err);
    return;
  }
  console.log("Connected to trade journal database");
});

// Function to get all screeners from StockTracker
function getStockTrackerScreeners() {
  return new Promise((resolve, reject) => {
    stockTrackerDb.all(
      "SELECT * FROM screeners ORDER BY scan_name",
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

// Function to check if screeners table exists in trade journal
function checkScreenersTable() {
  return new Promise((resolve, reject) => {
    tradeJournalDb.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='screeners'",
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(!!row);
        }
      }
    );
  });
}

// Function to create screeners table in trade journal
function createScreenersTable() {
  return new Promise((resolve, reject) => {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS screeners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scan_name TEXT UNIQUE NOT NULL,
        description TEXT,
        source_name TEXT NOT NULL,
        source_url TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    tradeJournalDb.run(createTableSQL, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log(
          "Screeners table created or already exists in trade journal"
        );
        resolve();
      }
    });
  });
}

// Function to insert screener into trade journal
function insertScreener(screener) {
  return new Promise((resolve, reject) => {
    const insertSQL = `
      INSERT OR REPLACE INTO screeners (scan_name, description, source_name, source_url, is_active, createdAt, updatedAt) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    tradeJournalDb.run(
      insertSQL,
      [
        screener.scan_name,
        screener.description,
        screener.source_name,
        screener.source_url,
        screener.is_active,
        screener.created_at,
        new Date().toISOString(), // updatedAt
      ],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      }
    );
  });
}

// Function to get screeners count from trade journal
function getTradeJournalScreenersCount() {
  return new Promise((resolve, reject) => {
    tradeJournalDb.get(
      "SELECT COUNT(*) as count FROM screeners",
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count);
        }
      }
    );
  });
}

// Main execution
async function main() {
  try {
    console.log("\n--- Checking StockTracker screeners ---");

    // Get screeners from StockTracker
    const stockTrackerScreeners = await getStockTrackerScreeners();
    console.log(
      `Found ${stockTrackerScreeners.length} screeners in StockTracker:`
    );

    stockTrackerScreeners.forEach((screener, index) => {
      console.log(`${index + 1}. ${screener.scan_name}`);
      console.log(
        `   Description: ${screener.description || "No description"}`
      );
      console.log(`   Source: ${screener.source_name}`);
      console.log(`   URL: ${screener.source_url || "No URL"}`);
      console.log(`   Active: ${screener.is_active ? "Yes" : "No"}`);
      console.log(`   Created: ${screener.created_at}`);
      console.log("");
    });

    if (stockTrackerScreeners.length === 0) {
      console.log("No screeners found in StockTracker database");
      return;
    }

    console.log("\n--- Setting up trade journal database ---");

    // Check and create screeners table
    const screenersTableExists = await checkScreenersTable();
    console.log(
      "Screeners table exists in trade journal:",
      screenersTableExists
    );

    if (!screenersTableExists) {
      await createScreenersTable();
    }

    // Get current count
    const currentCount = await getTradeJournalScreenersCount();
    console.log(`Current screeners in trade journal: ${currentCount}`);

    console.log("\n--- Transferring screeners ---");

    let insertedCount = 0;
    let updatedCount = 0;

    for (const screener of stockTrackerScreeners) {
      try {
        const existingCount = await getTradeJournalScreenersCount();
        const id = await insertScreener(screener);
        const newCount = await getTradeJournalScreenersCount();

        if (newCount > existingCount) {
          console.log(
            `✅ Inserted screener: ${screener.scan_name} (ID: ${id})`
          );
          insertedCount++;
        } else {
          console.log(`🔄 Updated screener: ${screener.scan_name}`);
          updatedCount++;
        }
      } catch (err) {
        console.error(
          `❌ Failed to transfer screener ${screener.scan_name}:`,
          err.message
        );
      }
    }

    const finalCount = await getTradeJournalScreenersCount();

    console.log(`\n🎉 Transfer completed!`);
    console.log(`   Inserted: ${insertedCount} screeners`);
    console.log(`   Updated: ${updatedCount} screeners`);
    console.log(`   Total screeners in trade journal: ${finalCount}`);
  } catch (error) {
    console.error("Error during transfer:", error);
  } finally {
    // Close database connections
    stockTrackerDb.close((err) => {
      if (err) console.error("Error closing StockTracker database:", err);
      else console.log("StockTracker database connection closed");
    });

    tradeJournalDb.close((err) => {
      if (err) console.error("Error closing trade journal database:", err);
      else console.log("Trade journal database connection closed");
    });
  }
}

main();
