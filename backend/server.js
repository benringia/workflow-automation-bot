console.log("SERVER LOADED");
require('dotenv').config({ path: './backend/.env' });
const app = require('./app');
const debugController = require('./controllers/debugController');
const generateFeatureController = require('./controllers/generateFeatureController');
const refactorController = require('./controllers/refactorController');
const explainCodeController = require('./controllers/explainCodeController');
const routeController = require('./controllers/routeController');

const PORT = process.env.PORT || 5000;

app.post('/debug', debugController.handleDebug);
app.post('/generate-feature', generateFeatureController.handleGenerateFeature);
app.post('/refactor', refactorController.handleRefactor);
app.post('/explain-code', explainCodeController.handleExplainCode);
app.post('/route', routeController.handleRoute);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});