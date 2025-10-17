require('dotenv').config();
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');
const mongoose = require('mongoose');
const Game = require('./models/game');

const app = express();
const port = process.env.PORT || 8080;

// Подключение к MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch((error) => console.error('❌ Error connecting to MongoDB Atlas:', error));

// Middleware
app.use(express.json());

// --- Временные тестовые данные (если база пустая) ---
const games = [
    { id: 1, name: 'Witcher 3', price: 29.99 },
    { id: 2, name: 'Cyberpunk 2077', price: 59.99 },
    { id: 3, name: 'Minecraft', price: 26.99 },
    { id: 4, name: 'Counter-Strike: Global Offensive', price: 0 },
    { id: 5, name: 'Roblox', price: 0 },
    { id: 6, name: 'Grand Theft Auto V', price: 29.99 },
    { id: 7, name: 'Valorant', price: 0 },
    { id: 8, name: 'Forza Horizon 5', price: 59.99 }
];

// --- API endpoints ---

// POST /games — создать игру
app.post('/games', (req, res) => {
    if (!req.body.name || !req.body.price) {
        return res.status(400).json({ error: 'One or all params are missing' });
    }

    const game = {
        id: games.length + 1,
        name: req.body.name,
        price: req.body.price
    };

    games.push(game);
    res
        .status(201)
        .location(`${getBaseUrl(req)}/games/${game.id}`)
        .json(game);
});

// GET /games — список игр (поиск + сортировка)
app.get('/games', (req, res) => {
    const { q, order = 'asc' } = req.query;
    if (!['asc', 'desc'].includes(order)) {
        return res.status(400).json({ error: 'Invalid order. Use asc or desc.' });
    }

    let list = games.map(g => g.name);
    if (q && q.trim()) {
        const s = q.toLowerCase();
        list = list.filter(n => n.toLowerCase().includes(s));
    }

    list.sort((a, b) => a.localeCompare(b));
    if (order === 'desc') list.reverse();

    res.json(list);
});

// GET /games/:id — детали игры
app.get('/games/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid id. Must be a positive integer.' });
    }

    const game = games.find(g => g.id === id);
    if (!game) return res.status(404).json({ error: `Game with id=${id} not found` });

    res.json(game);
});

// DELETE /games/:id — удалить игру
app.delete('/games/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid id. Must be a positive integer.' });
    }

    const idx = games.findIndex(g => g.id === id);
    if (idx === -1) {
        return res.status(404).json({ error: 'Game not found' });
    }

    games.splice(idx, 1);
    res.status(204).end();
});

// Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/', (req, res) => res.redirect('/docs'));

// Запуск сервера
app.listen(port, () => console.log(`🚀 API running at: http://localhost:${port}`));

function getBaseUrl(req) {
    const protocol = req.connection && req.connection.encrypted ? 'https' : 'http';
    return `${protocol}://${req.headers.host}`;
}
