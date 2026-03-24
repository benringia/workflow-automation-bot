const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/ping', (req, res) => res.send('pong'));

module.exports = app;
