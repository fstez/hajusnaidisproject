const express = require('express');
const swaggerUi = require('swagger-ui-express');
//const swaggerDocument = require('./docs/swagger.json');

const app = express();
const port = 8080;
const yamljs = require('yamljs')
const swaggerDocument = yamljs.load('./docs/swagger.yaml')
app.use(express.json());

// данные
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

// POST /games — создание игры
app.post('/games', (req, res) => {
    // проверка Content-Type
    if (!req.is('application/json')) {
        return res.status(415).json({ error: 'Unsupported Media Type. Use application/json.' });
    }

    const { name, price } = req.body || {};

    // обязательные поля
    if (!name || price === undefined) {
        return res.status(400).json({ error: 'Missing required parameters: name, price' });
    }
    if (typeof name !== 'string' || String(name).trim().length === 0) {
        return res.status(400).json({ error: 'Invalid name' });
    }
    if (typeof price !== 'number' || Number.isNaN(price) || price < 0) {
        return res.status(422).json({ error: 'Invalid price (must be >= 0 number)' });
    }
    // уникальность по name (для примера)
    if (games.some(g => g.name.toLowerCase() === name.toLowerCase())) {
        return res.status(409).json({ error: `Game '${name}' already exists` });
    }

    const newGame = { id: games.length ? Math.max(...games.map(g => g.id)) + 1 : 1, name, price };
    games.push(newGame);

    // 201 Created + Location + тело ресурса
    res.status(201)
        .location(`/games/${newGame.id}`)
        .json(newGame);
});

// GET /games — имена (поиск + сортировка)
app.get('/games', (req, res) => {
    const { q, order = 'asc' } = req.query;
    if (order && !['asc', 'desc'].includes(order)) {
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

// GET /games/:id — детали
app.get('/games/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid id. Must be a positive integer.' });
    }
    const game = games.find(g => g.id === id);
    if (!game) return res.status(404).json({ error: `Game with id=${id} not found` });
    res.json(game);
});

// Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/', (req, res) => res.redirect('/docs'));

app.listen(port, () => console.log(`API up at: http://localhost:${port}`));
