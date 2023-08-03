const express = require('express');
const multer = require('multer');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const qrcode = require('qrcode');

const app = express();

// Инициализируем базу данных
const db = new sqlite3.Database('visiting_cards.db');

// Создаем таблицу для визиток
// CREATE TABLE IF NOT EXISTS cards (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, phone TEXT, avatar TEXT, social TEXT, description TEXT)
db.run(
    'CREATE TABLE IF NOT EXISTS cards (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, phone TEXT, avatar TEXT, social TEXT, description TEXT)'
  );
  

// Set up storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const upload = multer({ storage });

// Разрешаем использовать JSON в запросах
app.use(express.json());

// Разрешаем обработку данных формы
app.use(express.urlencoded({ extended: true }));

// Указываем путь к статическим файлам
app.use(express.static(path.join(__dirname, 'public')));

// Устанавливаем EJS в качестве шаблонизатора
app.set('view engine', 'ejs');

// Главная страница
app.get('/', (req, res) => {
  db.all('SELECT * FROM cards', (err, cards) => {
    if (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    } else {
      res.render('index', { cards });
    }
  });
});

// Страница создания новой визитки
app.get('/create', (req, res) => {
  res.render('create');
});

// Обработка данных новой визитки
app.post('/create', upload.single('avatar'), (req, res) => {
    const { name, email, phone, social, description } = req.body;
    const avatar = req.file ? '/uploads/' + req.file.filename : '';
    const newLinks = req.body.newLink ? req.body.newLink.split(',') : [];
  
    // ... existing code ...
  
    // Добавление данных в базу данных
    db.run(
      'INSERT INTO cards (name, email, phone, avatar, social, description) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, phone, avatar, social, description],
      function (err) {
        if (err) {
          console.error(err);
          res.status(500).send('Внутренняя ошибка сервера');
        } else {
          const cardId = this.lastID;
  
          // Add the new links to the database
          newLinks.forEach((link) => {
            const linkParts = link.split(',');
            const linkName = linkParts[0].trim();
            const linkURL = linkParts[1].trim();
  
            db.run(
              'INSERT INTO links (card_id, name, url) VALUES (?, ?, ?)',
              [cardId, linkName, linkURL],
              (linkErr) => {
                if (linkErr) {
                  console.error(linkErr);
                }
              }
            );
          });
  
          res.redirect('/');
        }
      }
    );
  });
  
  

// Страница для просмотра одной визитки по id
app.get('/card/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM cards WHERE id = ?', id, (err, card) => {
    if (err || !card) {
      console.error(err);
      res.status(404).send('Card not found');
    } else {
      const url = `http://localhost:3000/card/${card.id}`;
      qrcode.toDataURL(url, (err, qrCodeData) => {
        if (err) {
          console.error(err);
          res.status(500).send('Error generating QR code');
        } else {
          res.render('card', { card, qrCodeData });
        }
      });
    }
  });
});

// Запуск сервера на портах 80 и 443
const http = require('http');
const https = require('https');
const fs = require('fs');



const httpServer = http.createServer(app);

httpServer.listen(80, () => {
  console.log('HTTP Server running on port 80');
});
