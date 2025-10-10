const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');

const app = express();
const port = 8080;

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/', (req, res) => res.redirect('/docs'));

app.listen(port, () => {
    console.log(`API up at: http://localhost:${port}`);
});
