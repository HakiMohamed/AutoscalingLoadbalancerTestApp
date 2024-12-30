const express = require('express');
const morgan = require('morgan');
const os = require('os');

const app = express();
const port = process.env.PORT || 3000;

// Configuration EJS
app.set('view engine', 'ejs');
app.set('views', './views');

// Middleware
app.use(morgan('combined'));
app.use(express.json());

// Middleware pour passer os à toutes les vues
app.use((req, res, next) => {
    res.locals.os = os;
    next();
});

// Routes principales
app.get('/', async (req, res) => {
    try {
        const data = {
            title: 'Dashboard AWS',
            message: 'Bienvenue au Workshop AWS Scaling!',
            instance: os.hostname(),
            timestamp: new Date().toISOString()
        };
        res.render('index', data);
    } catch (error) {
        res.render('error', { error });
    }
});

app.get('/health-check', async (req, res) => {
    try {
        const healthData = {
            title: 'État du Système',
            status: 'healthy',
            uptime: process.uptime(),
            memory: {
                total: os.totalmem(),
                free: os.freemem(),
                usage: `${((1 - os.freemem() / os.totalmem()) * 100).toFixed(2)}%`
            }
        };
        res.render('health', healthData);
    } catch (error) {
        res.render('error', { error });
    }
});

app.get('/load-test', async (req, res) => {
    res.render('load', { title: 'Test de Charge' });
});

app.post('/execute-load', async (req, res) => {
    try {
        const duration = req.body.duration || 5000;
        const start = Date.now();
        
        await new Promise(resolve => {
            const endTime = Date.now() + parseInt(duration);
            while (Date.now() < endTime) {
                // Simulation de charge CPU
            }
            resolve();
        });

        res.json({
            success: true,
            message: 'Test de charge terminé',
            duration: `${Date.now() - start}ms`,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

app.get('/system-info', async (req, res) => {
    try {
        const systemInfo = {
            title: 'Informations Système',
            hostname: os.hostname(),
            platform: os.platform(),
            cpus: {
                count: os.cpus().length,
                model: os.cpus()[0].model,
                speed: `${os.cpus()[0].speed} MHz`
            },
            memory: {
                total: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
                free: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`
            },
            uptime: `${(os.uptime() / 3600).toFixed(2)} hours`,
            network: os.networkInterfaces()
        };
        res.render('system', systemInfo);
    } catch (error) {
        res.render('error', { error });
    }
});

app.listen(port, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${port}`);
});