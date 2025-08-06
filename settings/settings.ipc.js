const { ipcMain } = require('electron');
const Database = require('better-sqlite3');
const db = new Database('mydb.sqlite3');

ipcMain.handle('get-tags', () => {
    return db.prepare('SELECT * FROM tags').all();
});
ipcMain.handle('add-tag', (event, name) => {
    try {
        const result = db.prepare('INSERT INTO tags (name) VALUES (?)').run(name);
        return { id: result.lastInsertRowid, name };
    } catch (e) {
        return { error: 'Tag already exists' };
    }
});
ipcMain.handle('delete-tag', (event, id) => {
    db.prepare('DELETE FROM tags WHERE id = ?').run(id);
    return true;
});

ipcMain.handle('get-strategies', () => {
    return db.prepare('SELECT * FROM strategies').all();
});

ipcMain.handle('add-strategy', (event, name) => {
    try {
        const result = db.prepare('INSERT INTO strategies (name) VALUES (?)').run(name);
        return { id: result.lastInsertRowid, name };
    } catch (e) {
        return { error: 'Strategy already exists' };
    }
});

ipcMain.handle('delete-strategy', (event, id) => {
    db.prepare('DELETE FROM strategies WHERE id = ?').run(id);
    // Optionally, set strategy_id to NULL in trades that used this strategy
    db.prepare('UPDATE trades SET strategy_id = NULL WHERE strategy_id = ?').run(id);
    return true;
});