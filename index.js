require('dotenv').config();
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');
const mongoose = require('mongoose');
const cors = require('cors');
const Game = require('./models/game');

const app = express();
const port = process.env.PORT || 8080;

// --- DB ---
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch((error) => console.error('❌ Error connecting to MongoDB Atlas:', error));

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // выдаёт public/test.html и т.п.

// --- helpers ---
function bad(req, res, code, msg) { return res.status(code).json({ error: msg }); }
function getBaseUrl(req) {
    const protocol = req.connection && req.connection.encrypted ? 'https' : 'http';
    return `${protocol}://${req.headers.host}`;
}
function isNum(v) { return typeof v === 'number' && !Number.isNaN(v); }

// --- API ---
// CREATE
app.post('/games', async (req, res) => {
    try {
        const { name, price } = req.body || {};
        if (typeof name !== 'string' || !name.trim() || !isNum(Number(price))) {
            return bad(req, res, 400, 'Invalid body. Expect { name: string, price: number }');
        }

        // ауто-инкремент id (простой способ)
        const last = await Game.findOne().sort({ id: -1 }).lean();
        const nextId = (last?.id || 0) + 1;

        const created = await Game.create({
            id: nextId,
            name: name.trim(),
            price: Number(price)
        });

        // уберём служебные поля
        const { _id, __v, ...clean } = created.toObject();
        return res.status(201)
            .location(`${getBaseUrl(req)}/games/${clean.id}`)
            .json(clean);
    } catch (e) {
        // нарушение unique(id) и т.п.
        return bad(req, res, 422, e.message || 'Unprocessable Entity');
    }
});

// READ list (поиск + сортировка), возвращаем ОБЪЕКТЫ
app.get('/games', async (req, res) => {
    try {
        const { q, order = 'asc' } = req.query;
        if (!['asc', 'desc'].includes(order)) {
            return bad(req, res, 400, 'Invalid order. Use asc or desc.');
        }

        const query = {};
        if (q && q.trim()) {
            query.name = { $regex: q.trim(), $options: 'i' };
        }

        const sort = { name: order === 'asc' ? 1 : -1 };
        const rows = await Game.find(query, { _id: 0, __v: 0 }).sort(sort).lean();
        return res.json(rows);
    } catch (e) {
        return bad(req, res, 500, e.message || 'Server error');
    }
});

// READ item
app.get('/games/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return bad(req, res, 400, 'Invalid id. Must be a positive integer.');
    }
    const game = await Game.findOne({ id }, { _id: 0, __v: 0 }).lean();
    if (!game) return bad(req, res, 404, `Game with id=${id} not found`);
    return res.json(game);
});

// UPDATE (полная замена name/price)
app.put('/games/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return bad(req, res, 400, 'Invalid id. Must be a positive integer.');
    }
    const { name, price } = req.body || {};
    if (typeof name !== 'string' || !name.trim() || !isNum(Number(price))) {
        return bad(req, res, 400, 'Invalid body. Expect { name: string, price: number }');
    }

    const updated = await Game.findOneAndUpdate(
        { id },
        { $set: { name: name.trim(), price: Number(price) } },
        { new: true, projection: { _id: 0, __v: 0 } }
    ).lean();

    if (!updated) return bad(req, res, 404, 'Game not found');
    return res.json(updated);
});

// PATCH (частичное обновление; опционально фронт может использовать PUT)
app.patch('/games/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return bad(req, res, 400, 'Invalid id. Must be a positive integer.');
    }
    const patch = {};
    if (req.body?.name !== undefined) {
        if (typeof req.body.name !== 'string' || !req.body.name.trim())
            return bad(req, res, 400, 'Invalid name');
        patch.name = req.body.name.trim();
    }
    if (req.body?.price !== undefined) {
        if (!isNum(Number(req.body.price)))
            return bad(req, res, 400, 'Invalid price');
        patch.price = Number(req.body.price);
    }
    if (!Object.keys(patch).length) return bad(req, res, 400, 'No fields to update');

    const updated = await Game.findOneAndUpdate(
        { id }, { $set: patch },
        { new: true, projection: { _id: 0, __v: 0 } }
    ).lean();

    if (!updated) return bad(req, res, 404, 'Game not found');
    return res.json(updated);
});

// DELETE
app.delete('/games/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return bad(req, res, 400, 'Invalid id. Must be a positive integer.');
    }
    const deleted = await Game.findOneAndDelete({ id }).lean();
    if (!deleted) return bad(req, res, 404, 'Game not found');
    return res.status(204).end();
});

// Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/', (req, res) => res.redirect('/docs'));

// favicon 204, чтобы консоль не мусорила
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.listen(port, () => console.log(`🚀 API running at: http://localhost:${port}`));
