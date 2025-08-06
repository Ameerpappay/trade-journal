function initializeDatabase(db) {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS strategies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS trades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol TEXT,
            date TEXT,
            quantity INTEGER,
            price REAL,
            notes TEXT,
            strategy_id INTEGER,
            FOREIGN KEY(strategy_id) REFERENCES strategies(id)
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trade_id INTEGER,
            path TEXT,
            tag_id INTEGER,
            FOREIGN KEY(trade_id) REFERENCES trades(id),
            FOREIGN KEY(tag_id) REFERENCES tags(id)
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE
        )
    `).run();
}

// Export the function for use in main.js
module.exports = { initializeDatabase };

// If run directly, initialize using a local db instance
if (require.main === module) {
    const Database = require('better-sqlite3');
    const db = new Database('mydb.sqlite3');
    initializeDatabase(db);
    console.log('Database initialized.');
}