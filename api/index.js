const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const { connectMongo } = require('./db');
const snapshotsRouter = require('./routes/snapshots');

const app = express();
const PORT = process.env.API_PORT || 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.static(__dirname));
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/', snapshotsRouter);

connectMongo(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API listening on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB', error);
    process.exit(1);
  });
