const sqlite3 = require('sqlite3').verbose();

// Функция для проверки существования колонки в таблице
function checkColumnExists(db, tableName, columnName, callback) {
  const query = `
    PRAGMA table_info(${tableName})
  `;

  db.all(query, (err, rows) => {
    if (err) {
      console.error(`Ошибка при проверке существования колонки: ${err.message}`);
      callback(err, false);
    } else {
      const columnExists = rows.some((row) => row.name === columnName);
      callback(null, columnExists);
    }
  });
}

// Функция для добавления колонки, если она не существует
function addColumnIfNotExists(db, tableName, columnName, columnType) {
  checkColumnExists(db, tableName, columnName, (err, exists) => {
    if (err) {
      console.error(`Ошибка при проверке существования колонки: ${err.message}`);
    } else if (!exists) {
      const alterTableQuery = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`;
      db.run(alterTableQuery, (err) => {
        if (err) {
          console.error(`Ошибка при добавлении колонки "${columnName}": ${err.message}`);
        } else {
          console.log(`Колонка "${columnName}" добавлена.`);
        }
      });
    }
  });
}

// Функция для удаления колонки, если она существует
function removeColumnIfExists(db, tableName, columnName) {
  checkColumnExists(db, tableName, columnName, (err, exists) => {
    if (err) {
      console.error(`Ошибка при проверке существования колонки: ${err.message}`);
    } else if (exists) {
      const alterTableQuery = `ALTER TABLE ${tableName} DROP COLUMN ${columnName}`;
      db.run(alterTableQuery, (err) => {
        if (err) {
          console.error(`Ошибка при удалении колонки "${columnName}": ${err.message}`);
        } else {
          console.log(`Колонка "${columnName}" удалена.`);
        }
      });
    }
  });
}

// Инициализируем базу данных
const db = new sqlite3.Database('visiting_cards.db', (err) => {
  if (err) {
    console.error('Ошибка при открытии базы данных:', err.message);
  } else {
    // Создание таблицы, если она не существует
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT,
        phone TEXT,
        avatar TEXT,
        social TEXT,
        link TEXT, -- Добавляем колонку "link"
        description TEXT
      )
    `;

    // Выполнение миграций
    db.serialize(() => {
      db.run(createTableQuery, (err) => {
        if (err) {
          console.error('Ошибка при создании таблицы:', err.message);
        } else {
          console.log('Таблица "cards" создана или уже существует.');

          // Добавляем/обновляем колонку "address"
          addColumnIfNotExists(db, 'cards', 'address', 'TEXT');
          
          // Удаляем колонку "old_column" (если она есть)
          removeColumnIfExists(db, 'cards', 'old_column');

          // Добавляем колонку "avatar"
          addColumnIfNotExists(db, 'cards', 'avatar', 'TEXT');
          
          // Добавляем колонку "link" (если ее нет)
          addColumnIfNotExists(db, 'cards', 'link', 'TEXT');
        }
      });
    });

    db.close();
  }
});
