const express = require('express');
const app = express();

/**
 * Middleware: Support for JSON, URL-encoded, and Raw Text bodies.
 * Must be applied before routes to ensure req.body is correctly populated.
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

// Health check route
app.get('/health', (req, res) => {
    res.json({ status: "ok" });
});

module.exports = app;
