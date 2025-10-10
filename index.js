const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');

const app = express();
const port = 8080;

// теперь игры — объекты с деталями
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

// GET /games — список ИМЁН (без деталей) + поиск + сортировка
app.get('/games', (req, res) => {
    const { q, order = 'asc' } = req.query;
    if (order && !['asc', 'desc'].includes(order)) {
        return res.status(400).json({ error: 'Invalid order. Use asc or desc.' });
    }

    // работаем по name
    let list = games.map(g => g.name);

    if (q && q.trim()) {
        const s = q.toLowerCase();
        list = list.filter(n => n.toLowerCase().includes(s));
    }

    list.sort((a, b) => a.localeCompare(b));
    if (order === 'desc') list.reverse();

    res.json(list);
});

// GET /games/:id — детали одной игры
app.get('/games/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid id. Must be a positive integer.' });
    }

    const game = games.find(g => g.id === id);
    if (!game) {
        return res.status(404).json({ error: `Game with id=${id} not found` });
    }

    res.json(game); // детали
});

// Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/', (req, res) => res.redirect('/docs'));

app.listen(port, () => {
    console.log(`API up at: http://localhost:${port}`);
});
