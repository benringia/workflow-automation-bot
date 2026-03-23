require('dotenv').config();
const app = require('./app');
const debugController = require('./controllers/debugController');

const PORT = process.env.PORT || 3000;

/**
 * Register the /debug route before starting the server.
 * Ensure it uses the app instance where JSON middleware is applied.
 */
app.post('/debug', debugController.handleDebug);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});