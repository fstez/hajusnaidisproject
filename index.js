const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');

const app = express();
const port = 8080;

const games = ["Minecraft", "Counter-Strike 2", "Dota 2", "Stardew Valley", "Terraria"];

app.get('/games', (req, res) => {
    const { q, order = 'asc' } = req.query;

    // валидация order
    if (order && !['asc', 'desc'].includes(order)) {
        return res.status(400).json({ error: 'Invalid order. Use asc or desc.' });
    }

    let list = [...games];

    // поиск по подстроке, регистронезависимо
    if (q && q.trim()) {
        const s = q.toLowerCase();
        list = list.filter(n => n.toLowerCase().includes(s));
    }

    // сортировка по имени
    list.sort((a, b) => a.localeCompare(b));
    if (order === 'desc') list.reverse();

    res.json(list);
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/', (req, res) => res.redirect('/docs'));

app.listen(port, () => {
    console.log(`API up at: http://localhost:${port}`);
});
