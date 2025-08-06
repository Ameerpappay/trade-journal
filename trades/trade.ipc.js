const { ipcMain } = require('electron');
const Database = require('better-sqlite3');
const db = new Database('mydb.sqlite3');

ipcMain.handle('get-trades', () => {
    return db.prepare(`
        SELECT t.*
        FROM trades t
        LEFT JOIN strategies s ON t.strategy_id = s.id
    `).all();
});

ipcMain.handle('add-trade', (event, trade, images) => {
    const result = db.prepare(
        'INSERT INTO trades (symbol, date, quantity, price, notes,strategy_id) VALUES (?, ?, ?, ?, ?,?)'
    ).run(trade.symbol, trade.date, trade.quantity, trade.price, trade.notes, trade.strategy);
    const tradeId = result.lastInsertRowid;

    // Insert each image with its tag_id
    const insertImage = db.prepare(
        'INSERT INTO images (trade_id, path, tag_id) VALUES (?, ?, ?)'
    );
    images.forEach(img => {
        insertImage.run(tradeId, img.path, img.tag_id);
    });

    return tradeId;
});