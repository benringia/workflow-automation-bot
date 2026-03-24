require('dotenv').config({ path: './backend/.env' });

if (!process.env.CLAUDE_API_KEY) {
    console.error('FATAL: CLAUDE_API_KEY environment variable is not set. Exiting.');
    process.exit(1);
}

const app = require('./app');
const debugController = require('./controllers/debugController');
const generateFeatureController = require('./controllers/generateFeatureController');
const refactorController = require('./controllers/refactorController');
const explainCodeController = require('./controllers/explainCodeController');
const routeController = require('./controllers/routeController');
const routeStreamController = require('./controllers/routeStreamController');
const workflowController = require('./controllers/workflowController');

const PORT = process.env.PORT || 5000;

console.log(`Starting server — PORT=${PORT}, NODE_ENV=${process.env.NODE_ENV || 'development'}`);

app.post('/debug', debugController.handleDebug);
app.post('/generate-feature', generateFeatureController.handleGenerateFeature);
app.post('/refactor', refactorController.handleRefactor);
app.post('/explain-code', explainCodeController.handleExplainCode);
app.post('/route', routeController.handleRoute);
app.post('/route-stream', routeStreamController.handleRouteStream);
app.post('/workflow/run', workflowController.handleWorkflowRun);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});